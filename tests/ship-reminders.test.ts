import { beforeEach, describe, expect, it, vi } from 'vitest';

const { prisma, sendEmail } = vi.hoisted(() => ({
  prisma: {
    order: { findMany: vi.fn() },
    orderEvent: { create: vi.fn() },
    notification: { create: vi.fn() },
    $transaction: vi.fn((ops: unknown[]) => Promise.all(ops)),
  },
  sendEmail: vi.fn(() => Promise.resolve()),
}));
vi.mock('@/lib/prisma', () => ({ default: prisma }));
vi.mock('@/lib/release-payout', () => ({ markOrderDelivered: vi.fn(), releaseSellerPayout: vi.fn() }));
vi.mock('@/lib/email', async (orig) => ({ ...(await orig<typeof import('@/lib/email')>()), sendEmail }));

import { GET } from '@/app/api/cron/release-payouts/route';
import { NextRequest } from 'next/server';

const unshippedOrder = {
  id: 'order_abcdefgh',
  sellerId: 'seller_1',
  seller: { email: 'artist@example.com' },
  artwork: { title: 'Sommarhav <i>' },
};

function run() {
  return GET(new NextRequest('https://konstbyte.se/api/cron/release-payouts', { headers: { authorization: 'Bearer s3cret' } }));
}

beforeEach(() => {
  vi.clearAllMocks();
  process.env.CRON_SECRET = 's3cret';
  process.env.ADMIN_EMAILS = 'admin@example.com';
  // Calls in order: overdue-shipped, unpaid payouts, ship reminders, ship overdue.
  prisma.order.findMany
    .mockResolvedValueOnce([])
    .mockResolvedValueOnce([])
    .mockResolvedValueOnce([unshippedOrder])
    .mockResolvedValueOnce([unshippedOrder]);
});

describe('cron: unshipped orders', () => {
  it('reminds the artist once and tells the admins about overdue orders', async () => {
    const body = await (await run()).json();

    expect(body).toMatchObject({ shipReminders: 1, shipOverdue: 1 });
    const reminderQuery = prisma.order.findMany.mock.calls[2][0];
    expect(reminderQuery.where).toMatchObject({
      shippingStatus: 'not_shipped',
      events: { none: { type: 'ship_reminder' } },
    });
    expect(prisma.notification.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ userId: 'seller_1', type: 'ship_reminder' }) }),
    );
    expect(sendEmail).toHaveBeenCalledWith(expect.objectContaining({ to: 'artist@example.com' }));
    const adminMail = sendEmail.mock.calls.find(([m]) => (m as { to: string }).to === 'admin@example.com')?.[0] as
      | { html: string }
      | undefined;
    expect(adminMail?.html).toContain('#ABCDEFGH');
    expect(adminMail?.html).toContain('Sommarhav &lt;i&gt;');
  });

  it('rejects calls without the cron secret', async () => {
    const res = await GET(new NextRequest('https://konstbyte.se/api/cron/release-payouts'));
    expect(res.status).toBe(401);
  });
});
