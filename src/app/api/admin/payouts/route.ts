import { APP_URL } from '@/lib/urls';
import { NextRequest, NextResponse } from 'next/server';
import prisma from '../../../../lib/prisma';
import { getCurrentUser } from '../../../../lib/auth';
import { sendEmail, buyerConfirmationEmail, sellerNotificationEmail, escapeHtml } from '../../../../lib/email';
import { calculatePayout, defaultCommissionRate } from '../../../../lib/payout';
import { isAdmin } from '../../../../lib/admin';
import { releaseSellerPayout } from '../../../../lib/release-payout';
import { chargeIdForPaymentIntent, stripeChargeCosts } from '../../../../lib/stripe-fee';

const orderInclude = {
  artwork: { select: { id: true, title: true, imageUrl: true } },
  buyer: { select: { name: true, email: true } },
  seller: { select: { id: true, name: true, email: true } },
  payout: { select: { sellerPayoutAmount: true, commissionAmount: true, adminNote: true, createdAt: true } },
};

// GET /api/admin/payouts
// ?filter=completed  → returns completed Payout records (history)
// (default)          → returns pendingSwish, unpaidPayouts (received by the buyer,
//                       needs a manual payout), awaitingStripe (received, waiting for
//                       the artist to connect Stripe) and onHold (paused by a refund or dispute)
export async function GET(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user || !isAdmin(user.email)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }

  const filter = request.nextUrl.searchParams.get('filter');

  if (filter === 'completed') {
    const completedPayouts = await prisma.payout.findMany({
      where: { status: 'completed' },
      include: {
        seller: { select: { id: true, name: true, email: true } },
        order: {
          select: {
            id: true,
            createdAt: true,
            paymentMethod: true,
            artwork: { select: { id: true, title: true, imageUrl: true } },
            buyer: { select: { name: true, email: true } },
          },
        },
      },
      orderBy: { completedAt: 'desc' },
    });
    return NextResponse.json({ completedPayouts });
  }

  const [pendingSwish, unpaidPayouts, awaitingStripe, onHold] = await Promise.all([
    prisma.order.findMany({
      where: { status: 'awaiting_swish' },
      include: orderInclude,
      orderBy: { createdAt: 'desc' },
    }),
    // Only orders the buyer has received. Before that the money must stay with
    // Konstbyte, and artists with Stripe are paid automatically on delivery, so
    // what's left here is what an admin has to pay by hand.
    prisma.order.findMany({
      where: { status: 'delivered', sellerPayoutStatus: 'unpaid' },
      include: orderInclude,
      orderBy: { createdAt: 'desc' },
    }),
    // The artist hasn't connected Stripe: the money stays with Konstbyte until
    // they do (or an admin pays by hand). Shown so it is never forgotten.
    prisma.order.findMany({
      where: { status: 'delivered', sellerPayoutStatus: 'awaiting_stripe' },
      include: orderInclude,
      orderBy: { createdAt: 'asc' },
    }),
    prisma.order.findMany({
      where: { sellerPayoutStatus: 'on_hold' },
      include: orderInclude,
      orderBy: { createdAt: 'desc' },
    }),
  ]);

  return NextResponse.json({ pendingSwish, unpaidPayouts, awaitingStripe, onHold });
}

