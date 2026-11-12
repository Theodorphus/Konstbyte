import { beforeEach, describe, expect, it, vi } from 'vitest';

const { prisma, tx, stripe } = vi.hoisted(() => {
  const tx = {
    order: { updateMany: vi.fn(), update: vi.fn() },
    artwork: { updateMany: vi.fn() },
    orderItem: { create: vi.fn() },
    orderEvent: { create: vi.fn(), createMany: vi.fn() },
    payment: { upsert: vi.fn() },
  };
  const prisma = {
    order: { findUnique: vi.fn(), updateMany: vi.fn() },
    orderEvent: { create: vi.fn() },
    notification: { create: vi.fn() },
    $transaction: vi.fn((fn: (t: typeof tx) => unknown) => fn(tx)),
  };
  const stripe = {
    webhooks: { constructEvent: vi.fn() },
    refunds: { create: vi.fn() },
  };
  return { prisma, tx, stripe };
});
vi.mock('@/lib/prisma', () => ({ default: prisma }));
vi.mock('@/lib/stripe', () => ({ default: stripe }));
vi.mock('@/lib/email', () => ({
  sendEmail: vi.fn(() => Promise.resolve()),
  buyerConfirmationEmail: vi.fn(() => ({ subject: 's', html: 'h' })),
  sellerNotificationEmail: vi.fn(() => ({ subject: 's', html: 'h' })),
}));

import { POST } from '@/app/api/stripe/webhook/route';

const order = {
  id: 'order_1',
  status: 'pending',
  artworkId: 'art_1',
  buyerId: 'buyer_1',
  amount: 1099,
  shippingCost: 99,
  artwork: { title: 'Solnedgång', imageUrl: 'https://utfs.io/f/a.jpg' },
  buyer: { name: 'Köpare', email: 'buyer@example.com' },
  seller: { name: 'Konstnär', email: 'seller@example.com' },
};

function session(overrides: Record<string, unknown> = {}) {
  return {
    id: 'cs_1',
    metadata: { orderId: 'order_1' },
    payment_intent: 'pi_1',
    payment_status: 'paid',
    amount_total: 109_900,
    ...overrides,
  };
}

async function deliver(type: string, object: Record<string, unknown>) {
  stripe.webhooks.constructEvent.mockReturnValue({ type, data: { object } });
  return POST(new Request('http://localhost/api/stripe/webhook', {
    method: 'POST',
    headers: { 'stripe-signature': 'sig' },
    body: '{}',
  }));
}

beforeEach(() => {
  vi.clearAllMocks();
  process.env.STRIPE_WEBHOOK_SECRET = 'whsec_test';
  prisma.order.findUnique.mockResolvedValue(order);
  tx.order.updateMany.mockResolvedValue({ count: 1 });
  tx.artwork.updateMany.mockResolvedValue({ count: 1 });
  prisma.order.updateMany.mockResolvedValue({ count: 1 });
});

describe('POST /api/stripe/webhook', () => {
  it('rejects requests with an invalid signature', async () => {
    stripe.webhooks.constructEvent.mockImplementation(() => {
      throw new Error('bad signature');
    });
    vi.spyOn(console, 'error').mockImplementation(() => {});
    const res = await POST(new Request('http://localhost/x', { method: 'POST', body: '{}' }));
    expect(res.status).toBe(400);
  });

  it('fulfils a paid card payment: claims order + artwork and records what was paid', async () => {
    const res = await deliver('checkout.session.completed', session());

    expect(res.status).toBe(200);
    expect(tx.order.updateMany).toHaveBeenCalledWith({
      where: { id: 'order_1', status: { in: ['pending', 'payment_processing'] } },
      data: { status: 'completed' },
    });
    expect(tx.artwork.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: 'art_1', isSold: false } }),
    );
    // price excludes shipping
    expect(tx.orderItem.create).toHaveBeenCalledWith({
      data: expect.objectContaining({ orderId: 'order_1', price: 1000 }),
    });
    expect(tx.payment.upsert).toHaveBeenCalledWith(expect.objectContaining({ where: { stripeId: 'pi_1' } }));
    expect(stripe.refunds.create).not.toHaveBeenCalled();
  });

  it('only marks delayed payments (Swish/Klarna) as processing until they succeed', async () => {
    await deliver('checkout.session.completed', session({ payment_status: 'unpaid' }));

    expect(prisma.order.updateMany).toHaveBeenCalledWith({
      where: { id: 'order_1', status: 'pending' },
      data: { status: 'payment_processing' },
    });
    expect(prisma.$transaction).not.toHaveBeenCalled();
  });

  it('fulfils a delayed payment when async_payment_succeeded arrives', async () => {
    await deliver('checkout.session.async_payment_succeeded', session());
    expect(tx.orderItem.create).toHaveBeenCalled();
  });

  it('is a no-op when the same event is delivered twice', async () => {
    tx.order.updateMany.mockResolvedValue({ count: 0 });

    const res = await deliver('checkout.session.completed', session());

    expect(res.status).toBe(200);
    expect(tx.artwork.updateMany).not.toHaveBeenCalled();
    expect(tx.orderItem.create).not.toHaveBeenCalled();
  });

  it('refunds the second buyer if the artwork was already sold', async () => {
    tx.artwork.updateMany.mockResolvedValue({ count: 0 });

    await deliver('checkout.session.completed', session());

    expect(tx.order.update).toHaveBeenCalledWith({ where: { id: 'order_1' }, data: { status: 'refunded' } });
    expect(stripe.refunds.create).toHaveBeenCalledWith(
      { payment_intent: 'pi_1' },
      { idempotencyKey: 'konstbyte-dupe-refund-order_1' },
    );
    expect(tx.orderItem.create).not.toHaveBeenCalled();
    expect(prisma.notification.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ userId: 'buyer_1', type: 'order_refunded' }) }),
    );
  });

  it('retries a refund that failed on an earlier delivery', async () => {
    prisma.order.findUnique.mockResolvedValue({ ...order, status: 'refunded' });

    await deliver('checkout.session.completed', session());

    expect(stripe.refunds.create).toHaveBeenCalledWith(
      { payment_intent: 'pi_1' },
      { idempotencyKey: 'konstbyte-dupe-refund-order_1' },
    );
    expect(prisma.$transaction).not.toHaveBeenCalled();
  });

  it('closes open orders when payment fails or expires', async () => {
    await deliver('checkout.session.async_payment_failed', session());
    expect(prisma.order.updateMany).toHaveBeenCalledWith({
      where: { id: 'order_1', status: { in: ['pending', 'payment_processing'] } },
      data: { status: 'payment_failed' },
    });

    await deliver('checkout.session.expired', session());
    expect(prisma.order.updateMany).toHaveBeenLastCalledWith({
      where: { id: 'order_1', status: { in: ['pending', 'payment_processing'] } },
      data: { status: 'expired' },
    });
  });

  it('returns 500 so Stripe retries when handling fails', async () => {
    prisma.order.findUnique.mockResolvedValue(null);
    vi.spyOn(console, 'error').mockImplementation(() => {});

    const res = await deliver('checkout.session.completed', session());
    expect(res.status).toBe(500);
  });
});
