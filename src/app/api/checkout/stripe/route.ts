import { NextResponse } from 'next/server';
import stripe from '../../../../lib/stripe';
import prisma from '../../../../lib/prisma';
import { getCurrentUser } from '../../../../lib/auth';

// POST /api/checkout/stripe
// Creates a Stripe Checkout Session. Konstbyte receives the full payment.
// No Stripe Connect required — sellers do NOT need a Stripe account.
// Seller payout is handled manually by Konstbyte admins.
export async function POST(request: Request) {
  try {
    const { artworkId, shippingAddress } = await request.json();
    if (!artworkId) {
      return NextResponse.json({ error: 'artworkId saknas' }, { status: 400 });
    }

    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Inloggning krävs' }, { status: 401 });
    }

    const artwork = await prisma.artwork.findUnique({
      where: { id: artworkId },
      include: { owner: { select: { id: true, name: true } } },
    });

    if (!artwork) {
      return NextResponse.json({ error: 'Konstverket hittades inte' }, { status: 404 });
    }
    if (artwork.isSold) {
      return NextResponse.json({ error: 'Konstverket är redan sålt' }, { status: 409 });
    }
    if (artwork.ownerId === user.id) {
      return NextResponse.json({ error: 'Du kan inte köpa ditt eget konstverk' }, { status: 400 });
    }

    const feePercent = Number(process.env.PLATFORM_FEE_PERCENT ?? 3) / 100;
    const unitAmount = Math.round(artwork.price * 100); // SEK in öre

    // Determine shipping cost — only "fixed" type adds to total
    const shippingCost = artwork.shippingType === 'fixed' ? (artwork.shippingCost ?? 0) : 0;
    const totalAmount = artwork.price + shippingCost;

    // Create a pending order so we can track it through the checkout session
    const order = await prisma.order.create({
      data: {
        buyerId: user.id,
        sellerId: artwork.ownerId,
        artworkId: artwork.id,
        amount: totalAmount,
        feeAmount: Math.round(artwork.price * feePercent * 100) / 100,
        paymentMethod: 'stripe',
        status: 'pending',
        sellerPayoutStatus: 'unpaid',
        // Snapshot shipping info at time of purchase
        shippingMethod: artwork.shippingType,
        shippingCost,
        // Buyer delivery address
        shippingName:       shippingAddress?.fullName      ?? null,
        shippingStreet:     shippingAddress?.streetAddress ?? null,
        shippingPostalCode: shippingAddress?.postalCode    ?? null,
        shippingCity:       shippingAddress?.city          ?? null,
        shippingCountry:    shippingAddress?.country       ?? 'Sverige',
        shippingPhone:      shippingAddress?.phone         ?? null,
      },
    });

    const appUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';

    // Create Stripe Checkout Session (simple, no Connect)
    const lineItems: Parameters<typeof stripe.checkout.sessions.create>[0]['line_items'] = [
      {
        price_data: {
          currency: 'sek',
          product_data: {
            name: artwork.title,
            description: artwork.description?.trim() || `Konstverk av ${artwork.owner.name ?? 'Konstnären'}`,
            images: artwork.imageUrl ? [artwork.imageUrl] : [],
          },
          unit_amount: unitAmount,
        },
        quantity: 1,
      },
    ];

    // Add shipping as separate line item if seller has set a fixed price
    if (shippingCost > 0) {
      lineItems.push({
        price_data: {
          currency: 'sek',
          product_data: { name: 'Frakt' },
          unit_amount: Math.round(shippingCost * 100),
        },
        quantity: 1,
      });
    }

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: lineItems,
      mode: 'payment',
      customer_email: user.email ?? undefined,
      // Pass orderId in metadata so webhook can find the order
      metadata: { orderId: order.id, artworkId: artwork.id },
      // Pass orderId in success URL for the confirmation page
      success_url: `${appUrl}/success?orderId=${order.id}`,
      cancel_url: `${appUrl}/cancel?orderId=${order.id}`,
    });

    // Store Stripe session ID on the order
    await prisma.order.update({
      where: { id: order.id },
      data: { stripeSessionId: session.id },
    });

    return NextResponse.json({ url: session.url, orderId: order.id });
  } catch (err) {
    console.error('[checkout/stripe]', err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
