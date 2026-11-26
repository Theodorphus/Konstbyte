import { beforeEach, describe, expect, it, vi } from 'vitest';

const { prisma, getCurrentUser } = vi.hoisted(() => ({
  prisma: {
    artwork: { findUnique: vi.fn(), update: vi.fn(), delete: vi.fn() },
    favorite: { deleteMany: vi.fn() },
    order: { count: vi.fn() },
    $transaction: vi.fn((ops: unknown[]) => Promise.all(ops)),
  },
  getCurrentUser: vi.fn(),
}));
vi.mock('@/lib/prisma', () => ({ default: prisma }));
vi.mock('../src/lib/prisma', () => ({ default: prisma }));
vi.mock('@/lib/auth', () => ({ getCurrentUser }));
vi.mock('../src/lib/auth', () => ({ getCurrentUser }));

import { DELETE, GET, PUT } from '@/app/api/artworks/[id]/route';
import { NextRequest } from 'next/server';

const params = { params: Promise.resolve({ id: 'art1' }) };
const put = (body: unknown) =>
  PUT(new NextRequest('https://konstbyte.se/api/artworks/art1', { method: 'PUT', body: JSON.stringify(body) }), params);

const artwork = {
  id: 'art1', ownerId: 'u1', isSold: false, isPublished: true, price: 1000, imageUrl: 'x',
  shippingType: 'overenskommes', shippingCost: null,
};

beforeEach(() => {
  vi.clearAllMocks();
  getCurrentUser.mockResolvedValue({ id: 'u1', email: 'a@example.com' });
  prisma.artwork.findUnique.mockResolvedValue(artwork);
  prisma.artwork.update.mockImplementation(({ data }) => Promise.resolve({ ...artwork, ...data }));
  prisma.order.count.mockResolvedValue(0);
});

describe('PUT /api/artworks/[id] shipping', () => {
  it('saves a fixed shipping cost and clears the other fields', async () => {
    const res = await put({ shippingType: 'fixed', shippingCost: '89', shippingArea: 'Göteborg' });
    expect(res.status).toBe(200);
    expect(prisma.artwork.update.mock.calls[0][0].data).toMatchObject({
      shippingType: 'fixed', shippingCost: 89, shippingArea: null, shippingCarrier: null,
    });
  });

  it('rejects unknown shipping types and categories', async () => {
    expect((await put({ shippingType: 'teleport' })).status).toBe(400);
    expect((await put({ category: 'hack' })).status).toBe(400);
    expect(prisma.artwork.update).not.toHaveBeenCalled();
  });

  it('locks shipping changes while someone is paying', async () => {
    prisma.order.count.mockResolvedValue(1);
    expect((await put({ shippingType: 'fixed', shippingCost: 500 })).status).toBe(409);
    // Changing only the pickup area text is fine.
    prisma.artwork.findUnique.mockResolvedValue({ ...artwork, shippingType: 'pickup' });
    expect((await put({ shippingType: 'pickup', shippingArea: 'Malmö' })).status).toBe(200);
  });
});

describe('GET /api/artworks/[id]', () => {
  it('hides unpublished artworks from other users', async () => {
    prisma.artwork.findUnique.mockResolvedValue({ ...artwork, isPublished: false });
    getCurrentUser.mockResolvedValue({ id: 'someone_else', email: 'b@example.com' });
    expect((await GET(new NextRequest('https://konstbyte.se/api/artworks/art1'), params)).status).toBe(404);
    getCurrentUser.mockResolvedValue({ id: 'u1', email: 'a@example.com' });
    expect((await GET(new NextRequest('https://konstbyte.se/api/artworks/art1'), params)).status).toBe(200);
  });
});

describe('DELETE /api/artworks/[id] by the artist', () => {
  const remove = () => DELETE(new NextRequest('https://konstbyte.se/api/artworks/art1', { method: 'DELETE' }), params);
  const withOrders = (orders: { status: string; createdAt?: Date }[], extra: object = {}) =>
    prisma.artwork.findUnique.mockResolvedValue({
      ...artwork,
      ...extra,
      orders: orders.map((o) => ({ createdAt: new Date(), ...o })),
    });

  it('deletes an artwork nobody tried to buy', async () => {
    withOrders([]);
    const res = await remove();
    expect(await res.json()).toEqual({ success: true });
    expect(prisma.artwork.delete).toHaveBeenCalledWith({ where: { id: 'art1' } });
  });

  it('hides (keeps for bookkeeping) an artwork whose sale was refunded', async () => {
    withOrders([{ status: 'refunded' }], { isSold: true });
    const res = await remove();
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ success: true, hidden: true });
    expect(prisma.artwork.update).toHaveBeenCalledWith({ where: { id: 'art1' }, data: { isPublished: false } });
    expect(prisma.artwork.delete).not.toHaveBeenCalled();
  });

  it('hides an artwork whose checkouts were all abandoned', async () => {
    withOrders([{ status: 'expired' }, { status: 'pending', createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000) }]);
    expect(await (await remove()).json()).toEqual({ success: true, hidden: true });
  });

  it('refuses while a sale has gone through or a payment is in progress', async () => {
    withOrders([{ status: 'refunded' }, { status: 'delivered' }]);
    expect((await remove()).status).toBe(409);
    withOrders([{ status: 'pending' }]);
    expect((await remove()).status).toBe(409);
    expect(prisma.artwork.update).not.toHaveBeenCalled();
    expect(prisma.artwork.delete).not.toHaveBeenCalled();
  });
});

describe('artworks removed by an admin', () => {
  it('cannot be republished by the artist', async () => {
    prisma.artwork.findUnique.mockResolvedValue({ ...artwork, isPublished: false, removedByAdmin: true });
    expect((await put({ isPublished: true })).status).toBe(403);
    // Other edits are still allowed.
    expect((await put({ title: 'Ny titel', isPublished: false })).status).toBe(200);
  });
});
