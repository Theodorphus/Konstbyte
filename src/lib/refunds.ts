import type Stripe from 'stripe';
import prisma from './prisma';
import { adminEmails } from './admin';
import { sendEmail } from './email';
import { APP_URL } from './urls';

// What happens to the artist's payout when money goes back to the buyer.
//
// Refunds made in the Stripe Dashboard (e.g. a return) and card disputes used to
// leave the order looking paid, so it was still auto-confirmed after 14 days and
// the artist was paid on top of the refund. These handlers stop that:
//   - full refund   → order 'refunded', payout 'cancelled'
//   - partial refund→ payout 'on_hold' until an admin sorts it out
//   - dispute       → payout 'on_hold'; released again if Konstbyte wins, cancelled if it loses
// If the artist has already been paid, the order is flagged and the admins are
// emailed, since the transfer has to be reclaimed by hand.

async function orderIdFor(paymentIntent: string | Stripe.PaymentIntent | null, metadata?: Stripe.Metadata | null) {
  if (metadata?.orderId) return metadata.orderId;
  const piId = typeof paymentIntent === 'string' ? paymentIntent : paymentIntent?.id;
  if (!piId) return null;
  const payment = await prisma.payment.findUnique({ where: { stripeId: piId }, select: { orderId: true } });
  return payment?.orderId ?? null;
}

async function loadOrder(orderId: string) {
  return prisma.order.findUnique({
    where: { id: orderId },
    select: {
      id: true,
      status: true,
      sellerId: true,
      buyerId: true,
      sellerPayoutStatus: true,
      artwork: { select: { title: true } },
    },
  });
}

type LoadedOrder = NonNullable<Awaited<ReturnType<typeof loadOrder>>>;

async function alertAdmins(subject: string, order: LoadedOrder, body: string) {
  const html = `<div style="font-family:sans-serif;max-width:560px">
    <p>${body}</p>
    <p>Order: <a href="${APP_URL}/orders/${order.id}">#${order.id.slice(-8).toUpperCase()}</a></p>
  </div>`;
  await Promise.allSettled(adminEmails().map((to) => sendEmail({ to, subject, html })));
}

async function hold(order: LoadedOrder, eventType: string, message: string) {
  await prisma.$transaction([
    prisma.order.update({
      where: { id: order.id },
      data: { sellerPayoutStatus: 'on_hold', sellerPayoutNote: message },
    }),
    prisma.orderEvent.create({ data: { orderId: order.id, type: eventType, message } }),
  ]);
}

