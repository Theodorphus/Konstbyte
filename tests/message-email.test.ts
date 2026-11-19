import { beforeEach, describe, expect, it, vi } from 'vitest';

const { prisma, sendEmail, getCurrentUser } = vi.hoisted(() => ({
  prisma: {
    message: { count: vi.fn(), create: vi.fn() },
    user: { findUnique: vi.fn() },
    notification: { findFirst: vi.fn(), create: vi.fn() },
  },
  sendEmail: vi.fn(() => Promise.resolve()),
  getCurrentUser: vi.fn(),
}));
vi.mock('@/lib/prisma', () => ({ default: prisma }));
vi.mock('../src/lib/prisma', () => ({ default: prisma }));
vi.mock('@/lib/auth', () => ({ getCurrentUser }));
vi.mock('../src/lib/auth', () => ({ getCurrentUser }));
vi.mock('@/lib/email', async (orig) => ({ ...(await orig<typeof import('@/lib/email')>()), sendEmail }));

import { POST } from '@/app/api/messages/[userId]/route';
import { NextRequest } from 'next/server';

const send = (content: string) =>
  POST(new NextRequest('https://konstbyte.se/api/messages/artist', { method: 'POST', body: JSON.stringify({ content }) }), {
    params: Promise.resolve({ userId: 'artist' }),
  });

beforeEach(() => {
  vi.clearAllMocks();
  getCurrentUser.mockResolvedValue({ id: 'buyer', name: 'Kalle <b>' });
  prisma.user.findUnique.mockResolvedValue({ id: 'artist', email: 'artist@example.com' });
  prisma.message.create.mockImplementation(({ data }) => Promise.resolve({ id: 'm_new', ...data }));
  prisma.notification.findFirst.mockResolvedValue(null);
  // rate-limit counts (minute, day) then the "recent from sender" count
  prisma.message.count.mockResolvedValueOnce(0).mockResolvedValueOnce(0).mockResolvedValueOnce(0);
});

describe('POST /api/messages/[userId] email', () => {
  it('emails the recipient with an escaped preview and a link back', async () => {
    expect((await send('Hej! Finns verket kvar? <script>')).status).toBe(201);
    expect(sendEmail).toHaveBeenCalledTimes(1);
    const mail = sendEmail.mock.calls[0][0] as unknown as { to: string; subject: string; html: string };
    expect(mail.to).toBe('artist@example.com');
    expect(mail.html).toContain('Finns verket kvar? &lt;script&gt;');
    expect(mail.html).toContain('Kalle &lt;b&gt;');
    expect(mail.html).toContain('/messages/buyer');
  });

  it('does not email again within three hours of the last message', async () => {
    prisma.message.count.mockReset();
    prisma.message.count.mockResolvedValueOnce(0).mockResolvedValueOnce(0).mockResolvedValueOnce(2);
    expect((await send('En till fråga')).status).toBe(201);
    expect(sendEmail).not.toHaveBeenCalled();
  });
});
