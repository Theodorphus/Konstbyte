/**
 * Splits an order between Konstbyte and the artist.
 * The artist pays the platform commission and Stripe's processing fee for the
 * payment (as described on the fees page), so `stripeFee` is deducted too.
 */
export function calculatePayout(orderAmount: number, commissionRate: number, stripeFee = 0) {
  const commissionAmount   = orderAmount * commissionRate;
  const commissionVat      = commissionAmount * 0.25;
  const sellerPayoutAmount = Math.max(0, orderAmount - commissionAmount - stripeFee);
  return { commissionAmount, commissionVat, stripeFee, sellerPayoutAmount };
}

/**
 * Konstbyte's commission, in percent. The terms, the fees page and the texts
 * in messages/*.json all show this value (via {fee}), so changing it here
 * changes both what artists are told and what they are charged. Changing the
 * fee means updating the terms too, so it is not an environment setting.
 */
export const PLATFORM_FEE_PERCENT = 3;

export function defaultCommissionRate(): number {
  return PLATFORM_FEE_PERCENT / 100;
}

// Stripe can't charge less than 3 SEK or more than 999 999.99 SEK in one payment.
export const MIN_ARTWORK_PRICE = 3;
export const MAX_ARTWORK_PRICE = 999_999;

/** Parses a price from user input. Returns null if it's not a valid, chargeable SEK amount. */
export function parseArtworkPrice(value: unknown): number | null {
  const n = typeof value === 'string' ? Number(value.replace(',', '.')) : Number(value);
  if (!Number.isFinite(n) || n < MIN_ARTWORK_PRICE || n > MAX_ARTWORK_PRICE) return null;
  return Math.round(n * 100) / 100;
}

/** Parses an optional shipping cost (0 – 100 000 SEK). Returns undefined if invalid. */
export function parseShippingCost(value: unknown): number | null | undefined {
  if (value == null || value === '') return null;
  const n = Number(value);
  if (!Number.isFinite(n) || n < 0 || n > 100_000) return undefined;
  return Math.round(n * 100) / 100;
}
