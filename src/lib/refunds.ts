import type Stripe from 'stripe';
import prisma from './prisma';
import stripe from './stripe';
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
// If the artist has already been paid, the money is taken back from their Stripe
// account (the terms make refunds and chargebacks the seller's): the transfer is
// reversed, and for a dispute that Konstbyte wins it is sent back to them. The
// admins are only emailed when Stripe refuses, so it has to be done by hand.

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
      amount: true,
      sellerId: true,
      buyerId: true,
      sellerPayoutStatus: true,
      artwork: { select: { title: true } },
      seller: { select: { stripeAccountId: true } },
      payout: { select: { amount: true, sellerPayoutAmount: true } },
    },
  });
}

type LoadedOrder = NonNullable<Awaited<ReturnType<typeof loadOrder>>>;

const sek = (ore: number) => `${(ore / 100).toLocaleString('sv-SE')} kr`;

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

/**
 * Takes money back from the artist after they were paid, by reversing the
 * order's Stripe transfers until the artist has at most `keepOre` of them left.
 * Returns how much was reversed now (öre), or null if Stripe refused.
 */
async function reclaimFromArtist(orderId: string, keepOre: number, metadata: Record<string, string>): Promise<number | null> {
  try {
    const { data: transfers } = await stripe.transfers.list({ transfer_group: orderId, limit: 20 });
    let net = transfers.reduce((sum, t) => sum + t.amount - t.amount_reversed, 0);
    let reversed = 0;
    for (const transfer of transfers) {
      const excess = net - keepOre;
      if (excess <= 0) break;
      const amount = Math.min(excess, transfer.amount - transfer.amount_reversed);
      if (amount <= 0) continue;
      await stripe.transfers.createReversal(
        transfer.id,
        { amount, metadata: { orderId, ...metadata } },
        // Tied to the transfer's state, so a retried webhook can't reverse twice.
        { idempotencyKey: `konstbyte-reclaim-${transfer.id}-${transfer.amount_reversed}-${amount}` },
      );
      net -= amount;
      reversed += amount;
    }
    return reversed;
  } catch (err) {
    console.error(`[refunds] could not reclaim the payout for order ${orderId}:`, err);
    return null;
  }
}

