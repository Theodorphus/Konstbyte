import { beforeEach, describe, expect, it, vi } from 'vitest';

const { prisma, stripe } = vi.hoisted(() => ({
  prisma: {
    order: { findUnique: vi.fn(), updateMany: vi.fn() },
    orderEvent: { create: vi.fn() },
  },
  stripe: { checkout: { sessions: { expire: vi.fn(), retrieve: vi.fn() } } },
}));
vi.mock('@/lib/prisma', () => ({ default: prisma }));
vi.mock('@/lib/stripe', () => ({ default: stripe }));

import { cancelCheckout } from '@/lib/cancel-checkout';

const pending = { buyerId: 'buyer', status: 'pending', stripeSessionId: 'cs_1', artworkId: 'art1' };

beforeEach(() => {
  vi.clearAllMocks();
  vi.spyOn(console, 'error').mockImplementation(() => {});
  prisma.order.findUnique.mockResolvedValue(pending);
  prisma.order.updateMany.mockResolvedValue({ count: 1 });
  stripe.checkout.sessions.expire.mockResolvedValue({});
});

describe('cancelCheckout', () => {
  it('expires the Stripe session and frees the artwork at once', async () => {
    expect(await cancelCheckout('o1', 'buyer')).toBe('art1');
    expect(stripe.checkout.sessions.expire).toHaveBeenCalledWith('cs_1');
    expect(prisma.order.updateMany).toHaveBeenCalledWith({ where: { id: 'o1', status: 'pending' }, data: { status: 'expired' } });
    expect(prisma.orderEvent.create).toHaveBeenCalled();
  });

  it("ignores someone else's order", async () => {
    expect(await cancelCheckout('o1', 'stranger')).toBeNull();
    expect(stripe.checkout.sessions.expire).not.toHaveBeenCalled();
    expect(prisma.order.updateMany).not.toHaveBeenCalled();
  });

  it('leaves the order alone if the session was just paid', async () => {
    stripe.checkout.sessions.expire.mockRejectedValue(new Error('Only Checkout Sessions with a status of open can be expired.'));
    stripe.checkout.sessions.retrieve.mockResolvedValue({ status: 'complete' });
    expect(await cancelCheckout('o1', 'buyer')).toBe('art1');
    expect(prisma.order.updateMany).not.toHaveBeenCalled();
  });

  it('closes the order when Stripe says the session already expired', async () => {
    stripe.checkout.sessions.expire.mockRejectedValue(new Error('already expired'));
    stripe.checkout.sessions.retrieve.mockResolvedValue({ status: 'expired' });
    await cancelCheckout('o1', 'buyer');
    expect(prisma.order.updateMany).toHaveBeenCalled();
  });

  it('does nothing to orders that are no longer pending', async () => {
    prisma.order.findUnique.mockResolvedValue({ ...pending, status: 'completed' });
    expect(await cancelCheckout('o1', 'buyer')).toBe('art1');
    expect(stripe.checkout.sessions.expire).not.toHaveBeenCalled();
  });
});
