import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

const { prisma, tx, getCurrentUser, sendEmail, chargeIdForPaymentIntent, stripeChargeCosts } = vi.hoisted(() => {
  const tx = {
    order: { updateMany: vi.fn(), findUnique: vi.fn() },
    payout: { upsert: vi.fn() },
  };
  return {
    tx,
    prisma: {
      order: { findMany: vi.fn(), findUnique: vi.fn() },
      $transaction: vi.fn((fn: (t: typeof tx) => unknown) => fn(tx)),
    },
    getCurrentUser: vi.fn(),
    sendEmail: vi.fn(),
    chargeIdForPaymentIntent: vi.fn(),
    stripeChargeCosts: vi.fn(),
  };
});
vi.mock('@/lib/prisma', () => ({ default: prisma }));
vi.mock('../src/lib/prisma', () => ({ default: prisma }));
vi.mock('../src/lib/auth', () => ({ getCurrentUser }));
vi.mock('../src/lib/email', () => ({
  sendEmail,
  buyerConfirmationEmail: vi.fn(),
  sellerNotificationEmail: vi.fn(),
  escapeHtml: (s: string) => s,
}));
vi.mock('../src/lib/release-payout', () => ({ releaseSellerPayout: vi.fn() }));
vi.mock('../src/lib/stripe-fee', () => ({ chargeIdForPaymentIntent, stripeChargeCosts }));

import { GET, PATCH } from '@/app/api/admin/payouts/route';

const ADMIN = { id: 'admin', email: 'admin@konstbyte.se' };
const order = {
  id: 'order_1',
  status: 'delivered',
  sellerPayoutStatus: 'awaiting_stripe',
  paymentMethod: 'stripe',
  amount: 1000,
  sellerId: 'seller_1',
  seller: { id: 'seller_1', name: 'Anna', email: 'anna@example.com' },
  artwork: { title: 'Hav' },
  payments: [{ stripeId: 'pi_1' }],
};

const patch = (body: unknown) =>
  PATCH(new NextRequest('https://www.konstbyte.se/api/admin/payouts', { method: 'PATCH', body: JSON.stringify(body) }));

beforeEach(() => {
  vi.clearAllMocks();
  process.env.ADMIN_EMAILS = ADMIN.email;
  getCurrentUser.mockResolvedValue(ADMIN);
  prisma.order.findMany.mockResolvedValue([]);
  prisma.order.findUnique.mockResolvedValue(order);
  tx.order.updateMany.mockResolvedValue({ count: 1 });
  tx.order.findUnique.mockResolvedValue({ ...order, sellerPayoutStatus: 'paid' });
  chargeIdForPaymentIntent.mockResolvedValue('ch_1');
  stripeChargeCosts.mockResolvedValue({ fee: 20, refunded: 0 });
  sendEmail.mockResolvedValue(undefined);
});

describe('GET /api/admin/payouts', () => {
  it('lists the money waiting for an artist to connect Stripe', async () => {
    prisma.order.findMany.mockImplementation(({ where }: { where: { sellerPayoutStatus?: string } }) =>
      Promise.resolve(where.sellerPayoutStatus === 'awaiting_stripe' ? [order] : []),
    );
    const res = await GET(new NextRequest('https://www.konstbyte.se/api/admin/payouts'));
    const body = await res.json();
    expect(body.awaitingStripe).toHaveLength(1);
    expect(prisma.order.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { status: 'delivered', sellerPayoutStatus: 'awaiting_stripe' } }),
    );
  });

  it('is for admins only', async () => {
    getCurrentUser.mockResolvedValue({ id: 'u', email: 'someone@example.com' });
    const res = await GET(new NextRequest('https://www.konstbyte.se/api/admin/payouts'));
    expect(res.status).toBe(403);
  });
});

describe('PATCH /api/admin/payouts (manual payout)', () => {
  it('can pay an artist by hand while the order waits for Stripe', async () => {
    const res = await patch({ orderId: 'order_1', action: 'payout', method: 'bank' });
    expect(res.status).toBe(200);
    expect(tx.order.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          id: 'order_1',
          status: 'delivered',
          OR: [
            { sellerPayoutStatus: 'unpaid' },
            // Never once the artist has connected Stripe (an automatic transfer may be on its way).
            { sellerPayoutStatus: 'awaiting_stripe', seller: { is: { stripeOnboardingDone: false } } },
          ],
        },
        data: expect.objectContaining({ sellerPayoutStatus: 'paid' }),
      }),
    );
    expect(tx.payout.upsert).toHaveBeenCalled();
  });

  it('records nothing if the payout went out in the meantime', async () => {
    tx.order.updateMany.mockResolvedValue({ count: 0 });
    const res = await patch({ orderId: 'order_1', action: 'payout' });
    expect(res.status).toBe(409);
    expect(tx.payout.upsert).not.toHaveBeenCalled();
    expect(sendEmail).not.toHaveBeenCalled();
  });
});
