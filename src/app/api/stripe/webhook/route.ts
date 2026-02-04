import { NextResponse } from 'next/server';

export const runtime = 'edge';

// Stripe webhooks should ideally run on a server runtime with raw body access.
// This implementation uses the edge runtime; adapt to Node runtime if you need raw body + signature verification.
export async function POST(request: Request) {
  const signature = request.headers.get('stripe-signature') || '';
  const body = await request.text();

  try {
    // If you want to verify signature, use stripe.webhooks.constructEvent with your webhook secret
    // const event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET);
    const json = JSON.parse(body);
    const type = json.type;
    if (type === 'checkout.session.completed') {
      // handle post-payment logic (e.g. mark order paid)
    }
    return NextResponse.json({ received: true, hasSignature: Boolean(signature) });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 400 });
  }
}
