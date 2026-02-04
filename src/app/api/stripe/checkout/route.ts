import { NextResponse } from 'next/server';
import stripe from '../../../../lib/stripe';
import prisma from '../../../../lib/prisma';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { artworkId, successUrl, cancelUrl } = body;
    if (!artworkId) return NextResponse.json({ error: 'artworkId required' }, { status: 400 });

    const artwork = await prisma.artwork.findUnique({ where: { id: artworkId } });
    if (!artwork) return NextResponse.json({ error: 'Artwork not found' }, { status: 404 });

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: { name: artwork.title, images: [artwork.imageUrl] },
            unit_amount: artwork.price
          },
          quantity: 1
        }
      ],
      mode: 'payment',
      success_url: successUrl || `${process.env.NEXTAUTH_URL}/success`,
      cancel_url: cancelUrl || `${process.env.NEXTAUTH_URL}/cancel`
    });

    return NextResponse.json({ sessionId: session.id, url: session.url });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
