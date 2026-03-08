import { NextRequest, NextResponse } from 'next/server';
import prisma from '../../../../lib/prisma';
import { getCurrentUser } from '../../../../lib/auth';
import { sendEmail, buyerConfirmationEmail, sellerNotificationEmail } from '../../../../lib/email';
import { calculatePayout, defaultCommissionRate } from '../../../../lib/payout';

function isAdmin(email: string | null | undefined): boolean {
  const adminEmails = (process.env.ADMIN_EMAIL ?? '')
    .split(',')
    .map((e) => e.trim())
    .filter(Boolean);
  return email ? adminEmails.includes(email) : false;
}

// GET /api/admin/payouts
// ?filter=completed  → returns completed Payout records (history)
// (default)          → returns pendingSwish + unpaidPayouts
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

  const [pendingSwish, unpaidPayouts] = await Promise.all([
    prisma.order.findMany({
      where: { status: 'awaiting_swish' },
      include: {
        artwork: { select: { id: true, title: true, imageUrl: true } },
        buyer: { select: { name: true, email: true } },
        seller: { select: { id: true, name: true, email: true } },
      },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.order.findMany({
      where: {
        status: { in: ['completed', 'paid', 'delivered'] },
        sellerPayoutStatus: 'unpaid',
      },
      include: {
        artwork: { select: { id: true, title: true, imageUrl: true } },
        buyer: { select: { name: true, email: true } },
        seller: { select: { id: true, name: true, email: true } },
        items: { take: 1 },
      },
      orderBy: { createdAt: 'desc' },
    }),
  ]);

  return NextResponse.json({ pendingSwish, unpaidPayouts });
}

// PATCH /api/admin/payouts
// action: 'confirm_swish' — mark Swish order as paid, send buyer+seller confirmation emails
// action: 'payout'       — mark seller payout as done, create Payout record, send seller payout email
export async function PATCH(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user || !isAdmin(user.email)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }

  const { orderId, note, action = 'payout', method = 'swish' } = await request.json();
  if (!orderId) {
    return NextResponse.json({ error: 'orderId saknas' }, { status: 400 });
  }

  const appUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';

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

    const updated = await prisma.order.update({
      where: { id: orderId },
      data: { status: 'paid' },
    });

    const amountSek = Math.round(order.amount);

    if (order.buyer.email) {
      const { subject, html } = buyerConfirmationEmail({
        orderId,
        artworkTitle: order.artwork.title,
        imageUrl: order.artwork.imageUrl ?? '',
        artistName: order.seller?.name ?? 'Konstnären',
        amountSek,
        appUrl,
      });
      await sendEmail({ to: order.buyer.email, subject, html });
    }

    if (order.seller?.email) {
      const { subject, html } = sellerNotificationEmail({
        orderId,
        artworkTitle: order.artwork.title,
        buyerName: order.buyer.name ?? 'En köpare',
        amountSek,
        appUrl,
      });
      await sendEmail({ to: order.seller.email, subject, html });
    }

    return NextResponse.json({ ok: true, order: updated });
  }

  // ── Mark seller payout as done ───────────────────────────────────────────
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: {
      seller: { select: { id: true, name: true, email: true } },
      artwork: { select: { title: true } },
    },
  });
  if (!order) return NextResponse.json({ error: 'Order hittades inte' }, { status: 404 });
  if (order.sellerPayoutStatus === 'paid') {
    return NextResponse.json({ error: 'Utbetalning redan markerad' }, { status: 409 });
  }
  if (!order.sellerId) {
    return NextResponse.json({ error: 'Säljare saknas på order' }, { status: 400 });
  }

  const rate = defaultCommissionRate();
  const { commissionAmount, commissionVat, sellerPayoutAmount } = calculatePayout(order.amount, rate);

  const [updated] = await prisma.$transaction([
    prisma.order.update({
      where: { id: orderId },
      data: {
        sellerPayoutStatus: 'paid',
        sellerPayoutNote: note ?? null,
        sellerPayoutAt: new Date(),
      },
    }),
    prisma.payout.create({
      data: {
        sellerId: order.sellerId,
        orderId,
        amount: order.amount,
        commissionRate: rate,
        commissionAmount,
        commissionVat,
        sellerPayoutAmount,
        method,
        status: 'completed',
        adminNote: note ?? null,
        completedAt: new Date(),
      },
    }),
  ]);

  if (order.seller?.email) {
    await sendEmail({
      to: order.seller.email,
      subject: `Utbetalning skickad – ${order.artwork.title}`,
      html: `
        <div style="font-family:sans-serif;max-width:520px;margin:0 auto;color:#1e293b">
          <h2>Din utbetalning är på väg! 💸</h2>
          <p style="color:#475569;font-size:14px">
            Konstbyte har nu genomfört utbetalningen för försäljningen av
            <strong>${order.artwork.title}</strong> (order #${orderId.slice(0, 8)}).
          </p>
          <table style="width:100%;border-collapse:collapse;font-size:14px;margin:16px 0">
            <tr><td style="padding:6px 0;color:#94a3b8">Ordertotal</td><td style="text-align:right">${order.amount.toLocaleString('sv-SE', { style: 'currency', currency: 'SEK', minimumFractionDigits: 0 })}</td></tr>
            <tr><td style="padding:6px 0;color:#94a3b8">Provision (${Math.round(rate * 100)}%)</td><td style="text-align:right;color:#dc2626">-${commissionAmount.toLocaleString('sv-SE', { style: 'currency', currency: 'SEK', minimumFractionDigits: 0 })}</td></tr>
            <tr style="border-top:1px solid #e2e8f0"><td style="padding:8px 0;font-weight:bold">Din utbetalning</td><td style="text-align:right;font-weight:bold;color:#16a34a">${sellerPayoutAmount.toLocaleString('sv-SE', { style: 'currency', currency: 'SEK', minimumFractionDigits: 0 })}</td></tr>
          </table>
          ${note ? `<p style="font-size:14px;padding:12px;background:#f1f5f9;border-radius:6px;color:#475569">Anteckning: ${note}</p>` : ''}
          <p style="font-size:12px;color:#94a3b8;margin-top:24px">Konstbyte — tack för att du säljer hos oss.</p>
        </div>
      `,
    });
  }

  return NextResponse.json({ ok: true, order: updated });
}
