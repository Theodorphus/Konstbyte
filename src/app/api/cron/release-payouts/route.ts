import { NextRequest, NextResponse } from 'next/server';
import prisma from '../../../../lib/prisma';
import { markOrderDelivered, releaseSellerPayout } from '../../../../lib/release-payout';

// GET /api/cron/release-payouts — run daily by Vercel Cron (see vercel.json).
//
// 1. Orders shipped more than AUTO_RELEASE_DAYS ago that the buyer never confirmed
//    are marked delivered and the artist is paid.
// 2. Delivered orders whose payout is still unpaid (e.g. the artist connected
//    Stripe afterwards, or a transfer failed) are retried.
//
// Vercel sends `Authorization: Bearer $CRON_SECRET` automatically when the
// CRON_SECRET env var is set on the project.
export const maxDuration = 60;

const BATCH = 50;

export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    return NextResponse.json({ error: 'CRON_SECRET not configured' }, { status: 500 });
  }
  if (request.headers.get('authorization') !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const days = Number(process.env.AUTO_RELEASE_DAYS) || 14;
  const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

  const overdue = await prisma.order.findMany({
    where: {
      status: { in: ['completed', 'paid'] },
      shippingStatus: 'shipped',
      events: { some: { type: 'shipped', createdAt: { lt: cutoff } } },
    },
    select: { id: true, buyerId: true, artwork: { select: { title: true } } },
    take: BATCH,
  });

  let autoDelivered = 0;
  for (const order of overdue) {
    const marked = await markOrderDelivered(
      order.id,
      `Automatiskt markerad som mottagen ${days} dagar efter att den skickades.`,
      'auto_delivered',
    );
    if (!marked) continue;
    autoDelivered++;
    await prisma.notification.create({
      data: {
        userId: order.buyerId,
        type: 'order_auto_delivered',
        message: `"${order.artwork.title}" har markerats som mottagen ${days} dagar efter leverans. Hör av dig till oss om något inte stämmer.`,
        link: `/orders/${order.id}`,
      },
    });
  }

  const unpaid = await prisma.order.findMany({
    where: {
      status: 'delivered',
      sellerPayoutStatus: 'unpaid',
      paymentMethod: 'stripe',
      // Only sellers who can actually receive a transfer; the rest wait for an admin.
      seller: { stripeAccountId: { not: null } },
    },
    select: { id: true },
    orderBy: { createdAt: 'asc' },
    take: BATCH,
  });

  const results: Record<string, number> = {};
  for (const { id } of unpaid) {
    try {
      const { status } = await releaseSellerPayout(id);
      results[status] = (results[status] ?? 0) + 1;
    } catch (err) {
      console.error(`[cron/release-payouts] order ${id}:`, err);
      results.error = (results.error ?? 0) + 1;
    }
  }

  return NextResponse.json({ autoDelivered, payouts: results });
}
