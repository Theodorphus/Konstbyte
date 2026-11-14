import { NextRequest, NextResponse } from 'next/server';
import prisma from '../../../../../lib/prisma';
import { getCurrentUser } from '../../../../../lib/auth';
import { markOrderDelivered, releaseSellerPayout } from '../../../../../lib/release-payout';

// POST /api/orders/[id]/receive
// The buyer confirms the artwork has arrived. This releases the artist's payout.
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  // The order page posts a plain HTML form; send the browser back to the order
  // instead of showing raw JSON. fetch() callers still get JSON.
  const fromForm = (req.headers.get('accept') ?? '').includes('text/html');
  const backToOrder = () => {
    // Go back to the page the form was on (keeps /en/ for English visitors).
    let target = new URL(`/orders/${id}`, req.url);
    try {
      const referer = new URL(req.headers.get('referer') ?? '');
      if (referer.origin === target.origin) target = referer;
    } catch {
      // No or malformed Referer: use the default order page.
    }
    return NextResponse.redirect(target, 303);
  };

  const user = await getCurrentUser();
  if (!user) {
    return fromForm
      ? NextResponse.redirect(new URL('/auth/signin', req.url), 303)
      : NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  const order = await prisma.order.findUnique({
    where: { id },
    include: { artwork: { select: { title: true } } },
  });
  if (!order || order.buyerId !== user.id) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }
  // Already handled (e.g. double click or back button): just show the order.
  if (fromForm && order.shippingStatus === 'delivered') return backToOrder();
  // Only a paid order can be received — otherwise an unpaid order would create a payout.
  if (!['completed', 'paid'].includes(order.status)) {
    if (fromForm) return backToOrder();
    return NextResponse.json({ error: 'Order is not paid' }, { status: 409 });
  }

  const marked = await markOrderDelivered(id, 'Köparen har bekräftat mottagandet.');
  if (!marked) {
    if (fromForm) return backToOrder();
    return NextResponse.json({ error: 'Already delivered' }, { status: 409 });
  }

  const result = await releaseSellerPayout(id);

  if (order.sellerId && (result.status === 'transferred' || result.status === 'manual')) {
    const amount = Math.round(result.sellerPayoutAmount).toLocaleString('sv-SE');
    await prisma.notification.create({
      data: {
        userId: order.sellerId,
        type: 'order_delivered',
        message:
          result.status === 'transferred'
            ? `Köparen har bekräftat mottagandet av "${order.artwork.title}". ${amount} kr är på väg till ditt Stripe-konto.`
            : `Köparen har bekräftat mottagandet av "${order.artwork.title}". En utbetalning på ${amount} kr har skapats och behandlas av Konstbyte.`,
        link: `/orders/${id}`,
      },
    });
  }

  if (fromForm) return backToOrder();
  return NextResponse.json({ ok: true, payout: result.status });
}
