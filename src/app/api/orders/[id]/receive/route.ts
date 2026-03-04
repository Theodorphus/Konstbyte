import { NextRequest, NextResponse } from 'next/server';
import prisma from '../../../../../lib/prisma';
import { getCurrentUser } from '../../../../../lib/auth';

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

  const order = await prisma.order.findUnique({ where: { id } });
  if (!order || order.buyerId !== user.id) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  const alreadyDelivered = await prisma.orderEvent.findFirst({
    where: { orderId: id, type: 'delivered' },
  });
  if (alreadyDelivered) return NextResponse.json({ error: 'Already delivered' }, { status: 409 });

  await prisma.$transaction([
    prisma.orderEvent.create({
      data: { orderId: id, type: 'delivered', message: 'Köparen har bekräftat mottagandet.' },
    }),
    prisma.order.update({ where: { id }, data: { status: 'delivered' } }),
  ]);

  return NextResponse.json({ ok: true });
}
