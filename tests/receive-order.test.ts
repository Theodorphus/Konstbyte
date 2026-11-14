import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

const { prisma, getCurrentUser, markOrderDelivered, releaseSellerPayout } = vi.hoisted(() => ({
  prisma: {
    order: { findUnique: vi.fn() },
    notification: { create: vi.fn() },
  },
  getCurrentUser: vi.fn(),
  markOrderDelivered: vi.fn(),
  releaseSellerPayout: vi.fn(),
}));
vi.mock('@/lib/prisma', () => ({ default: prisma }));
vi.mock('@/lib/auth', () => ({ getCurrentUser }));
vi.mock('@/lib/release-payout', () => ({ markOrderDelivered, releaseSellerPayout }));

import { POST } from '@/app/api/orders/[id]/receive/route';

const order = {
  id: 'order_1',
  buyerId: 'buyer_1',
  sellerId: 'seller_1',
  status: 'completed',
  shippingStatus: 'shipped',
  artwork: { title: 'Solnedgång' },
};

function post(headers: Record<string, string> = {}) {
  const req = new NextRequest('https://www.konstbyte.se/api/orders/order_1/receive', { method: 'POST', headers });
  return POST(req, { params: Promise.resolve({ id: 'order_1' }) });
}

const FORM = { accept: 'text/html,application/xhtml+xml', referer: 'https://www.konstbyte.se/en/orders/order_1' };

beforeEach(() => {
  vi.clearAllMocks();
  getCurrentUser.mockResolvedValue({ id: 'buyer_1' });
  prisma.order.findUnique.mockResolvedValue(order);
  markOrderDelivered.mockResolvedValue(true);
  releaseSellerPayout.mockResolvedValue({ status: 'transferred', transferId: 'tr_1', sellerPayoutAmount: 970 });
});

describe('POST /api/orders/[id]/receive', () => {
  it('sends a form submission back to the order page instead of showing JSON', async () => {
    const res = await post(FORM);

    expect(res.status).toBe(303);
    expect(res.headers.get('location')).toBe('https://www.konstbyte.se/en/orders/order_1');
    expect(releaseSellerPayout).toHaveBeenCalledWith('order_1');
  });

  it('ignores a Referer from another site', async () => {
    const res = await post({ ...FORM, referer: 'https://evil.example/x' });
    expect(res.headers.get('location')).toBe('https://www.konstbyte.se/orders/order_1');
  });

  it('just shows the order again on a double submit', async () => {
    prisma.order.findUnique.mockResolvedValue({ ...order, shippingStatus: 'delivered' });

    const res = await post(FORM);

    expect(res.status).toBe(303);
    expect(markOrderDelivered).not.toHaveBeenCalled();
  });

  it('still returns JSON to fetch() callers', async () => {
    const res = await post({ accept: 'application/json' });

    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ ok: true, payout: 'transferred' });
  });

  it('never lets someone other than the buyer confirm receipt', async () => {
    getCurrentUser.mockResolvedValue({ id: 'someone_else' });

    const res = await post(FORM);

    expect(res.status).toBe(404);
    expect(markOrderDelivered).not.toHaveBeenCalled();
  });
});
