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
// If the artist has already been paid through Stripe, the money is taken back
// from their Stripe account (the terms make refunds and chargebacks the
// seller's): the transfer is reversed, and for a dispute that Konstbyte wins it
// is sent back to them. The admins are emailed when that can't be done
// automatically: the artist was paid some other way, or Stripe refused.
//
// Stripe retries webhooks for days, and a retry may come after the money moved
// but before it was written down. So the order's history (OrderEvent) decides
// whether an event was already handled, and the amounts come from the
// reversals' metadata in Stripe, never from what one call happened to move.

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
      payout: { select: { amount: true, sellerPayoutAmount: true, method: true } },
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

/** Whether this step was already written down (a retried webhook). */
async function recorded(orderId: string, type: string, messageContains?: string) {
  const event = await prisma.orderEvent.findFirst({
    where: { orderId, type, ...(messageContains ? { message: { contains: messageContains } } : {}) },
    select: { id: true },
  });
  return event !== null;
}

function event(order: LoadedOrder, type: string, message: string) {
  return prisma.orderEvent.create({ data: { orderId: order.id, type, message } });
}

async function hold(order: LoadedOrder, eventType: string, message: string) {
  await prisma.$transaction([
    prisma.order.update({
      where: { id: order.id },
      data: { sellerPayoutStatus: 'on_hold', sellerPayoutNote: message },
    }),
    event(order, eventType, message),
  ]);
}

/** The artist's notice about money taken back or paid back, as transaction steps. */
function sellerNotice(order: LoadedOrder, message: string) {
  return order.sellerId
    ? [prisma.notification.create({ data: { userId: order.sellerId, type: 'payout_reclaimed', message, link: '/seller/payouts' } })]
    : [];
}

/** A bank inquiry: Stripe takes no money unless it becomes a chargeback. */
const isInquiry = (dispute: Stripe.Dispute) => dispute.status.startsWith('warning_');

// ── Taking money back from the artist ───────────────────────────────────────

const net = (transfers: Stripe.Transfer[]) => transfers.reduce((sum, t) => sum + t.amount - t.amount_reversed, 0);

/** Sum of the reversals whose metadata matches (öre). */
function reversedWhere(transfers: Stripe.Transfer[], match: (metadata: Stripe.Metadata) => boolean) {
  return transfers
    .flatMap((t) => t.reversals?.data ?? [])
    .filter((r) => match(r.metadata ?? {}))
    .reduce((sum, r) => sum + r.amount, 0);
}

/**
 * The order's Stripe transfers, or null when the artist wasn't paid through
 * Stripe. Throws when Stripe can't be reached.
 */
async function stripeTransfers(order: LoadedOrder): Promise<Stripe.Transfer[] | null> {
  if (order.payout?.method !== 'stripe') return null;
  const { data } = await stripe.transfers.list({ transfer_group: order.id, limit: 20 });
  // Return transfers after a won dispute are also in the group; only the
  // payout itself counts as "the artist was paid through Stripe".
  return data.some((t) => !t.metadata?.dispute) ? data : null;
}

/** Reverses `amount` öre across the transfers. */
async function reverse(transfers: Stripe.Transfer[], amount: number, metadata: Record<string, string>, key: string) {
  let left = amount;
  for (const transfer of transfers) {
    if (left <= 0) break;
    const part = Math.min(left, transfer.amount - transfer.amount_reversed);
    if (part <= 0) continue;
    await stripe.transfers.createReversal(
      transfer.id,
      { amount: part, metadata },
      // Tied to the transfer's state, so a retried webhook can't reverse twice.
      { idempotencyKey: `konstbyte-${key}-${transfer.id}-${transfer.amount_reversed}-${part}` },
    );
    left -= part;
  }
}

type Reclaim = {
  /** Taken back for this refund or dispute, earlier attempts included (öre). */
  taken: number;
  /** Taken back for all refunds on the order so far (öre). */
  refundsTotal: number;
  /** What the artist still has of the order's transfers afterwards (öre). */
  netAfter: number;
};

