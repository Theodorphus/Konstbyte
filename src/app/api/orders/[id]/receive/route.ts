import { NextRequest, NextResponse } from 'next/server';
import prisma from '../../../../../lib/prisma';
import { getCurrentUser } from '../../../../../lib/auth';
import { markOrderDelivered, releaseSellerPayout } from '../../../../../lib/release-payout';

// POST /api/orders/[id]/receive
// The buyer confirms the artwork has arrived. This releases the artist's payout.
export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

  const order = await prisma.order.findUnique({
    where: { id },
    include: { artwork: { select: { title: true } } },
  });
  if (!order || order.buyerId !== user.id) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }
  // Only a paid order can be received — otherwise an unpaid order would create a payout.
  if (!['completed', 'paid'].includes(order.status)) {
    return NextResponse.json({ error: 'Order is not paid' }, { status: 409 });
  }

  const marked = await markOrderDelivered(id, 'Köparen har bekräftat mottagandet.');
  if (!marked) return NextResponse.json({ error: 'Already delivered' }, { status: 409 });

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

  return NextResponse.json({ ok: true, payout: result.status });
}
