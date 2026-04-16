import { NextResponse } from 'next/server';
import type Stripe from 'stripe';
import stripe from '../../../../lib/stripe';
import prisma from '../../../../lib/prisma';
import { sendEmail, buyerConfirmationEmail, sellerNotificationEmail } from '../../../../lib/email';

// Use Node runtime so we can access the raw request body for signature verification
export async function POST(request: Request) {
  const signature = request.headers.get('stripe-signature') || '';
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!webhookSecret) {
    console.error('STRIPE_WEBHOOK_SECRET is not configured');
    return NextResponse.json({ error: 'Webhook secret not configured' }, { status: 500 });
  }

  try {
    const buf = Buffer.from(await request.arrayBuffer());
    let eventType = '';
    let session: Stripe.Checkout.Session | null = null;

    try {
      const event = stripe.webhooks.constructEvent(buf, signature, webhookSecret);
      eventType = event.type;
      if (event.type === 'checkout.session.completed') {
        session = event.data.object as Stripe.Checkout.Session;
      }
    } catch (err) {
      console.error('Webhook signature verification failed:', err);
      return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
    }

    if (eventType === 'checkout.session.completed' && session) {
      const orderId = session.metadata?.orderId;
      if (orderId) {
        const appUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
        const amountRaw = session.amount_total ?? session.amount_subtotal ?? 0;
        const amountSek = amountRaw / 100;
        const stripePaymentId = session.payment_intent || session.id;

        // Fetch order with relations
        const order = await prisma.order.findUnique({
          where: { id: orderId },
          include: {
            artwork: true,
            buyer: { select: { name: true, email: true } },
            seller: { select: { name: true, email: true } },
          },
        });

        if (!order) {
          console.error(`Webhook: Order ${orderId} not found`);
          return NextResponse.json({ error: 'Order not found' }, { status: 500 });
        }

        // Update order, mark artwork as sold, create item + events + payment atomically
        await prisma.$transaction([
          prisma.order.update({ where: { id: orderId }, data: { status: 'completed' } }),
          prisma.artwork.update({
            where: { id: order.artworkId },
            data: { isSold: true, soldAt: new Date() },
          }),
          prisma.orderItem.create({
            data: {
              orderId,
              title: order.artwork.title,
              price: order.artwork.price,
              imageUrl: order.artwork.imageUrl,
            },
          }),
          prisma.orderEvent.create({
            data: { orderId, type: 'payment_completed', message: 'Betalning mottagen via Stripe.' },
          }),
          prisma.orderEvent.create({
            data: { orderId, type: 'processing', message: 'Konstnären packar och förbereder försändelsen.' },
          }),
          ...(stripePaymentId
            ? [prisma.payment.create({
                data: { orderId, stripeId: String(stripePaymentId), amount: amountRaw },
              })]
            : []),
        ]);

        // Send confirmation emails (fire-and-forget, don't block webhook response)
        const buyerEmail = order.buyer.email;
        const sellerEmail = order.seller?.email;

        if (buyerEmail) {
          const mail = buyerConfirmationEmail({
            orderId,
            artworkTitle: order.artwork.title,
            imageUrl: order.artwork.imageUrl,
            artistName: order.seller?.name || 'Konstnären',
            amountSek,
            shippingCost: order.shippingCost,
            appUrl,
          });
          sendEmail({ to: buyerEmail, ...mail }).catch(console.error);
        }

        if (sellerEmail) {
          const mail = sellerNotificationEmail({
            orderId,
            artworkTitle: order.artwork.title,
            buyerName: order.buyer.name || 'Köparen',
            amountSek,
            appUrl,
          });
          sendEmail({ to: sellerEmail, ...mail }).catch(console.error);
        }
      }
    }

    return NextResponse.json({ received: true });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 400 });
  }
}
