import { NextResponse } from 'next/server';
import stripe from '../../../../lib/stripe';
import prisma from '../../../../lib/prisma';

// Use Node runtime so we can access the raw request body for signature verification
export async function POST(request: Request) {
  const signature = request.headers.get('stripe-signature') || '';
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  try {
    const buf = Buffer.from(await request.arrayBuffer());
    let event: any;

    if (webhookSecret) {
      try {
        event = stripe.webhooks.constructEvent(buf, signature, webhookSecret);
      } catch (err) {
        console.error('Webhook signature verification failed:', err);
        return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
      }
    } else {
      // No webhook secret configured — accept JSON body (not recommended for production)
      event = JSON.parse(buf.toString());
    }

    const type = event.type;
    if (type === 'checkout.session.completed') {
      const session = event.data.object;
      const orderId = session.metadata?.orderId;
      try {
        if (orderId) {
          // Update order status and create payment record
          await prisma.order.update({ where: { id: orderId }, data: { status: 'paid' } });
          const amount = session.amount_total ?? session.amount_subtotal ?? undefined;
          const stripePaymentId = session.payment_intent || session.id;
          if (amount && stripePaymentId) {
            await prisma.payment.create({
              data: {
                orderId,
                stripeId: String(stripePaymentId),
                amount: Number(amount)
              }
            });
          }
        }
      } catch (e) {
        console.error('Failed to update order/payment after webhook:', e);
      }
    }

    return NextResponse.json({ received: true });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 400 });
  }
}
