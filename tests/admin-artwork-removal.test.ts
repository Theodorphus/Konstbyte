import { beforeEach, describe, expect, it, vi } from 'vitest';

const { prisma, sendEmail, getCurrentUser } = vi.hoisted(() => ({
  prisma: {
    artwork: { findUnique: vi.fn(), findFirst: vi.fn(), update: vi.fn(), delete: vi.fn() },
    favorite: { deleteMany: vi.fn() },
    notification: { create: vi.fn() },
    $transaction: vi.fn(async (ops: unknown[]) => ops),
  },
  sendEmail: vi.fn(() => Promise.resolve()),
  getCurrentUser: vi.fn(),
}));
vi.mock('@/lib/prisma', () => ({ default: prisma }));
vi.mock('@/lib/auth', () => ({ getCurrentUser }));
vi.mock('@/lib/email', async (orig) => ({ ...(await orig<typeof import('@/lib/email')>()), sendEmail }));

import { DELETE, PATCH } from '@/app/api/admin/artworks/[id]/route';
import { NextRequest } from 'next/server';

const ctx = { params: Promise.resolve({ id: 'a1' }) };
const remove = (body?: unknown) =>
  DELETE(
    new NextRequest('https://konstbyte.se/api/admin/artworks/a1', {
      method: 'DELETE',
      body: body === undefined ? undefined : JSON.stringify(body),
    }),
    ctx,
  );
const restore = () =>
  PATCH(
    new NextRequest('https://konstbyte.se/api/admin/artworks/a1', {
      method: 'PATCH',
      body: JSON.stringify({ action: 'restore' }),
    }),
    ctx,
  );

const artwork = (orders: number) => ({
  title: 'Hav <b>',
  ownerId: 'artist1',
  owner: { email: 'artist@example.com' },
  _count: { orders },
});

beforeEach(() => {
  vi.clearAllMocks();
  process.env.ADMIN_EMAILS = 'admin@example.com';
  getCurrentUser.mockResolvedValue({ id: 'admin1', email: 'admin@example.com' });
  prisma.artwork.findUnique.mockResolvedValue(artwork(0));
});

describe('DELETE /api/admin/artworks/[id]', () => {
  it('is for admins only', async () => {
    getCurrentUser.mockResolvedValue({ id: 'u1', email: 'someone@example.com' });
    expect((await remove({ reason: 'Spam' })).status).toBe(403);
    getCurrentUser.mockResolvedValue(null);
    expect((await remove({ reason: 'Spam' })).status).toBe(401);
    expect(prisma.$transaction).not.toHaveBeenCalled();
  });

  it('requires a reason, since the artist is told why', async () => {
    expect((await remove()).status).toBe(400);
    expect((await remove({ reason: '  ' })).status).toBe(400);
    expect((await remove({ reason: 'x'.repeat(1001) })).status).toBe(400);
    expect(prisma.$transaction).not.toHaveBeenCalled();
    expect(sendEmail).not.toHaveBeenCalled();
  });

  it('deletes an artwork without orders and tells the artist why', async () => {
    const res = await remove({ reason: 'Upphovsrätt <script>' });
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ success: true });
    expect(prisma.artwork.delete).toHaveBeenCalledWith({ where: { id: 'a1' } });
    expect(prisma.favorite.deleteMany).toHaveBeenCalledWith({ where: { artworkId: 'a1' } });

    expect(prisma.notification.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        userId: 'artist1',
        type: 'artwork_removed',
        message: expect.stringContaining('Skäl: Upphovsrätt <script>'),
      }),
    });
    // The notice is saved in the same transaction as the removal.
    expect(prisma.$transaction.mock.calls[0][0]).toHaveLength(3);

    const mail = sendEmail.mock.calls[0][0] as unknown as { to: string; subject: string; html: string };
    expect(mail.to).toBe('artist@example.com');
    expect(mail.html).toContain('Upphovsrätt &lt;script&gt;');
    expect(mail.html).toContain('Hav &lt;b&gt;');
    expect(mail.html).toContain('raderat');
    expect(mail.html).toContain('/policies/content');
  });

  it('hides an artwork that has orders instead of deleting it', async () => {
    prisma.artwork.findUnique.mockResolvedValue(artwork(2));
    const res = await remove({ reason: 'Vilseledande annons' });
    expect(await res.json()).toEqual({ success: true, unpublished: true });
    expect(prisma.artwork.delete).not.toHaveBeenCalled();
    expect(prisma.artwork.update).toHaveBeenCalledWith({
      where: { id: 'a1' },
      data: { isPublished: false, removedByAdmin: true },
    });
    expect(prisma.notification.create).toHaveBeenCalled();
    const mail = sendEmail.mock.calls[0][0] as unknown as { html: string };
    expect(mail.html).toContain('orderhistorik');
  });

  it('still removes the artwork when the email cannot be sent', async () => {
    sendEmail.mockRejectedValueOnce(new Error('network down'));
    vi.spyOn(console, 'error').mockImplementation(() => {});
    expect((await remove({ reason: 'Spam' })).status).toBe(200);
    expect(prisma.notification.create).toHaveBeenCalled();
  });

  it('skips the email for artists without an address', async () => {
    prisma.artwork.findUnique.mockResolvedValue({ ...artwork(0), owner: { email: null } });
    expect((await remove({ reason: 'Spam' })).status).toBe(200);
    expect(sendEmail).not.toHaveBeenCalled();
    expect(prisma.notification.create).toHaveBeenCalled();
  });

  it('returns 404 for an artwork that does not exist', async () => {
    prisma.artwork.findUnique.mockResolvedValue(null);
    expect((await remove({ reason: 'Spam' })).status).toBe(404);
  });
});

describe('PATCH /api/admin/artworks/[id] (restore)', () => {
  it('publishes the artwork again and tells the artist', async () => {
    prisma.artwork.findFirst.mockResolvedValue({ title: 'Hav', ownerId: 'artist1' });
    expect((await restore()).status).toBe(200);
    expect(prisma.artwork.update).toHaveBeenCalledWith({
      where: { id: 'a1' },
      data: { removedByAdmin: false, isPublished: true },
    });
    expect(prisma.notification.create).toHaveBeenCalledWith({
      data: expect.objectContaining({ userId: 'artist1', type: 'artwork_restored', link: '/artworks/a1' }),
    });
  });

  it('returns 404 when the artwork was not removed by an admin', async () => {
    prisma.artwork.findFirst.mockResolvedValue(null);
    expect((await restore()).status).toBe(404);
    expect(prisma.$transaction).not.toHaveBeenCalled();
  });
});
