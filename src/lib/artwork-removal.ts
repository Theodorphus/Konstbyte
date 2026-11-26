// When an artist may take down their own artwork. Orders keep a reference to
// the artwork (and are kept for bookkeeping), so an artwork that someone has
// tried to buy is hidden rather than deleted, and one with a real sale, or a
// payment in progress, can't be taken down at all.

const DAY = 24 * 60 * 60 * 1000;

type OrderLike = { status: string; createdAt: Date };

/** The purchase never went through, or the buyer got all the money back. */
export function endedWithoutSale(order: OrderLike, now = Date.now()): boolean {
  if (['expired', 'payment_failed', 'refunded'].includes(order.status)) return true;
  // A checkout left open for a day is abandoned.
  return order.status === 'pending' && order.createdAt.getTime() < now - DAY;
}

/** No sale has gone through and none is in progress. */
export function canOwnerRemove(orders: OrderLike[], now = Date.now()): boolean {
  return orders.every((o) => endedWithoutSale(o, now));
}
