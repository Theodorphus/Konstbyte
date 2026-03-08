import { NextRequest, NextResponse } from 'next/server';
import prisma from '../../../../../lib/prisma';
import { getCurrentUser } from '../../../../../lib/auth';
import { calculatePayout, defaultCommissionRate } from '../../../../../lib/payout';

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

  const alreadyDelivered = await prisma.orderEvent.findFirst({
    where: { orderId: id, type: 'delivered' },
  });
  if (alreadyDelivered) return NextResponse.json({ error: 'Already delivered' }, { status: 409 });

  const commissionRate = defaultCommissionRate();
  const { commissionAmount, commissionVat, sellerPayoutAmount } = calculatePayout(order.amount, commissionRate);

  await prisma.$transaction(async (tx) => {
    await tx.orderEvent.create({
      data: { orderId: id, type: 'delivered', message: 'Köparen har bekräftat mottagandet.' },
    });
    await tx.order.update({
      where: { id },
      data: { status: 'delivered', shippingStatus: 'delivered' },
    });
    if (order.sellerId) {
      await tx.payout.create({
        data: {
          sellerId: order.sellerId,
          orderId: id,
          amount: order.amount,
          commissionRate,
          commissionAmount,
          commissionVat,
          sellerPayoutAmount,
        },
      });
    }
  });

  // Notify seller that buyer confirmed receipt
  if (order.sellerId) {
    await prisma.notification.create({
      data: {
        userId: order.sellerId,
        type: 'order_delivered',
        message: `Köparen har bekräftat mottagandet av "${order.artwork.title}". En utbetalning på ${Math.round(sellerPayoutAmount).toLocaleString('sv-SE')} kr har skapats och behandlas av Konstbyte.`,
        link: `/orders/${id}`,
      },
    });
  }

  return NextResponse.json({ ok: true });
}
