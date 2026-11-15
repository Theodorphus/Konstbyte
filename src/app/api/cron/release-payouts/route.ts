import { NextRequest, NextResponse } from 'next/server';
import prisma from '../../../../lib/prisma';
import { markOrderDelivered, releaseSellerPayout } from '../../../../lib/release-payout';
import { sendEmail, shipReminderEmail, escapeHtml } from '../../../../lib/email';
import { adminEmails } from '../../../../lib/admin';
import { APP_URL } from '../../../../lib/urls';

// GET /api/cron/release-payouts — run daily by Vercel Cron (see vercel.json).
//
// 1. Orders shipped more than AUTO_RELEASE_DAYS ago that the buyer never confirmed
//    are marked delivered and the artist is paid.
// 2. Delivered orders whose payout is still unpaid (e.g. the artist connected
//    Stripe afterwards, or a transfer failed) are retried.
// 3. Paid orders that haven't been shipped: the artist is reminded after
//    SHIP_REMINDER_DAYS (default 3) and the admins are told after
//    SHIP_OVERDUE_DAYS (default 7), so a buyer is never left waiting unnoticed.
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
      // 'awaiting_stripe' = the seller hadn't connected Stripe yet; retried daily
      // so the money goes out once they have.
      sellerPayoutStatus: { in: ['unpaid', 'awaiting_stripe'] },
      paymentMethod: 'stripe',
      // Only sellers who have at least started connecting Stripe.
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

  const reminders = await remindUnshipped();

  return NextResponse.json({ autoDelivered, payouts: results, ...reminders });
}

const DAY = 24 * 60 * 60 * 1000;

async function remindUnshipped() {
  const reminderDays = Number(process.env.SHIP_REMINDER_DAYS) || 3;
  const overdueDays = Number(process.env.SHIP_OVERDUE_DAYS) || 7;
  const unshipped = { status: { in: ['completed', 'paid'] }, shippingStatus: 'not_shipped' };
  const select = {
    id: true,
    sellerId: true,
    seller: { select: { email: true } },
    artwork: { select: { title: true } },
  };

  // Each reminder is sent once: the order event marks it as done.
  const toRemind = await prisma.order.findMany({
    where: {
      ...unshipped,
      createdAt: { lt: new Date(Date.now() - reminderDays * DAY) },
      events: { none: { type: 'ship_reminder' } },
    },
    select,
    take: BATCH,
  });
  let shipReminders = 0;
  for (const order of toRemind) {
    if (!order.sellerId) continue;
    await prisma.$transaction([
      prisma.orderEvent.create({
        data: { orderId: order.id, type: 'ship_reminder', message: 'Konstnären påmindes om att skicka verket.' },
      }),
      prisma.notification.create({
        data: {
          userId: order.sellerId,
          type: 'ship_reminder',
          message: `Köparen väntar på "${order.artwork.title}". Skicka verket och markera det som skickat.`,
          link: '/seller/orders',
        },
      }),
    ]);
    shipReminders++;
    if (order.seller?.email) {
      const mail = shipReminderEmail({ artworkTitle: order.artwork.title, days: reminderDays, appUrl: APP_URL });
      await sendEmail({ to: order.seller.email, ...mail }).catch((err) =>
        console.error(`[cron/release-payouts] reminder email failed for ${order.id}:`, err),
      );
    }
  }

  const overdue = await prisma.order.findMany({
    where: {
      ...unshipped,
      createdAt: { lt: new Date(Date.now() - overdueDays * DAY) },
      events: { none: { type: 'ship_overdue' } },
    },
    select,
    take: BATCH,
  });
  for (const order of overdue) {
    await prisma.orderEvent.create({
      data: { orderId: order.id, type: 'ship_overdue', message: `Inte skickad efter ${overdueDays} dagar. Konstbyte har meddelats.` },
    });
  }
  if (overdue.length > 0) {
    const list = overdue
      .map((o) => `<li><a href="${APP_URL}/orders/${o.id}">#${o.id.slice(-8).toUpperCase()}</a> – ${escapeHtml(o.artwork.title)}</li>`)
      .join('');
    const html = `<div style="font-family:sans-serif;max-width:560px">
      <p>De här köpen har inte skickats ${overdueDays} dagar efter betalningen. Kontakta konstnären, och återbetala köparen i Stripe om verket inte kan skickas (då stoppas utbetalningen automatiskt).</p>
      <ul>${list}</ul>
    </div>`;
    await Promise.allSettled(
      adminEmails().map((to) => sendEmail({ to, subject: `${overdue.length} köp har inte skickats`, html })),
    );
  }

  return { shipReminders, shipOverdue: overdue.length };
}
