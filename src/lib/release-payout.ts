import type Stripe from 'stripe';
import stripe from './stripe';
import prisma from './prisma';
import { calculatePayout, defaultCommissionRate } from './payout';

// Order statuses that mean the buyer's money has actually arrived.
export const PAID_ORDER_STATUSES = ['completed', 'paid', 'delivered'];

export type ReleaseResult =
  | { status: 'transferred'; transferId: string; sellerPayoutAmount: number }
  | { status: 'manual'; sellerPayoutAmount: number }
  | { status: 'already_paid' }
  | { status: 'skipped'; reason: string };

/**
 * Whether a connected Stripe account can receive transfers.
 * Works for both Express (new) and Standard (legacy) accounts.
 */
export function isConnectAccountReady(account: Stripe.Account): boolean {
  if (!account.details_submitted) return false;
  if (account.capabilities?.transfers === 'active') return true;
  return Boolean(account.charges_enabled && account.payouts_enabled);
}

/**
 * Marks a paid order as delivered exactly once. Returns false if it already was
 * (or isn't paid). Used by the buyer's "received" button and the auto-release cron.
 */
export async function markOrderDelivered(orderId: string, message: string, type = 'delivered'): Promise<boolean> {
  return prisma.$transaction(async (tx) => {
    const { count } = await tx.order.updateMany({
      where: { id: orderId, status: { in: ['completed', 'paid'] } },
      data: { status: 'delivered', shippingStatus: 'delivered' },
    });
    if (count === 0) return false;
    await tx.orderEvent.create({ data: { orderId, type, message } });
    return true;
  });
}

async function resolveChargeId(order: {
  stripeSessionId: string | null;
  payments: { stripeId: string }[];
}): Promise<string | null> {
  let paymentIntentId = order.payments.find((p) => p.stripeId.startsWith('pi_'))?.stripeId ?? null;

  if (!paymentIntentId && order.stripeSessionId) {
    const session = await stripe.checkout.sessions.retrieve(order.stripeSessionId);
    paymentIntentId =
      typeof session.payment_intent === 'string' ? session.payment_intent : session.payment_intent?.id ?? null;
  }
  if (!paymentIntentId) return null;

  const pi = await stripe.paymentIntents.retrieve(paymentIntentId);
  if (pi.status !== 'succeeded') return null;
  const charge = pi.latest_charge;
  return typeof charge === 'string' ? charge : charge?.id ?? null;
}

/**
 * Releases the seller's share of a paid order.
 *
 * Money is collected on the platform account at checkout ("separate charges and
 * transfers"). It is only moved to the artist once the buyer has confirmed receipt
 * (or the auto-release window has passed). If the artist has a ready Stripe
 * account, the transfer happens automatically; otherwise a pending Payout is left
 * for an admin to pay manually, exactly as before.
 *
 * Safe to call more than once for the same order: the Stripe transfer uses an
 * idempotency key and the Payout row is upserted.
 */
export async function releaseSellerPayout(orderId: string): Promise<ReleaseResult> {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: {
      seller: { select: { id: true, stripeAccountId: true, stripeOnboardingDone: true } },
      artwork: { select: { title: true } },
      payments: { select: { stripeId: true } },
    },
  });

  if (!order || !order.sellerId || !order.seller) return { status: 'skipped', reason: 'no_seller' };
  if (order.sellerPayoutStatus === 'paid') return { status: 'already_paid' };
  if (!PAID_ORDER_STATUSES.includes(order.status)) return { status: 'skipped', reason: 'not_paid' };

  const commissionRate = defaultCommissionRate();
  const { commissionAmount, commissionVat, sellerPayoutAmount } = calculatePayout(order.amount, commissionRate);
  const payoutBase = {
    sellerId: order.sellerId,
    amount: order.amount,
    commissionRate,
    commissionAmount,
    commissionVat,
    sellerPayoutAmount,
  };

  // ── Try an automatic Stripe transfer ────────────────────────────────────────
  let transferId: string | null = null;
  let transferFailed = false;
  const accountId = order.seller.stripeAccountId;

  if (order.paymentMethod === 'stripe' && accountId) {
    try {
      let ready = order.seller.stripeOnboardingDone;
      if (!ready) {
        ready = isConnectAccountReady(await stripe.accounts.retrieve(accountId));
        if (ready) {
          await prisma.user.update({ where: { id: order.sellerId }, data: { stripeOnboardingDone: true } });
        }
      }

      if (ready) {
        const chargeId = await resolveChargeId(order);
        if (chargeId) {
          const transfer = await stripe.transfers.create(
            {
              amount: Math.round(sellerPayoutAmount * 100),
              currency: 'sek',
              destination: accountId,
              source_transaction: chargeId,
              transfer_group: order.id,
              description: `Konstbyte – ${order.artwork.title}`,
              metadata: { orderId: order.id },
            },
            { idempotencyKey: `konstbyte-payout-${order.id}` },
          );
          transferId = transfer.id;
        }
      }
    } catch (err) {
      transferFailed = true;
      console.error(`[release-payout] Stripe transfer failed for order ${order.id}:`, err);
    }
  }

  if (transferId) {
    const now = new Date();
    await prisma.$transaction([
      prisma.payout.upsert({
        where: { orderId: order.id },
        create: {
          ...payoutBase,
          orderId: order.id,
          method: 'stripe',
          status: 'completed',
          adminNote: `Stripe-överföring ${transferId}`,
          completedAt: now,
        },
        update: {
          ...payoutBase,
          method: 'stripe',
          status: 'completed',
          adminNote: `Stripe-överföring ${transferId}`,
          completedAt: now,
        },
      }),
      prisma.order.update({
        where: { id: order.id },
        data: { sellerPayoutStatus: 'paid', sellerPayoutAt: now, sellerPayoutNote: `Stripe-överföring ${transferId}` },
      }),
      prisma.orderEvent.create({
        data: { orderId: order.id, type: 'payout_released', message: 'Utbetalningen till konstnären har skickats.' },
      }),
      prisma.notification.create({
        data: {
          userId: order.sellerId,
          type: 'payout_sent',
          message: `${Math.round(sellerPayoutAmount).toLocaleString('sv-SE')} kr för "${order.artwork.title}" har skickats till ditt Stripe-konto.`,
          link: '/seller/payouts',
        },
      }),
    ]);
    return { status: 'transferred', transferId, sellerPayoutAmount };
  }

  // ── Fall back to a pending payout that an admin pays manually ──────────────
  await prisma.payout.upsert({
    where: { orderId: order.id },
    create: {
      ...payoutBase,
      orderId: order.id,
      ...(transferFailed ? { adminNote: 'Automatisk överföring misslyckades – betalas ut manuellt.' } : {}),
    },
    update: transferFailed ? { adminNote: 'Automatisk överföring misslyckades – betalas ut manuellt.' } : {},
  });
  return { status: 'manual', sellerPayoutAmount };
}
