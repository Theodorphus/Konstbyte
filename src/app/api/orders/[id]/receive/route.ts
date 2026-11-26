import { NextRequest, NextResponse } from 'next/server';
import prisma from '../../../../../lib/prisma';
import { getCurrentUser } from '../../../../../lib/auth';
import { markOrderDelivered, releaseSellerPayout } from '../../../../../lib/release-payout';
import { notificationText } from '../../../../../lib/notification-message';

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
  // The page the form was on (keeps /en/ for English visitors).
  const orderPage = () => {
    let target = new URL(`/orders/${id}`, req.url);
    try {
      const referer = new URL(req.headers.get('referer') ?? '');
      if (referer.origin === target.origin) target = referer;
    } catch {
      // No or malformed Referer: use the default order page.
    }
    return target;
  };
  const backToOrder = () => NextResponse.redirect(orderPage(), 303);

  const user = await getCurrentUser();
  if (!user) {
    if (!fromForm) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    // Signed out (e.g. the session expired): sign in, then come back to the order.
    const back = orderPage();
    const path = back.pathname + back.search;
    const prefix = path === '/en' || path.startsWith('/en/') ? '/en' : '';
    return NextResponse.redirect(new URL(`${prefix}/auth/signin?callbackUrl=${encodeURIComponent(path)}`, req.url), 303);
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
    await prisma.notification.create({
      data: {
        userId: order.sellerId,
        type: 'order_delivered',
        ...notificationText(result.status === 'transferred' ? 'order_delivered_stripe' : 'order_delivered_manual', {
          title: order.artwork.title,
          amount: Math.round(result.sellerPayoutAmount),
        }),
        link: `/orders/${id}`,
      },
    });
  }

  if (fromForm) return backToOrder();
  return NextResponse.json({ ok: true, payout: result.status });
}
