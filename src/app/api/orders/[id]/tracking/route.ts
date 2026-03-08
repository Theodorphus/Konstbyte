import { NextRequest, NextResponse } from 'next/server';
import prisma from '../../../../../lib/prisma';
import { getCurrentUser } from '../../../../../lib/auth';

// PATCH /api/orders/[id]/tracking
// Allows the seller to update tracking info after marking an order as shipped.
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

  const order = await prisma.order.findUnique({ where: { id } });
  if (!order || order.sellerId !== user.id) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }
  if (order.shippingStatus === 'not_shipped') {
    return NextResponse.json({ error: 'Mark as shipped first' }, { status: 400 });
  }

  const { trackingNumber, trackingUrl } = await req.json();

  const updated = await prisma.order.update({
    where: { id },
    data: {
      trackingNumber: trackingNumber ?? null,
      trackingUrl: trackingUrl ?? null,
    },
  });

  // Notify buyer that tracking info was updated
  await prisma.notification.create({
    data: {
      userId: order.buyerId,
      type: 'tracking_updated',
      message: 'Din beställning har fått uppdaterad spårningsinformation.',
      link: `/orders/${id}`,
    },
  });

  return NextResponse.json({ ok: true, order: updated });
}
