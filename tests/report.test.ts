import { beforeEach, describe, expect, it, vi } from 'vitest';

const { prisma, sendEmail, getCurrentUser } = vi.hoisted(() => ({
  prisma: { artwork: { findUnique: vi.fn() } },
  sendEmail: vi.fn(() => Promise.resolve()),
  getCurrentUser: vi.fn(),
}));
vi.mock('@/lib/prisma', () => ({ default: prisma }));
vi.mock('@/lib/auth', () => ({ getCurrentUser }));
vi.mock('@/lib/email', async (orig) => ({ ...(await orig<typeof import('@/lib/email')>()), sendEmail }));

import { POST } from '@/app/api/report/route';
import { NextRequest } from 'next/server';

const report = (body: unknown, ip = '1.2.3.4') =>
  POST(new NextRequest('https://konstbyte.se/api/report', {
    method: 'POST',
    body: JSON.stringify(body),
    headers: { 'x-forwarded-for': ip },
  }));

beforeEach(() => {
  vi.clearAllMocks();
  process.env.ADMIN_EMAILS = 'admin@example.com';
  getCurrentUser.mockResolvedValue(null);
  prisma.artwork.findUnique.mockResolvedValue({ title: 'Hav <b>', owner: { name: 'Anna' } });
});

describe('POST /api/report', () => {
  it('emails the admins with an escaped description', async () => {
    const res = await report({ type: 'artwork', id: 'a1', reason: 'Stulen bild <script>' }, '10.0.0.1');
    expect(res.status).toBe(200);
    const mail = sendEmail.mock.calls[0][0] as unknown as { to: string; html: string };
    expect(mail.to).toBe('admin@example.com');
    expect(mail.html).toContain('Hav &lt;b&gt;');
    expect(mail.html).toContain('Stulen bild &lt;script&gt;');
    expect(mail.html).toContain('/artworks/a1');
  });

  it('rejects unknown types and empty reasons', async () => {
    expect((await report({ type: 'order', id: 'x', reason: 'hejhej' }, '10.0.0.2')).status).toBe(400);
    expect((await report({ type: 'artwork', id: 'a1', reason: ' ' }, '10.0.0.2')).status).toBe(400);
    expect(sendEmail).not.toHaveBeenCalled();
  });

  it('returns 404 for content that does not exist', async () => {
    prisma.artwork.findUnique.mockResolvedValue(null);
    expect((await report({ type: 'artwork', id: 'nope', reason: 'Stulen bild' }, '10.0.0.3')).status).toBe(404);
  });

  it('limits how many reports one visitor can send', async () => {
    for (let i = 0; i < 10; i++) await report({ type: 'artwork', id: 'a1', reason: 'Stulen bild' }, '10.0.0.4');
    expect((await report({ type: 'artwork', id: 'a1', reason: 'Stulen bild' }, '10.0.0.4')).status).toBe(429);
  });
});
