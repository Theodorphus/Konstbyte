import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import prisma from '../../../../lib/prisma';
import { sendEmail, buyerConfirmationEmail, sellerNotificationEmail } from '../../../../lib/email';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2022-11-15' as any });
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

export async function POST(req: NextRequest) {
  const body = await req.text();
  const sig = req.headers.get('stripe-signature');

  if (!sig) {
    return NextResponse.json({ error: 'Missing stripe-signature header' }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, webhookSecret);
  } catch (err) {
    console.error('[webhook/stripe] Signature verification failed:', err);
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session;
    const orderId = session.metadata?.orderId;
    const artworkId = session.metadata?.artworkId;

    if (!orderId) {
      console.error('[webhook/stripe] No orderId in metadata');
      return NextResponse.json({ error: 'No orderId' }, { status: 400 });
    }

    try {
      // Atomically mark order as paid + artwork as sold, then fetch order for emails
      const order = await prisma.$transaction(async (tx) => {
        const updated = await tx.order.update({
          where: { id: orderId },
          data: { status: 'paid' },
          include: {
            buyer: { select: { name: true, email: true } },
            seller: { select: { name: true, email: true } },
            artwork: { select: { title: true, imageUrl: true } },
          },
        });
        if (artworkId) {
          await tx.artwork.update({
            where: { id: artworkId },
            data: { isSold: true, soldAt: new Date() },
          });
        }
        return updated;
      });

      // Create Payment record for audit trail
      await prisma.payment.create({
        data: {
          orderId,
          stripeId: session.id,
          amount: session.amount_total ? session.amount_total / 100 : order.amount,
        },
      });

      const appUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
      const amountSek = Math.round(order.amount);

      // Send buyer confirmation
      if (order.buyer.email) {
        const { subject, html } = buyerConfirmationEmail({
          orderId,
          artworkTitle: order.artwork.title,
          imageUrl: order.artwork.imageUrl ?? '',
          artistName: order.seller?.name ?? 'Konstnären',
          amountSek,
          shippingCost: order.shippingCost,
          appUrl,
        });
        await sendEmail({ to: order.buyer.email, subject, html });
      }

      // Send seller notification
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

      // Notify seller about new purchase
      if (order.seller) {
        await prisma.notification.create({
          data: {
            userId: order.sellerId,
            type: 'new_order',
            message: `Ditt konstverk "${order.artwork.title}" har sålts! Förbered för frakt.`,
            link: `/orders/${orderId}`,
          },
        });
      }

      console.log(`[webhook/stripe] Order ${orderId} paid — emails sent`);
    } catch (err) {
      console.error('[webhook/stripe] DB update or email failed:', err);
      return NextResponse.json({ error: 'Processing failed' }, { status: 500 });
    }
  }

  return NextResponse.json({ received: true });
}
