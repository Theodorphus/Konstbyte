import type Stripe from 'stripe';
import stripe from './stripe';

/**
 * Stripe's processing fee (in SEK) for a payment, read from the charge's
 * balance transaction. Returns null when it isn't known yet (e.g. the payment
 * hasn't succeeded), so callers can decide what to do instead of guessing.
 */
export async function stripeFeeForCharge(chargeId: string): Promise<number | null> {
  const charge = await stripe.charges.retrieve(chargeId, { expand: ['balance_transaction'] });
  const bt = charge.balance_transaction as Stripe.BalanceTransaction | string | null;
  if (!bt || typeof bt === 'string') return null;
  return bt.fee / 100;
}

/** Same as stripeFeeForCharge, starting from a PaymentIntent id. */
export async function stripeFeeForPaymentIntent(paymentIntentId: string): Promise<number | null> {
  const pi = await stripe.paymentIntents.retrieve(paymentIntentId);
  if (pi.status !== 'succeeded') return null;
  const chargeId = typeof pi.latest_charge === 'string' ? pi.latest_charge : pi.latest_charge?.id;
  return chargeId ? stripeFeeForCharge(chargeId) : null;
}