export async function handleChargeRefunded(charge: Stripe.Charge) {
  const orderId = await orderIdFor(charge.payment_intent, charge.metadata);
  if (!orderId) return;
  const order = await loadOrder(orderId);
  // Already refunded by us (e.g. two buyers paid for the same artwork).
  if (!order || order.status === 'refunded') return;

  const refundedSek = (charge.amount_refunded / 100).toLocaleString('sv-SE');
  const alreadyPaid = order.sellerPayoutStatus === 'paid';

  if (!charge.refunded) {
    // Partial refund: the payout would be too high, so stop it.
    const message = `Delvis återbetald till köparen (${refundedSek} kr). Utbetalningen till konstnären är pausad.`;
    if (alreadyPaid) {
      await prisma.orderEvent.create({ data: { orderId: order.id, type: 'partially_refunded', message } });
    } else {
      await hold(order, 'partially_refunded', message);
    }
    await alertAdmins(
      `Delvis återbetalning: ${order.artwork.title}`,
      order,
      alreadyPaid
        ? `Köparen fick tillbaka ${refundedSek} kr, men konstnären har redan fått betalt. Kräv vid behov tillbaka mellanskillnaden från konstnären.`
        : `Köparen fick tillbaka ${refundedSek} kr. Utbetalningen till konstnären är pausad. Gå till Admin → Utbetalningar och välj "Släpp" (konstnären får sin andel av det köparen behöll) eller "Avbryt".`,
    );
    return;
  }

  // Full refund.
  await prisma.$transaction([
    prisma.order.update({
      where: { id: order.id },
      data: {
        status: 'refunded',
        ...(alreadyPaid ? {} : { sellerPayoutStatus: 'cancelled', sellerPayoutNote: 'Köpet återbetalades.' }),
      },
    }),
    prisma.payout.updateMany({
      where: { orderId: order.id, status: { not: 'completed' } },
      data: { status: 'cancelled' },
    }),
    prisma.orderEvent.create({
      data: { orderId: order.id, type: 'refunded', message: `Hela beloppet (${refundedSek} kr) har återbetalats till köparen.` },
    }),
    prisma.notification.create({
      data: {
        userId: order.buyerId,
        type: 'order_refunded',
        message: `Du har fått tillbaka ${refundedSek} kr för "${order.artwork.title}".`,
        link: `/orders/${order.id}`,
      },
    }),
    ...(order.sellerId
      ? [
          prisma.notification.create({
            data: {
              userId: order.sellerId,
              type: 'order_refunded',
              message: `Köpet av "${order.artwork.title}" har återbetalats till köparen.${alreadyPaid ? ' Konstbyte kontaktar dig om utbetalningen.' : ' Ingen utbetalning görs.'}`,
              link: '/seller/orders',
            },
          }),
        ]
      : []),
  ]);

  if (alreadyPaid) {
    await alertAdmins(
      `Återbetald efter utbetalning: ${order.artwork.title}`,
      order,
      `Köparen har fått tillbaka hela beloppet (${refundedSek} kr), men konstnären har redan fått betalt. Kräv tillbaka överföringen (Stripe → Connect → konstnärens konto → Transfers → Reverse) eller kontakta konstnären.`,
    );
  }
}

export async function handleDisputeCreated(dispute: Stripe.Dispute) {
  const orderId = await orderIdFor(dispute.payment_intent, dispute.metadata);
  if (!orderId) return;
  const order = await loadOrder(orderId);
  if (!order) return;

  const message = 'Köparen har bestridit betalningen hos sin bank. Utbetalningen till konstnären är pausad.';
  const alreadyPaid = order.sellerPayoutStatus === 'paid';
  if (alreadyPaid) {
    await prisma.orderEvent.create({ data: { orderId: order.id, type: 'disputed', message } });
  } else {
    await hold(order, 'disputed', message);
  }
  await alertAdmins(
    `Tvist (chargeback): ${order.artwork.title}`,
    order,
    `Köparen har bestridit betalningen. Svara på tvisten i Stripe (Payments → Disputes) före deadline, med t.ex. spårningsnummer och bevis på leverans.${alreadyPaid ? ' Konstnären har redan fått betalt.' : ' Utbetalningen till konstnären är pausad.'}`,
  );
}

export async function handleDisputeClosed(dispute: Stripe.Dispute) {
  const orderId = await orderIdFor(dispute.payment_intent, dispute.metadata);
  if (!orderId) return;
  const order = await loadOrder(orderId);
  if (!order || order.sellerPayoutStatus !== 'on_hold') return;

  // Only 'lost' means the money is gone. 'won' and 'warning_closed' (a bank
  // inquiry that never became a chargeback) both release the payout again.
  const won = dispute.status !== 'lost';
  await prisma.$transaction([
    prisma.order.update({
      where: { id: order.id },
      // Won: back to the normal flow (the daily cron pays the artist once delivered).
      data: won
        ? { sellerPayoutStatus: 'unpaid', sellerPayoutNote: null }
        : { sellerPayoutStatus: 'cancelled', sellerPayoutNote: 'Tvisten förlorades.' },
    }),
    prisma.orderEvent.create({
      data: {
        orderId: order.id,
        type: won ? 'dispute_won' : 'dispute_lost',
        message: won ? 'Tvisten är avslutad och pengarna finns kvar.' : 'Tvisten förlorades. Ingen utbetalning görs.',
      },
    }),
  ]);
}