/**
 * After a refund: reverses the order's transfers until the artist has at most
 * `keepOre` left. `refundTotal` (the charge's amount_refunded) tags the
 * reversal, so a retry finds what this refund already took. Null when it
 * can't be done automatically.
 */
async function reclaimForRefund(order: LoadedOrder, keepOre: number, refundTotal: number): Promise<Reclaim | null> {
  try {
    const transfers = await stripeTransfers(order);
    if (!transfers) return null;
    const tag = String(refundTotal);
    const before = net(transfers);
    const now = Math.max(0, before - keepOre);
    await reverse(transfers, now, { orderId: order.id, reason: 'refund', refunded: tag }, `refund-${tag}`);
    return {
      taken: reversedWhere(transfers, (m) => m.refunded === tag) + now,
      refundsTotal: reversedWhere(transfers, (m) => m.reason === 'refund') + now,
      netAfter: before - now,
    };
  } catch (err) {
    console.error(`[refunds] could not reclaim the payout for order ${order.id}:`, err);
    return null;
  }
}

/** What has been reversed, and sent back, because of this dispute (öre). */
function disputeTotals(transfers: Stripe.Transfer[], disputeId: string) {
  const reversed = reversedWhere(transfers, (m) => m.dispute === disputeId);
  const returned = transfers.filter((t) => t.metadata?.dispute === disputeId).reduce((sum, t) => sum + t.amount, 0);
  return { reversed, returned };
}

/**
 * After a chargeback: reverses the disputed amount (at most what the artist
 * has), once per dispute however often Stripe sends the event.
 */
async function reclaimForDispute(order: LoadedOrder, dispute: Stripe.Dispute): Promise<Reclaim | null> {
  try {
    const transfers = await stripeTransfers(order);
    if (!transfers) return null;
    const { reversed } = disputeTotals(transfers, dispute.id);
    const before = net(transfers);
    const now = Math.max(0, Math.min(dispute.amount - reversed, before));
    await reverse(transfers, now, { orderId: order.id, reason: 'dispute', dispute: dispute.id }, `dispute-${dispute.id}`);
    return { taken: reversed + now, refundsTotal: reversedWhere(transfers, (m) => m.reason === 'refund'), netAfter: before - now };
  } catch (err) {
    console.error(`[refunds] could not reclaim the payout for order ${order.id}:`, err);
    return null;
  }
}

/** The payout was fully taken back: it no longer counts as paid out. */
function markPayoutReversed(order: LoadedOrder, note: string) {
  return prisma.payout.updateMany({
    where: { orderId: order.id, status: 'completed' },
    data: { status: 'reversed', adminNote: note },
  });
}

// ── Stripe events ──────────────────────────────────────────────────────────

