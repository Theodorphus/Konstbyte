import { beforeEach, describe, expect, it, vi } from 'vitest';

const { prisma } = vi.hoisted(() => {
  const model = () => ({ deleteMany: vi.fn(() => 'op'), updateMany: vi.fn(() => 'op'), findMany: vi.fn(() => Promise.resolve([])) });
  return {
    prisma: {
      order: { count: vi.fn() },
      user: { findUnique: vi.fn(), update: vi.fn(() => 'op') },
      session: model(), account: model(), verificationToken: model(), notification: model(), follow: model(),
      message: model(), postReaction: model(), comment: model(), post: model(), challengeLike: model(),
      challengeSubmission: model(), challengePoints: model(), favorite: model(), collection: model(),
      artwork: model(), artValuationLog: model(),
      $transaction: vi.fn(() => Promise.resolve([])),
    },
  };
});
vi.mock('@/lib/prisma', () => ({ default: prisma }));

import { deleteAccount, DELETED_USER_NAME } from '@/lib/delete-account';

beforeEach(() => {
  vi.clearAllMocks();
  prisma.order.count.mockResolvedValue(0);
  prisma.user.findUnique.mockResolvedValue({ email: 'anna@example.com' });
  prisma.artwork.findMany.mockResolvedValue([
    { id: 'art_sold', _count: { orders: 1 } },
    { id: 'art_free', _count: { orders: 0 } },
  ]);
});

describe('deleteAccount', () => {
  it('refuses while an order is still in progress', async () => {
    prisma.order.count.mockResolvedValue(2);
    expect(await deleteAccount('u1')).toEqual({ ok: false, reason: 'open_orders', count: 2 });
    expect(prisma.$transaction).not.toHaveBeenCalled();
  });

  it('wipes personal data but keeps sold artworks (hidden) for the order history', async () => {
    expect(await deleteAccount('u1')).toEqual({ ok: true });

    expect(prisma.artwork.deleteMany).toHaveBeenCalledWith({ where: { id: { in: ['art_free'] } } });
    expect(prisma.artwork.updateMany).toHaveBeenCalledWith({ where: { id: { in: ['art_sold'] } }, data: { isPublished: false } });
    expect(prisma.account.deleteMany).toHaveBeenCalledWith({ where: { userId: 'u1' } });
    expect(prisma.session.deleteMany).toHaveBeenCalledWith({ where: { userId: 'u1' } });
    expect(prisma.verificationToken.deleteMany).toHaveBeenCalledWith({ where: { identifier: 'anna@example.com' } });
    expect(prisma.user.update).toHaveBeenCalledWith({
      where: { id: 'u1' },
      data: expect.objectContaining({ name: DELETED_USER_NAME, email: null, image: null, bio: null, instagram: null }),
    });
    expect(prisma.$transaction).toHaveBeenCalledTimes(1);
  });

  it('counts unpaid payouts to the seller as open', async () => {
    await deleteAccount('u1');
    const where = prisma.order.count.mock.calls[0][0].where;
    expect(where.OR).toContainEqual({ sellerId: 'u1', status: 'delivered', sellerPayoutStatus: { in: ['unpaid', 'awaiting_stripe', 'on_hold'] } });
  });
});
