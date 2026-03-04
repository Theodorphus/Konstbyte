import { NextResponse } from 'next/server';
import stripe from '../../../../lib/stripe';
import prisma from '../../../../lib/prisma';
import { getCurrentUser } from '../../../../lib/auth';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { artworkId, successUrl, cancelUrl } = body;
    if (!artworkId) return NextResponse.json({ error: 'artworkId required' }, { status: 400 });

    const artwork = await prisma.artwork.findUnique({ where: { id: artworkId } });
    if (!artwork) return NextResponse.json({ error: 'Artwork not found' }, { status: 404 });

    // Get current user from server session
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

    // Create a pending order in the database so we can reconcile after webhook
    if (artwork.isSold) {
      return NextResponse.json({ error: 'Artwork already sold' }, { status: 409 });
    }

    const feePercent = Number(process.env.PLATFORM_FEE_PERCENT ?? 5) / 100;
    const unitAmount = Math.round(artwork.price * 100);

    const order = await prisma.order.create({
      data: {
        buyerId: user.id,
        sellerId: artwork.ownerId,
        artworkId: artwork.id,
        amount: artwork.price,
        feeAmount: Math.round(artwork.price * feePercent * 100) / 100,
        status: 'pending'
      }
    });

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'sek',
            product_data: { name: artwork.title, images: [artwork.imageUrl] },
            unit_amount: unitAmount,
          },
          quantity: 1,
        }
      ],
      mode: 'payment',
      customer_email: user.email || undefined,
      metadata: { orderId: order.id, artworkId: artwork.id },
      success_url: successUrl || `${process.env.NEXTAUTH_URL}/success`,
      cancel_url: cancelUrl || `${process.env.NEXTAUTH_URL}/cancel`,
    });

    await prisma.order.update({
      where: { id: order.id },
      data: { stripeSessionId: session.id },
    });

    return NextResponse.json({ sessionId: session.id, url: session.url });
  } catch (err) {
    console.error('[checkout] error:', err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