export async function handleChargeRefunded(charge: Stripe.Charge) {
  const orderId = await orderIdFor(charge.payment_intent, charge.metadata);
  if (!orderId) return;
  const order = await loadOrder(orderId);
  // Already refunded by us (e.g. two buyers paid for the same artwork).
  if (!order || order.status === 'refunded') return;

  const refundedSek = (charge.amount_refunded / 100).toLocaleString('sv-SE');
  const alreadyPaid = order.sellerPayoutStatus === 'paid';

  if (!charge.refunded) {
    // Partial refund. Each one has its own cumulative amount, which every
    // message about it contains.
    const marker = `(${refundedSek} kr)`;
    if (await recorded(order.id, 'partially_refunded', marker)) return;
    const message = `Delvis återbetald till köparen ${marker}. Utbetalningen till konstnären är pausad.`;
    if (!alreadyPaid) {
      // The payout would be too high, so stop it.
      await hold(order, 'partially_refunded', message);
      await alertAdmins(
        `Delvis återbetalning: ${order.artwork.title}`,
        order,
        `Köparen fick tillbaka ${refundedSek} kr. Utbetalningen till konstnären är pausad. Gå till Admin → Utbetalningar och välj "Släpp" (konstnären får sin andel av det köparen behöll) eller "Avbryt".`,
      );
      return;
    }

    // Already paid: the artist gives back what the buyer got back since then.
    let reclaimed: Reclaim | null = null;
    if (order.payout) {
      const refundedBeforePayout = Math.round((order.amount - order.payout.amount) * 100);
      const refundedSince = Math.max(0, charge.amount_refunded - refundedBeforePayout);
      const keep = Math.max(0, Math.round(order.payout.sellerPayoutAmount * 100) - refundedSince);
      reclaimed = await reclaimForRefund(order, keep, charge.amount_refunded);
    }
    if (reclaimed && reclaimed.taken === 0 && reclaimed.netAfter === 0) {
      // Earlier refunds already took the artist's whole payout.
      await event(order, 'partially_refunded', `Delvis återbetald till köparen ${marker}. Konstnärens hela utbetalning var redan återtagen.`);
      await alertAdmins(
        `Delvis återbetalning: ${order.artwork.title}`,
        order,
        `Köparen fick tillbaka ${refundedSek} kr. Konstnärens hela utbetalning har redan dragits tillbaka, så det som köparen fått utöver den belastar Konstbyte. Enligt villkoren kan du kräva mellanskillnaden av konstnären.`,
      );
      return;
    }
    if (!reclaimed || reclaimed.taken === 0) {
      await event(order, 'partially_refunded', `Delvis återbetald till köparen ${marker}. Konstnären hade redan fått betalt.`);
      await alertAdmins(
        `Delvis återbetalning: ${order.artwork.title}`,
        order,
        `Köparen fick tillbaka ${refundedSek} kr, men konstnären har redan fått betalt och pengarna kunde inte dras tillbaka automatiskt. Kräv tillbaka mellanskillnaden från konstnären (för Stripe-utbetalningar: Stripe → Connect → konstnärens konto → Transfers → Reverse).`,
      );
      return;
    }
    await prisma.$transaction([
      event(order, 'partially_refunded', `Delvis återbetald till köparen ${marker}. ${sek(reclaimed.taken)} har dragits tillbaka från konstnären.`),
      ...sellerNotice(order, `Köparen har fått tillbaka en del av betalningen för "${order.artwork.title}". ${sek(reclaimed.taken)} har dragits tillbaka från ditt Stripe-konto.`),
    ]);
    return;
  }

  // Full refund. If the artist was already paid, take the payout back first.
  let reclaimed = alreadyPaid ? await reclaimForRefund(order, 0, charge.amount_refunded) : null;
  // Nothing was ever taken back for refunds: the admins have to sort it out.
  // (Earlier partial refunds may already have taken it all; that counts.)
  if (reclaimed && reclaimed.refundsTotal === 0) reclaimed = null;
  const sellerMessage = !alreadyPaid
    ? ' Ingen utbetalning görs.'
    : reclaimed === null
      ? ' Konstbyte kontaktar dig om utbetalningen.'
      : ` Utbetalningen (${sek(reclaimed.refundsTotal)}) har dragits tillbaka från ditt Stripe-konto.`;

  await prisma.$transaction([
    prisma.order.update({
      where: { id: order.id },
      data: {
        status: 'refunded',
        ...(alreadyPaid && reclaimed === null ? {} : { sellerPayoutStatus: 'cancelled', sellerPayoutNote: 'Köpet återbetalades.' }),
      },
    }),
    prisma.payout.updateMany({
      where: { orderId: order.id, status: { notIn: ['completed', 'reversed'] } },
      data: { status: 'cancelled' },
    }),
    ...(reclaimed && reclaimed.netAfter === 0
      ? [markPayoutReversed(order, `Återförd från konstnären (${sek(reclaimed.refundsTotal)}) när köpet återbetalades.`)]
      : []),
    event(
      order,
      'refunded',
      `Hela beloppet (${refundedSek} kr) har återbetalats till köparen.${reclaimed ? ` ${sek(reclaimed.refundsTotal)} har dragits tillbaka från konstnären.` : ''}`,
    ),
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
      `Köparen har fått tillbaka hela beloppet (${refundedSek} kr), men konstnären har redan fått betalt och pengarna kunde inte dras tillbaka automatiskt. Kräv tillbaka utbetalningen från konstnären (för Stripe-utbetalningar: Stripe → Connect → konstnärens konto → Transfers → Reverse).`,
    );
  }
}

