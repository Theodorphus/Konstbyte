import prisma from './prisma';
import stripe from './stripe';

/**
 * Called when the buyer comes back from Stripe via "cancel". Closes their
 * checkout straight away, so the artwork is free for other buyers at once
 * instead of being held until the 30-minute Stripe session runs out.
 *
 * Returns the artwork id (for a "back to the artwork" link) when the order
 * belongs to this buyer, otherwise null.
 */
export async function cancelCheckout(orderId: string, buyerId: string): Promise<string | null> {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    select: { buyerId: true, status: true, stripeSessionId: true, artworkId: true },
  });
  if (!order || order.buyerId !== buyerId) return null;
  if (order.status !== 'pending') return order.artworkId;

  if (order.stripeSessionId) {
    try {
      await stripe.checkout.sessions.expire(order.stripeSessionId);
    } catch (err) {
      // Only close the order if Stripe confirms the session is expired. If it
      // was paid a moment ago, the webhook will complete the order instead.
      const session = await stripe.checkout.sessions.retrieve(order.stripeSessionId).catch(() => null);
      if (session?.status !== 'expired') {
        console.error('[cancel-checkout] could not expire session', orderId, err);
        return order.artworkId;
      }
    }
  }

  const { count } = await prisma.order.updateMany({
    where: { id: orderId, status: 'pending' },
    data: { status: 'expired' },
  });
  if (count > 0) {
    await prisma.orderEvent.create({
      data: { orderId, type: 'expired', message: 'Köparen avbröt betalningen.' },
    });
  }
  return order.artworkId;
}
