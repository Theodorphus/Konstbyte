import type { Prisma } from '@prisma/client';

// When an artist may take down their own artwork. Orders keep a reference to
// the artwork (and are kept for bookkeeping), so an artwork that someone has
// tried to buy is hidden rather than deleted, and one with a real sale, or a
// payment in progress, can't be taken down at all.

const DAY = 24 * 60 * 60 * 1000;
const ENDED = ['expired', 'payment_failed', 'refunded'];

type OrderLike = { status: string; createdAt: Date };
type ArtworkLike = { isSold: boolean; removedByAdmin?: boolean; orders: OrderLike[] };

/** The purchase never went through, or the buyer got all the money back. */
export function endedWithoutSale(order: OrderLike, now = Date.now()): boolean {
  if (ENDED.includes(order.status)) return true;
  // A checkout left open for a day is abandoned.
  return order.status === 'pending' && order.createdAt.getTime() < now - DAY;
}

/** Marked as sold, but the buyer got the money back and nothing else is going on. */
export function saleWasRefunded(artwork: ArtworkLike, now = Date.now()): boolean {
  return (
    artwork.isSold &&
    artwork.orders.some((o) => o.status === 'refunded') &&
    artwork.orders.every((o) => endedWithoutSale(o, now))
  );
}

/** No sale stands and none is in progress, and no admin took it down (that stays on record). */
export function canOwnerRemove(artwork: ArtworkLike, now = Date.now()): boolean {
  if (artwork.removedByAdmin) return false;
  if (!artwork.orders.every((o) => endedWithoutSale(o, now))) return false;
  return !artwork.isSold || saleWasRefunded(artwork, now);
}

/**
 * Orders that block removal, as a database filter, so the check and the write
 * can happen in one statement (a buyer may start a checkout in between).
 */
export function blockingOrders(now = Date.now()): Prisma.OrderWhereInput {
  return {
    status: { notIn: ENDED },
    NOT: { status: 'pending', createdAt: { lt: new Date(now - DAY) } },
  };
}