export async function handleDisputeCreated(dispute: Stripe.Dispute) {
  const orderId = await orderIdFor(dispute.payment_intent, dispute.metadata);
  if (!orderId) return;
  const order = await loadOrder(orderId);
  if (!order) return;
  await processDispute(order, dispute, isInquiry(dispute));
}

/**
 * Stripe took the disputed money. For a normal chargeback that already
 * happened when it was created; for a bank inquiry it means the inquiry has
 * become a chargeback, so it is handled as one now.
 */
export async function handleDisputeFundsWithdrawn(dispute: Stripe.Dispute) {
  const orderId = await orderIdFor(dispute.payment_intent, dispute.metadata);
  if (!orderId) return;
  const order = await loadOrder(orderId);
  if (!order) return;
  if (!(await recorded(order.id, 'dispute_inquiry'))) return;
  await processDispute(order, dispute, false);
}

async function processDispute(order: LoadedOrder, dispute: Stripe.Dispute, inquiry: boolean) {
  // A charge can only be disputed once, so one event of each kind per order.
  const type = inquiry ? 'dispute_inquiry' : 'disputed';
  if (await recorded(order.id, type)) return;

  const alreadyPaid = order.sellerPayoutStatus === 'paid';
  // Inquiries take no money, so the artist keeps theirs; a chargeback does.
  let reclaimed = alreadyPaid && !inquiry ? await reclaimForDispute(order, dispute) : null;
  // Nothing was taken back: the admins have to sort it out.
  if (reclaimed && reclaimed.taken === 0) reclaimed = null;

  if (!alreadyPaid) {
    await hold(
      order,
      type,
      inquiry
        ? 'Köparens bank har ställt en fråga om betalningen. Utbetalningen till konstnären är pausad.'
        : 'Köparen har bestridit betalningen hos sin bank. Utbetalningen till konstnären är pausad.',
    );
  } else {
    await prisma.$transaction([
      event(
        order,
        type,
        inquiry
          ? 'Köparens bank har ställt en fråga om betalningen. Konstnären har redan fått betalt.'
          : reclaimed === null
            ? 'Köparen har bestridit betalningen hos sin bank. Konstnären har redan fått betalt.'
            : `Köparen har bestridit betalningen hos sin bank. ${sek(reclaimed.taken)} har dragits tillbaka från konstnären tills tvisten är avgjord.`,
      ),
      ...(reclaimed
        ? sellerNotice(order, `Köparen har bestridit betalningen för "${order.artwork.title}" hos sin bank. ${sek(reclaimed.taken)} har dragits tillbaka från ditt Stripe-konto tills tvisten är avgjord, och betalas tillbaka till dig om Konstbyte vinner.`)
        : []),
    ]);
  }

  const paidNote = !alreadyPaid
    ? ' Utbetalningen till konstnären är pausad.'
    : inquiry
      ? ' Konstnären har redan fått betalt. Det är en förfrågan, så inga pengar har dragits ännu. Blir den en tvist dras pengarna tillbaka från konstnären och du får ett nytt mejl.'
      : reclaimed === null
        ? ' Konstnären har redan fått betalt och pengarna kunde inte dras tillbaka automatiskt. Kräv tillbaka dem från konstnären.'
        : ` Konstnären hade redan fått betalt, så ${sek(reclaimed.taken)} har dragits tillbaka från konstnären.`;
  await alertAdmins(
    `${inquiry ? 'Förfrågan från banken' : 'Tvist (chargeback)'}: ${order.artwork.title}`,
    order,
    `Köparen har bestridit betalningen. Svara på tvisten i Stripe (Payments → Disputes) före deadline, med t.ex. spårningsnummer och bevis på leverans.${paidNote}`,
  );
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
    event(order, won ? 'dispute_won' : 'dispute_lost', won ? 'Tvisten är avslutad och pengarna finns kvar.' : 'Tvisten förlorades. Ingen utbetalning görs.'),
  ]);
}

