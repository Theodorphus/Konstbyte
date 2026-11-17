import type Stripe from 'stripe';
import stripe from './stripe';

/**
 * Stripe's processing fee and the amount already refunded to the buyer (both in
 * SEK) for a charge. Returns null when the fee isn't known yet (e.g. the payment
 * hasn't succeeded), so callers can decide what to do instead of guessing.
 */
export async function stripeChargeCosts(chargeId: string): Promise<{ fee: number; refunded: number } | null> {
  const charge = await stripe.charges.retrieve(chargeId, { expand: ['balance_transaction'] });
  const bt = charge.balance_transaction as Stripe.BalanceTransaction | string | null;
  if (!bt || typeof bt === 'string') return null;
  return { fee: bt.fee / 100, refunded: (charge.amount_refunded ?? 0) / 100 };
}

/** Stripe's processing fee (in SEK) for a charge, or null when unknown. */
export async function stripeFeeForCharge(chargeId: string): Promise<number | null> {
  return (await stripeChargeCosts(chargeId))?.fee ?? null;
}

/** The charge behind a PaymentIntent, or null if it hasn't succeeded. */
export async function chargeIdForPaymentIntent(paymentIntentId: string): Promise<string | null> {
  const pi = await stripe.paymentIntents.retrieve(paymentIntentId);
  if (pi.status !== 'succeeded') return null;
  return (typeof pi.latest_charge === 'string' ? pi.latest_charge : pi.latest_charge?.id) ?? null;
}

/** Same as stripeFeeForCharge, starting from a PaymentIntent id. */
export async function stripeFeeForPaymentIntent(paymentIntentId: string): Promise<number | null> {
  const chargeId = await chargeIdForPaymentIntent(paymentIntentId);
  return chargeId ? stripeFeeForCharge(chargeId) : null;
}