/** The artist's notice about money taken back or paid back, as transaction steps. */
function sellerNotice(order: LoadedOrder, message: string) {
  return order.sellerId
    ? [prisma.notification.create({ data: { userId: order.sellerId, type: 'payout_reclaimed', message, link: '/seller/payouts' } })]
    : [];
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
    if (!alreadyPaid) {
      await hold(order, 'partially_refunded', message);
      await alertAdmins(
        `Delvis återbetalning: ${order.artwork.title}`,
        order,
        `Köparen fick tillbaka ${refundedSek} kr. Utbetalningen till konstnären är pausad. Gå till Admin → Utbetalningar och välj "Släpp" (konstnären får sin andel av det köparen behöll) eller "Avbryt".`,
      );
      return;
    }

    // Already paid: the artist gives back what the buyer got back since then.
    let reclaimed: number | null = null;
    if (order.payout) {
      const refundedBeforePayout = Math.round((order.amount - order.payout.amount) * 100);
      const refundedSince = Math.max(0, charge.amount_refunded - refundedBeforePayout);
      const keep = Math.max(0, Math.round(order.payout.sellerPayoutAmount * 100) - refundedSince);
      reclaimed = await reclaimFromArtist(order.id, keep, { reason: 'partial_refund' });
    }
    if (reclaimed === null) {
      await prisma.orderEvent.create({ data: { orderId: order.id, type: 'partially_refunded', message } });
      await alertAdmins(
        `Delvis återbetalning: ${order.artwork.title}`,
        order,
        `Köparen fick tillbaka ${refundedSek} kr, men konstnären har redan fått betalt och pengarna kunde inte dras tillbaka automatiskt. Kräv tillbaka mellanskillnaden (Stripe → Connect → konstnärens konto → Transfers → Reverse).`,
      );
      return;
    }
    await prisma.$transaction([
      prisma.orderEvent.create({
        data: {
          orderId: order.id,
          type: 'partially_refunded',
          message: `Delvis återbetald till köparen (${refundedSek} kr). ${sek(reclaimed)} har dragits tillbaka från konstnären.`,
        },
      }),
      ...(reclaimed > 0
        ? sellerNotice(order, `Köparen har fått tillbaka en del av betalningen för "${order.artwork.title}". ${sek(reclaimed)} har dragits tillbaka från ditt Stripe-konto.`)
        : []),
    ]);
    return;
  }

  // Full refund. If the artist was already paid, take the payout back first.
  const reclaimed = alreadyPaid ? await reclaimFromArtist(order.id, 0, { reason: 'refund' }) : 0;
  const sellerMessage = !alreadyPaid
    ? ' Ingen utbetalning görs.'
    : reclaimed === null
      ? ' Konstbyte kontaktar dig om utbetalningen.'
      : ` Utbetalningen (${sek(reclaimed)}) har dragits tillbaka från ditt Stripe-konto.`;

  await prisma.$transaction([
    prisma.order.update({
      where: { id: order.id },
      data: {
        status: 'refunded',
        ...(alreadyPaid && reclaimed === null ? {} : { sellerPayoutStatus: 'cancelled', sellerPayoutNote: 'Köpet återbetalades.' }),
      },
    }),
    prisma.payout.updateMany({
      where: { orderId: order.id, status: { not: 'completed' } },
      data: { status: 'cancelled' },
    }),
    prisma.orderEvent.create({
      data: {
        orderId: order.id,
        type: 'refunded',
        message: `Hela beloppet (${refundedSek} kr) har återbetalats till köparen.${alreadyPaid && reclaimed !== null ? ` ${sek(reclaimed)} har dragits tillbaka från konstnären.` : ''}`,
      },
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
              message: `Köpet av "${order.artwork.title}" har återbetalats till köparen.${sellerMessage}`,
              link: '/seller/orders',
            },
          }),
        ]
      : []),
  ]);

  if (alreadyPaid && reclaimed === null) {
    await alertAdmins(
      `Återbetald efter utbetalning: ${order.artwork.title}`,
      order,
      `Köparen har fått tillbaka hela beloppet (${refundedSek} kr), men konstnären har redan fått betalt och pengarna kunde inte dras tillbaka automatiskt. Kräv tillbaka överföringen (Stripe → Connect → konstnärens konto → Transfers → Reverse) eller kontakta konstnären.`,
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
  let reclaimed: number | null = null;
  if (alreadyPaid) {
    // Stripe takes the disputed amount from Konstbyte now, so take it back from
    // the artist now too. It goes back to them if Konstbyte wins.
    reclaimed = await reclaimFromArtist(order.id, 0, { reason: 'dispute', dispute: dispute.id });
    await prisma.$transaction([
      prisma.orderEvent.create({
        data: {
          orderId: order.id,
          type: 'disputed',
          message: reclaimed === null
            ? 'Köparen har bestridit betalningen hos sin bank. Konstnären har redan fått betalt.'
            : `Köparen har bestridit betalningen hos sin bank. ${sek(reclaimed)} har dragits tillbaka från konstnären tills tvisten är avgjord.`,
        },
      }),
      ...(reclaimed
        ? sellerNotice(order, `Köparen har bestridit betalningen för "${order.artwork.title}" hos sin bank. ${sek(reclaimed)} har dragits tillbaka från ditt Stripe-konto tills tvisten är avgjord, och betalas tillbaka till dig om Konstbyte vinner.`)
        : []),
    ]);
  } else {
    await hold(order, 'disputed', message);
  }
  await alertAdmins(
    `Tvist (chargeback): ${order.artwork.title}`,
    order,
    `Köparen har bestridit betalningen. Svara på tvisten i Stripe (Payments → Disputes) före deadline, med t.ex. spårningsnummer och bevis på leverans.${
      !alreadyPaid
        ? ' Utbetalningen till konstnären är pausad.'
        : reclaimed === null
          ? ' Konstnären har redan fått betalt och pengarna kunde inte dras tillbaka automatiskt. Kräv tillbaka överföringen för hand.'
          : ` Konstnären hade redan fått betalt, så ${sek(reclaimed)} har dragits tillbaka från konstnären.`
    }`,
  );
}

/** Sum of what was reversed from the artist because of this dispute. */
async function reversedForDispute(orderId: string, disputeId: string): Promise<number> {
  const { data: transfers } = await stripe.transfers.list({ transfer_group: orderId, limit: 20 });
  return transfers
    .flatMap((t) => t.reversals?.data ?? [])
    .filter((r) => r.metadata?.dispute === disputeId)
    .reduce((sum, r) => sum + r.amount, 0);
}

export async function handleDisputeClosed(dispute: Stripe.Dispute) {
  const orderId = await orderIdFor(dispute.payment_intent, dispute.metadata);
  if (!orderId) return;
  const order = await loadOrder(orderId);
  if (!order) return;

  // Only 'lost' means the money is gone. 'won' and 'warning_closed' (a bank
  // inquiry that never became a chargeback) both release the payout again.
  const won = dispute.status !== 'lost';

  if (order.sellerPayoutStatus === 'paid') {
    await closePaidDispute(order, dispute, won);
    return;
  }
  if (order.sellerPayoutStatus !== 'on_hold') return;

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

/** A dispute on an order the artist had already been paid for. */
async function closePaidDispute(order: LoadedOrder, dispute: Stripe.Dispute, won: boolean) {
  let reversed: number;
  try {
    reversed = await reversedForDispute(order.id, dispute.id);
  } catch (err) {
    console.error(`[refunds] could not read the reversals for order ${order.id}:`, err);
    await alertAdmins(
      `Tvist avslutad: ${order.artwork.title}`,
      order,
      `Tvisten är ${won ? 'vunnen' : 'förlorad'}, men det gick inte att se vad som drogs tillbaka från konstnären. Kontrollera överföringarna i Stripe.`,
    );
    return;
  }

  if (!won) {
    await prisma.orderEvent.create({
      data: {
        orderId: order.id,
        type: 'dispute_lost',
        message: reversed > 0
          ? `Tvisten förlorades. ${sek(reversed)} som drogs tillbaka från konstnären behålls.`
          : 'Tvisten förlorades.',
      },
    });
    if (reversed > 0) {
      await Promise.all(sellerNotice(order, `Tvisten om "${order.artwork.title}" förlorades, så de ${sek(reversed)} som drogs tillbaka betalas inte ut igen.`));
    } else {
      await alertAdmins(
        `Tvist förlorad efter utbetalning: ${order.artwork.title}`,
        order,
        'Tvisten förlorades och konstnären hade redan fått betalt. Kräv tillbaka överföringen från konstnären.',
      );
    }
    return;
  }

  // Won: Konstbyte got the money back, so the artist gets theirs back too.
  if (reversed === 0) {
    await prisma.orderEvent.create({
      data: { orderId: order.id, type: 'dispute_won', message: 'Tvisten är avslutad och pengarna finns kvar.' },
    });
    return;
  }
  const accountId = order.seller?.stripeAccountId;
  try {
    if (!accountId) throw new Error('seller has no Stripe account');
    await stripe.transfers.create(
      {
        amount: reversed,
        currency: 'sek',
        destination: accountId,
        transfer_group: order.id,
        description: `Konstbyte – ${order.artwork.title} (tvisten vunnen)`,
        metadata: { orderId: order.id, dispute: dispute.id },
      },
      { idempotencyKey: `konstbyte-dispute-return-${dispute.id}` },
    );
  } catch (err) {
    console.error(`[refunds] could not pay back the artist for order ${order.id}:`, err);
    await alertAdmins(
      `Tvist vunnen: ${order.artwork.title}`,
      order,
      `Tvisten är vunnen, men de ${sek(reversed)} som drogs tillbaka från konstnären kunde inte betalas tillbaka automatiskt. Skicka dem till konstnären i Stripe.`,
    );
    return;
  }
  await prisma.$transaction([
    prisma.orderEvent.create({
      data: {
        orderId: order.id,
        type: 'dispute_won',
        message: `Tvisten är vunnen. ${sek(reversed)} har betalats tillbaka till konstnären.`,
      },
    }),
    ...sellerNotice(order, `Tvisten om "${order.artwork.title}" är avgjord till din fördel. ${sek(reversed)} har betalats tillbaka till ditt Stripe-konto.`),
  ]);
}