/** A dispute on an order the artist had already been paid for. */
async function closePaidDispute(order: LoadedOrder, dispute: Stripe.Dispute, won: boolean) {
  const type = won ? 'dispute_won' : 'dispute_lost';
  if (await recorded(order.id, type)) return;

  let transfers: Stripe.Transfer[] | null;
  try {
    transfers = await stripeTransfers(order);
  } catch (err) {
    // Not knowing what was taken back must not look like "nothing was": the
    // artist could lose money they are owed, or be charged twice.
    console.error(`[refunds] could not read the transfers for order ${order.id}:`, err);
    await alertAdmins(
      `Tvist avslutad: ${order.artwork.title}`,
      order,
      `Tvisten är ${won ? 'vunnen' : 'förlorad'}, men det gick inte att läsa i Stripe vad som drogs tillbaka från konstnären. Kontrollera överföringarna i Stripe och ${won ? 'betala tillbaka det som drogs' : 'kräv tillbaka det som inte drogs'}.`,
    );
    return;
  }
  const { reversed, returned } = transfers ? disputeTotals(transfers, dispute.id) : { reversed: 0, returned: 0 };

  if (!won) {
    if (reversed === 0) {
      await event(order, type, 'Tvisten förlorades. Konstnären hade redan fått betalt.');
      await alertAdmins(
        `Tvist förlorad efter utbetalning: ${order.artwork.title}`,
        order,
        'Tvisten förlorades och konstnären hade redan fått betalt, men inget drogs tillbaka automatiskt. Kräv tillbaka pengarna från konstnären.',
      );
      return;
    }
    await prisma.$transaction([
      event(order, type, `Tvisten förlorades. ${sek(reversed)} som drogs tillbaka från konstnären behålls.`),
      ...(transfers && net(transfers) === 0
        ? [markPayoutReversed(order, `Återförd från konstnären (${sek(reversed)}) när tvisten förlorades.`)]
        : []),
      ...sellerNotice(order, `Tvisten om "${order.artwork.title}" förlorades, så de ${sek(reversed)} som drogs tillbaka betalas inte ut igen.`),
    ]);
    return;
  }

  // Won: Konstbyte got the money back, so the artist gets theirs back too.
  // What was already sent back (by an earlier, interrupted attempt) is
  // subtracted, so it happens once however often Stripe sends the event.
  const toReturn = reversed - returned;
  if (toReturn > 0) {
    const accountId = order.seller?.stripeAccountId;
    try {
      if (!accountId) throw new Error('seller has no Stripe account');
      await stripe.transfers.create(
        {
          amount: toReturn,
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
        `Tvisten är vunnen, men de ${sek(toReturn)} som drogs tillbaka från konstnären kunde inte betalas tillbaka automatiskt. Skicka dem till konstnären i Stripe.`,
      );
      return;
    }
  }
  await prisma.$transaction([
    event(
      order,
      type,
      reversed > 0 ? `Tvisten är vunnen. ${sek(reversed)} har betalats tillbaka till konstnären.` : 'Tvisten är avslutad och pengarna finns kvar.',
    ),
    ...(reversed > 0
      ? sellerNotice(order, `Tvisten om "${order.artwork.title}" är avgjord till din fördel. ${sek(reversed)} har betalats tillbaka till ditt Stripe-konto.`)
      : []),
  ]);
}
