import { NextRequest, NextResponse } from 'next/server';
import prisma from '../../../../../lib/prisma';
import { getCurrentUser } from '../../../../../lib/auth';
import { sendEmail, shippedEmail } from '../../../../../lib/email';

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
  if (order.shippingStatus === 'shipped' || order.shippingStatus === 'delivered') {
    return NextResponse.json({ error: 'Already shipped' }, { status: 409 });
  }

  // Accept optional tracking info from JSON body
  let trackingNumber: string | null = null;
  let trackingUrl: string | null = null;
  try {
    const body = await req.json();
    trackingNumber = body.trackingNumber ?? null;
    trackingUrl = body.trackingUrl ?? null;
  } catch {
    // Body is optional
  }

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
  const appUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
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
