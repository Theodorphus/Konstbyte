import { APP_URL } from '@/lib/urls';
import { NextResponse } from 'next/server';
import type Stripe from 'stripe';
import stripe from '../../../../lib/stripe';
import prisma from '../../../../lib/prisma';
import { sendEmail, buyerConfirmationEmail, sellerNotificationEmail } from '../../../../lib/email';

// Order statuses from which a payment may still be fulfilled.
const OPEN_STATUSES = ['pending', 'payment_processing'];

// Required events for this endpoint (Stripe Dashboard → Developers → Webhooks):
//   checkout.session.completed
//   checkout.session.async_payment_succeeded   (Swish, Klarna and other delayed methods)
//   checkout.session.async_payment_failed
//   checkout.session.expired
export async function POST(request: Request) {
  const signature = request.headers.get('stripe-signature') || '';
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!webhookSecret) {
    console.error('STRIPE_WEBHOOK_SECRET is not configured');
    return NextResponse.json({ error: 'Webhook secret not configured' }, { status: 500 });
  }

  let event: Stripe.Event;
  try {
    const buf = Buffer.from(await request.arrayBuffer());
    event = stripe.webhooks.constructEvent(buf, signature, webhookSecret);
  } catch (err) {
    console.error('Webhook signature verification failed:', err);
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        // Card payments are 'paid' here. Delayed methods are 'unpaid' until
        // checkout.session.async_payment_succeeded arrives.
        if (session.payment_status === 'paid' || session.payment_status === 'no_payment_required') {
          await fulfillOrder(session);
        } else {
          await markProcessing(session);
        }
        break;
      }
      case 'checkout.session.async_payment_succeeded':
        await fulfillOrder(event.data.object as Stripe.Checkout.Session);
        break;
      case 'checkout.session.async_payment_failed':
        await closeOrder(event.data.object as Stripe.Checkout.Session, 'payment_failed', 'Betalningen misslyckades.');
        break;
      case 'checkout.session.expired':
        await closeOrder(event.data.object as Stripe.Checkout.Session, 'expired', 'Betalningen avbröts eller gick ut.');
        break;
    }
    return NextResponse.json({ received: true });
  } catch (err) {
    // Non-2xx makes Stripe retry the event later.
    console.error(`[stripe/webhook] ${event.type} failed:`, err);
    return NextResponse.json({ error: 'Webhook handler failed' }, { status: 500 });
  }
}

function paymentIntentId(session: Stripe.Checkout.Session): string | null {
  const pi = session.payment_intent;
  return typeof pi === 'string' ? pi : pi?.id ?? null;
}

async function markProcessing(session: Stripe.Checkout.Session) {
  const orderId = session.metadata?.orderId;
  if (!orderId) return;
  const { count } = await prisma.order.updateMany({
    where: { id: orderId, status: 'pending' },
    data: { status: 'payment_processing' },
  });
  if (count > 0) {
    await prisma.orderEvent.create({
      data: { orderId, type: 'payment_processing', message: 'Betalningen behandlas.' },
    });
  }
}

async function closeOrder(session: Stripe.Checkout.Session, status: string, message: string) {
  const orderId = session.metadata?.orderId;
  if (!orderId) return;
  const { count } = await prisma.order.updateMany({
    where: { id: orderId, status: { in: OPEN_STATUSES } },
    data: { status },
  });
  if (count > 0) {
    await prisma.orderEvent.create({ data: { orderId, type: status, message } });
  }
}

async function fulfillOrder(session: Stripe.Checkout.Session) {
  const orderId = session.metadata?.orderId;
  if (!orderId) return;

  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: {
      artwork: true,
      buyer: { select: { name: true, email: true } },
      seller: { select: { name: true, email: true } },
    },
  });
  if (!order) throw new Error(`Order ${orderId} not found`);

  const amountRaw = session.amount_total ?? session.amount_subtotal ?? 0;
  const piId = paymentIntentId(session);

  // A previous delivery of this event decided to refund but the refund call
  // failed — retry it (the idempotency key prevents a double refund).
  if (order.status === 'refunded') {
    if (piId) {
      await stripe.refunds.create({ payment_intent: piId }, { idempotencyKey: `konstbyte-dupe-refund-${orderId}` });
    }
    return;
  }

  // Atomically claim the order (so retried/duplicate events are no-ops) and the
  // artwork (so two buyers paying at the same moment can't both get it).
  const outcome = await prisma.$transaction(async (tx) => {
    const { count } = await tx.order.updateMany({
      where: { id: orderId, status: { in: OPEN_STATUSES } },
      data: { status: 'completed' },
    });
    if (count === 0) return 'already_handled' as const;

    const claimed = await tx.artwork.updateMany({
      where: { id: order.artworkId, isSold: false },
      data: { isSold: true, soldAt: new Date() },
    });
    if (claimed.count === 0) {
      await tx.order.update({ where: { id: orderId }, data: { status: 'refunded' } });
      await tx.orderEvent.create({
        data: {
          orderId,
          type: 'refunded',
          message: 'Konstverket hann säljas till någon annan. Hela beloppet återbetalas.',
        },
      });
      return 'artwork_taken' as const;
    }

    await tx.orderItem.create({
      data: {
        orderId,
        title: order.artwork.title,
        // What the buyer actually paid for the artwork (excl. shipping), not today's price
        price: order.amount - order.shippingCost,
        imageUrl: order.artwork.imageUrl,
      },
    });
    await tx.orderEvent.createMany({
      data: [
        { orderId, type: 'payment_completed', message: 'Betalning mottagen via Stripe.' },
        { orderId, type: 'processing', message: 'Konstnären packar och förbereder försändelsen.' },
      ],
    });
    await tx.payment.upsert({
      where: { stripeId: piId ?? session.id },
      create: { orderId, stripeId: piId ?? session.id, amount: amountRaw },
      update: {},
    });
    return 'fulfilled' as const;
  });

  if (outcome === 'artwork_taken') {
    if (piId) {
      await stripe.refunds.create({ payment_intent: piId }, { idempotencyKey: `konstbyte-dupe-refund-${orderId}` });
    }
    await prisma.notification.create({
      data: {
        userId: order.buyerId,
        type: 'order_refunded',
        message: `"${order.artwork.title}" hann tyvärr säljas till någon annan. Hela beloppet återbetalas till dig.`,
        link: `/orders/${orderId}`,
      },
    });
    return;
  }
  if (outcome !== 'fulfilled') return;

  // Confirmation emails (fire-and-forget, don't block the webhook response)
  const amountSek = amountRaw / 100;
  if (order.buyer.email) {
    const mail = buyerConfirmationEmail({
      orderId,
      artworkTitle: order.artwork.title,
      imageUrl: order.artwork.imageUrl,
      artistName: order.seller?.name || 'Konstnären',
      amountSek,
      shippingCost: order.shippingCost,
      appUrl: APP_URL,
    });
    sendEmail({ to: order.buyer.email, ...mail }).catch(console.error);
  }
  if (order.seller?.email) {
    const mail = sellerNotificationEmail({
      orderId,
      artworkTitle: order.artwork.title,
      buyerName: order.buyer.name || 'Köparen',
      amountSek,
      appUrl: APP_URL,
    });
    sendEmail({ to: order.seller.email, ...mail }).catch(console.error);
  }
}
