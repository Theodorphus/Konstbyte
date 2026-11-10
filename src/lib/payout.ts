export function calculatePayout(orderAmount: number, commissionRate: number) {
  const commissionAmount   = orderAmount * commissionRate;
  const commissionVat      = commissionAmount * 0.25;
  const sellerPayoutAmount = orderAmount - commissionAmount;
  return { commissionAmount, commissionVat, sellerPayoutAmount };
}

export function defaultCommissionRate(): number {
  return (Number(process.env.PLATFORM_FEE_PERCENT) || 3) / 100;
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
