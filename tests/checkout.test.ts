import { beforeEach, describe, expect, it, vi } from 'vitest';

const { prisma, getCurrentUser, stripe } = vi.hoisted(() => ({
  prisma: {
    artwork: { findUnique: vi.fn() },
    order: { count: vi.fn(), create: vi.fn(), update: vi.fn() },
  },
  getCurrentUser: vi.fn(),
  stripe: { checkout: { sessions: { create: vi.fn() } } },
}));
vi.mock('@/lib/prisma', () => ({ default: prisma }));
vi.mock('@/lib/auth', () => ({ getCurrentUser }));
vi.mock('@/lib/stripe', () => ({ default: stripe }));

import { POST } from '@/app/api/checkout/stripe/route';

const address = { fullName: 'Anna Berg', streetAddress: 'Storgatan 1', postalCode: '411 01', city: 'Göteborg', phone: '070' };
const checkout = (body: unknown) => POST(new Request('https://konstbyte.se/api/checkout/stripe', { method: 'POST', body: JSON.stringify(body) }));

let buyer = 0;
// Two different counts: the buyer's own recent attempts, and other buyers paying for the artwork.
let recentAttempts = 0;
let othersPaying = 0;
beforeEach(() => {
  recentAttempts = 0;
  othersPaying = 0;
  vi.clearAllMocks();
  getCurrentUser.mockResolvedValue({ id: `buyer_${++buyer}`, email: 'b@example.com' });
  prisma.artwork.findUnique.mockResolvedValue({
    id: 'art1', ownerId: 'artist', isPublished: true, isSold: false, price: 1000, title: 'Hav',
    description: null, imageUrl: 'https://x/y.jpg', shippingType: 'postnord', shippingCost: null, owner: { id: 'artist', name: 'Anna' },
  });
  prisma.order.count.mockImplementation(({ where }: { where: { artworkId?: string } }) =>
    Promise.resolve(where.artworkId ? othersPaying : recentAttempts),
  );
  prisma.order.create.mockResolvedValue({ id: 'order1' });
  stripe.checkout.sessions.create.mockResolvedValue({ id: 'cs_1', url: 'https://stripe/cs_1' });
});

describe('POST /api/checkout/stripe', () => {
  it('creates a 30-minute checkout with a trimmed address', async () => {
    const res = await checkout({ artworkId: 'art1', shippingAddress: { ...address, city: '  Göteborg  ' } });
    expect(res.status).toBe(200);
    expect(prisma.order.create.mock.calls[0][0].data).toMatchObject({ shippingCity: 'Göteborg', shippingName: 'Anna Berg' });
    const expiresAt = stripe.checkout.sessions.create.mock.calls[0][0].expires_at;
    const minutes = (expiresAt * 1000 - Date.now()) / 60000;
    expect(minutes).toBeGreaterThan(30);
    expect(minutes).toBeLessThan(35);
  });

  it('requires a delivery address unless it is a pickup', async () => {
    expect((await checkout({ artworkId: 'art1', shippingAddress: { fullName: 'Anna' } })).status).toBe(400);
    const pickup = { ...(await prisma.artwork.findUnique()), shippingType: 'pickup' };
    prisma.artwork.findUnique.mockResolvedValue(pickup);
    expect((await checkout({ artworkId: 'art1', shippingAddress: {} })).status).toBe(200);
  });

  it('stops a second buyer while someone else is paying', async () => {
    othersPaying = 1;
    const res = await checkout({ artworkId: 'art1', shippingAddress: address });
    expect(res.status).toBe(409);
    expect(stripe.checkout.sessions.create).not.toHaveBeenCalled();
    const where = prisma.order.count.mock.calls.map((c) => c[0].where).find((w) => w.artworkId);
    expect(where).toMatchObject({ artworkId: 'art1', buyerId: { not: expect.any(String) } });
  });

  it('limits how many checkouts one buyer can start per hour', async () => {
    recentAttempts = 10;
    const res = await checkout({ artworkId: 'art1', shippingAddress: address });
    expect(res.status).toBe(429);
    expect(prisma.order.create).not.toHaveBeenCalled();
    recentAttempts = 9;
    expect((await checkout({ artworkId: 'art1', shippingAddress: address })).status).toBe(200);
  });

  it('keeps English buyers in English', async () => {
    await checkout({ artworkId: 'art1', shippingAddress: address, locale: 'en' });
    await checkout({ artworkId: 'art1', shippingAddress: address });
    const [en, sv] = stripe.checkout.sessions.create.mock.calls.map((c) => c[0]);
    expect(en).toMatchObject({ locale: 'en', success_url: expect.stringContaining('/en/success?orderId=order1') });
    expect(en.cancel_url).toContain('/en/cancel?orderId=order1');
    expect(sv.locale).toBe('sv');
    expect(sv.success_url).not.toContain('/en/');
  });
});
