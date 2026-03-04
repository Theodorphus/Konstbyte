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
  if (!order || order.sellerId !== user.id) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  const alreadyShipped = await prisma.orderEvent.findFirst({
    where: { orderId: id, type: 'shipped' },
  });
  if (alreadyShipped) return NextResponse.json({ error: 'Already shipped' }, { status: 409 });

  await prisma.orderEvent.create({
    data: { orderId: id, type: 'shipped', message: 'Konstnären har skickat konstverket.' },
  });

  return NextResponse.json({ ok: true });
}