// PATCH /api/admin/payouts
// action: 'confirm_swish' — mark Swish order as paid, send buyer+seller confirmation emails
// action: 'payout'        — mark seller payout as done, create Payout record, send seller payout email
// action: 'release_hold'  — a paused payout (refund/dispute) goes back to the normal flow
// action: 'cancel_payout' — a paused payout is cancelled; the artist gets nothing
export async function PATCH(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user || !isAdmin(user.email)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }

  const { orderId, note, action = 'payout', method = 'swish' } = await request.json();
  if (!orderId) {
    return NextResponse.json({ error: 'orderId saknas' }, { status: 400 });
  }
  const noteText = typeof note === 'string' && note.trim() ? note.trim().slice(0, 500) : null;

  const appUrl = APP_URL;

  // ── Confirm Swish payment (buyer paid) ───────────────────────────────────
  if (action === 'confirm_swish') {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        buyer: { select: { name: true, email: true } },
        seller: { select: { name: true, email: true } },
        artwork: { select: { title: true, imageUrl: true } },
      },
    });
    if (!order) return NextResponse.json({ error: 'Order hittades inte' }, { status: 404 });
    if (order.status === 'paid') return NextResponse.json({ error: 'Redan bekräftad' }, { status: 409 });

    const [updated] = await prisma.$transaction([
      prisma.order.update({
        where: { id: orderId },
        data: { status: 'paid' },
      }),
      prisma.artwork.update({
        where: { id: order.artworkId },
        data: { isSold: true, soldAt: new Date() },
      }),
    ]);

    const amountSek = Math.round(order.amount);

    if (order.buyer.email) {
      const { subject, html } = buyerConfirmationEmail({
        orderId,
        artworkTitle: order.artwork.title,
        imageUrl: order.artwork.imageUrl ?? '',
        artistName: order.seller?.name ?? 'Konstnären',
        amountSek,
        shippingCost: order.shippingCost,
        appUrl,
      });
      await sendEmail({ to: order.buyer.email, subject, html });
    }

    if (order.seller?.email) {
      const { subject, html } = sellerNotificationEmail({
        orderId,
        artworkTitle: order.artwork.title,
        imageUrl: order.artwork.imageUrl ?? undefined,
        buyerName: order.buyer.name ?? 'En köpare',
        amountSek,
        sellerPayoutSek: calculatePayout(order.amount, defaultCommissionRate()).sellerPayoutAmount,
        appUrl,
      });
      await sendEmail({ to: order.seller.email, subject, html });
    }

    return NextResponse.json({ ok: true, order: updated });
  }

  // ── Paused payouts (refund or dispute) ───────────────────────────────────
  if (action === 'release_hold' || action === 'cancel_payout') {
    const held = await prisma.order.findUnique({
      where: { id: orderId },
      select: { id: true, status: true, sellerPayoutStatus: true },
    });
    if (!held) return NextResponse.json({ error: 'Order hittades inte' }, { status: 404 });
    if (held.sellerPayoutStatus !== 'on_hold') {
      return NextResponse.json({ error: 'Utbetalningen är inte pausad' }, { status: 409 });
    }

    if (action === 'cancel_payout') {
      await prisma.$transaction([
        prisma.order.update({
          where: { id: orderId },
          data: { sellerPayoutStatus: 'cancelled', sellerPayoutNote: noteText ?? 'Utbetalningen avbröts av Konstbyte.' },
        }),
        prisma.payout.updateMany({ where: { orderId, status: { not: 'completed' } }, data: { status: 'cancelled' } }),
        prisma.orderEvent.create({
          data: { orderId, type: 'payout_cancelled', message: 'Utbetalningen till konstnären avbröts.' },
        }),
      ]);
      return NextResponse.json({ ok: true });
    }

    await prisma.$transaction([
      prisma.order.update({ where: { id: orderId }, data: { sellerPayoutStatus: 'unpaid', sellerPayoutNote: null } }),
      prisma.orderEvent.create({
        data: { orderId, type: 'payout_unpaused', message: 'Pausen hävdes. Utbetalningen följer det vanliga flödet.' },
      }),
    ]);
    // Already received by the buyer: pay right away instead of waiting for the cron.
    const result = held.status === 'delivered' ? await releaseSellerPayout(orderId) : null;
    return NextResponse.json({ ok: true, payout: result?.status ?? 'waiting_for_delivery' });
  }

  // ── Mark seller payout as done ───────────────────────────────────────────
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: {
      seller: { select: { id: true, name: true, email: true } },
      artwork: { select: { title: true } },
      payments: { select: { stripeId: true } },
    },
  });
  if (!order) return NextResponse.json({ error: 'Order hittades inte' }, { status: 404 });
  if (order.sellerPayoutStatus === 'paid') {
    return NextResponse.json({ error: 'Utbetalning redan markerad' }, { status: 409 });
  }
  if (order.sellerPayoutStatus === 'cancelled' || order.status === 'refunded') {
    return NextResponse.json({ error: 'Köpet är återbetalt – ingen utbetalning ska göras' }, { status: 409 });
  }
  if (order.sellerPayoutStatus === 'on_hold') {
    return NextResponse.json({ error: 'Utbetalningen är pausad – släpp eller avbryt den först' }, { status: 409 });
  }
  if (order.status !== 'delivered') {
    return NextResponse.json({ error: 'Köparen har inte tagit emot verket än' }, { status: 409 });
  }
  if (!order.sellerId) {
    return NextResponse.json({ error: 'Säljare saknas på order' }, { status: 400 });
  }

  // Same sum as an automatic payout: minus commission and Stripe's fee, based on
  // what the buyer kept paying if part of it was refunded.
  let stripeFee = 0;
  let refunded = 0;
  const paymentIntentId = order.payments.find((p) => p.stripeId.startsWith('pi_'))?.stripeId;
  if (order.paymentMethod === 'stripe' && paymentIntentId) {
    try {
      const chargeId = await chargeIdForPaymentIntent(paymentIntentId);
      const costs = chargeId ? await stripeChargeCosts(chargeId) : null;
      if (!costs) throw new Error('fee unknown');
      ({ fee: stripeFee, refunded } = costs);
    } catch (err) {
      console.error(`[admin/payouts] could not read the Stripe fee for order ${orderId}:`, err);
      return NextResponse.json({ error: 'Kunde inte läsa Stripes avgift. Försök igen om en stund.' }, { status: 502 });
    }
  }

  const rate = defaultCommissionRate();
  const paidAmount = Math.max(0, order.amount - refunded);
  const { commissionAmount, commissionVat, sellerPayoutAmount } = calculatePayout(paidAmount, rate, stripeFee);
  const payoutFields = {
    amount: paidAmount,
    commissionRate: rate,
    commissionAmount,
    commissionVat,
    sellerPayoutAmount,
    method,
    status: 'completed',
    adminNote: noteText,
    completedAt: new Date(),
  };

  // Claim the order only if it is still unpaid, so nothing is paid twice. An
  // order waiting for Stripe can only be paid by hand while the artist still
  // hasn't connected Stripe: connecting marks them ready before any automatic
  // transfer, and that transfer checks the order again (lib/release-payout.ts).
  const sellerId = order.sellerId;
  const updated = await prisma.$transaction(async (tx) => {
    const { count } = await tx.order.updateMany({
      where: {
        id: orderId,
        status: 'delivered',
        OR: [
          { sellerPayoutStatus: 'unpaid' },
          { sellerPayoutStatus: 'awaiting_stripe', seller: { is: { stripeOnboardingDone: false } } },
        ],
      },
      data: {
        sellerPayoutStatus: 'paid',
        sellerPayoutNote: noteText,
        sellerPayoutAt: new Date(),
      },
    });
    if (count === 0) return null;
    // Upsert: a pending Payout row already exists if the buyer confirmed receipt.
    await tx.payout.upsert({
      where: { orderId },
      create: { sellerId, orderId, ...payoutFields },
      update: payoutFields,
    });
    return tx.order.findUnique({ where: { id: orderId } });
  });
  if (!updated) {
    return NextResponse.json(
      { error: 'Utbetalningen har redan hanterats, eller så har konstnären just kopplat Stripe och får pengarna automatiskt. Ladda om sidan.' },
      { status: 409 },
    );
  }

  if (order.seller?.email) {
    const fmt = (v: number) => v.toLocaleString('sv-SE', { style: 'currency', currency: 'SEK', maximumFractionDigits: 0 });
    const row = (label: string, value: string, style = '') =>
      `<tr><td style="padding:6px 0;color:#94a3b8">${label}</td><td style="text-align:right;${style}">${value}</td></tr>`;
    await sendEmail({
      to: order.seller.email,
      subject: `Utbetalning skickad – ${order.artwork.title}`,
      html: `
        <div style="font-family:sans-serif;max-width:520px;margin:0 auto;color:#1e293b">
          <h2>Din utbetalning är på väg! 💸</h2>
          <p style="color:#475569;font-size:14px">
            Konstbyte har nu genomfört utbetalningen för försäljningen av
            <strong>${escapeHtml(order.artwork.title)}</strong> (order #${orderId.slice(-8).toUpperCase()}).
          </p>
          <table style="width:100%;border-collapse:collapse;font-size:14px;margin:16px 0">
            ${row('Betalt av köparen', fmt(paidAmount))}
            ${row(`Provision (${Math.round(rate * 100)}%)`, `-${fmt(commissionAmount)}`, 'color:#dc2626')}
            ${stripeFee > 0 ? row('Stripes avgift', `-${fmt(stripeFee)}`, 'color:#dc2626') : ''}
            <tr style="border-top:1px solid #e2e8f0"><td style="padding:8px 0;font-weight:bold">Din utbetalning</td><td style="text-align:right;font-weight:bold;color:#16a34a">${fmt(sellerPayoutAmount)}</td></tr>
          </table>
          ${noteText ? `<p style="font-size:14px;padding:12px;background:#f1f5f9;border-radius:6px;color:#475569">Anteckning: ${escapeHtml(noteText)}</p>` : ''}
          <p style="font-size:12px;color:#94a3b8;margin-top:24px">Konstbyte — tack för att du säljer hos oss.</p>
        </div>
      `,
    });
  }

  return NextResponse.json({ ok: true, order: updated, sellerPayoutAmount });
}
