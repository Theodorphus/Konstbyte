import { APP_URL } from '@/lib/urls';
import { NextRequest, NextResponse } from 'next/server';
import prisma from '../../../../../lib/prisma';
import { getCurrentUser } from '../../../../../lib/auth';
import { sendEmail, shippedEmail } from '../../../../../lib/email';
import { sanitizeTracking } from '../../../../../lib/shipping';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

  const order = await prisma.order.findUnique({
    where: { id },
    include: {
      buyer: { select: { name: true, email: true } },
      artwork: { select: { title: true } },
    },
  });

  if (!order || order.sellerId !== user.id) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }
  // Only paid orders can be shipped.
  if (!['completed', 'paid'].includes(order.status)) {
    return NextResponse.json({ error: 'Order is not paid' }, { status: 409 });
  }
  if (order.shippingStatus === 'shipped' || order.shippingStatus === 'delivered') {
    return NextResponse.json({ error: 'Already shipped' }, { status: 409 });
  }

  // Accept optional tracking info from JSON body
  // Tracking info is optional
  const { trackingNumber, trackingUrl, error } = sanitizeTracking(await req.json().catch(() => ({})));
  if (error) return NextResponse.json({ error }, { status: 400 });

  await prisma.$transaction([
    prisma.order.update({
      where: { id },
      data: { shippingStatus: 'shipped', trackingNumber, trackingUrl },
    }),
    prisma.orderEvent.create({
      data: { orderId: id, type: 'shipped', message: 'Konstnären har skickat konstverket.' },
    }),
  ]);

  // Notify buyer via in-app notification
  await prisma.notification.create({
    data: {
      userId: order.buyerId,
      type: 'shipped',
      message: `Ditt konstverk "${order.artwork.title}" är på väg!`,
      link: `/orders/${id}`,
    },
  });

  // Send buyer email
  const appUrl = APP_URL;
  if (order.buyer.email) {
    const { subject, html } = shippedEmail({
      orderId: id,
      artworkTitle: order.artwork.title,
      sellerName: user.name ?? 'Konstnären',
      trackingNumber,
      trackingUrl,
      appUrl,
    });
    await sendEmail({ to: order.buyer.email, subject, html });
  }

  return NextResponse.json({ ok: true });
}
