import { NextResponse } from 'next/server';
import prisma from '../../../../lib/prisma';
import { getCurrentUser } from '../../../../lib/auth';

// ─── Swish Handel Integration ─────────────────────────────────────────────────
//
// PRODUCTION TODO:
// 1. Obtain a Swish Handel merchant number from your bank
// 2. Get an SSL certificate (p12/pfx) from your bank for mTLS
// 3. Install the `node-swish` package or implement mTLS requests manually
// 4. Replace the mock below with real Swish API calls:
//
//    POST https://mss.cpc.getswish.net/swish-cpcapi/api/v2/paymentrequests
//    (with mTLS client certificate)
//    Body: { payeePaymentReference, callbackUrl, payeeAlias, amount, currency, message }
//    Response: token in Location header → use to build QR code
//
// 5. Set up SWISH_MERCHANT_NUMBER, SWISH_CERT_PATH, SWISH_CERT_PASSPHRASE env vars
// 6. Implement the POST /api/checkout/swish/callback route for Swish server callbacks
//
// CURRENT STATE: Mock implementation for UI/flow development.
// Orders are created in DB and can be manually paid via /admin/payouts.
// ─────────────────────────────────────────────────────────────────────────────

const SWISH_MERCHANT = process.env.SWISH_MERCHANT_NUMBER ?? '1231181189'; // Test merchant

// POST /api/checkout/swish
// Creates a Swish payment request and returns QR code data.
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

    const feePercent = Number(process.env.PLATFORM_FEE_PERCENT ?? 5) / 100;

    // Determine shipping cost — only "fixed" type adds to total
    const shippingCost = artwork.shippingType === 'fixed' ? (artwork.shippingCost ?? 0) : 0;
    const totalAmount = artwork.price + shippingCost;

    // Create order with awaiting_swish status
    const order = await prisma.order.create({
      data: {
        buyerId: user.id,
        sellerId: artwork.ownerId,
        artworkId: artwork.id,
        amount: totalAmount,
        feeAmount: Math.round(artwork.price * feePercent * 100) / 100,
        paymentMethod: 'swish',
        status: 'awaiting_swish',
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

    const amountSek = Math.round(totalAmount); // Swish uses whole kronor
    const message = `Konstbyte ${order.id.slice(0, 8)}`;

    // ── PRODUCTION: replace this block with real Swish API call ──────────────
    // const swishToken = await createSwishPaymentRequest({
    //   payeeAlias: SWISH_MERCHANT,
    //   amount: amountSek,
    //   currency: 'SEK',
    //   message,
    //   payeePaymentReference: order.id,
    //   callbackUrl: `${process.env.NEXTAUTH_URL}/api/checkout/swish/callback`,
    // });
    // const qrData = `D${swishToken}`;  // Swish QR format
    // ─────────────────────────────────────────────────────────────────────────

    // Mock: build a realistic Swish deep link for QR
    const swishPayload = JSON.stringify({
      version: 1,
      payee: { value: SWISH_MERCHANT, editable: false },
      amount: { value: amountSek, editable: false },
      message: { value: message, editable: false },
    });

    const swishDeepLink = `swish://payment?data=${encodeURIComponent(swishPayload)}`;
    const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=220x220&margin=10&data=${encodeURIComponent(swishDeepLink)}`;

    // Notify seller about the new order (Swish — pending payment)
    await prisma.notification.create({
      data: {
        userId: artwork.ownerId,
        type: 'new_order',
        message: `En köpare har initierat köp av "${artwork.title}" via Swish. Inväntar betalning.`,
        link: `/orders/${order.id}`,
      },
    });

    // Store a mock payment ID for tracking
    const mockPaymentId = `swish_mock_${order.id}`;
    await prisma.order.update({
      where: { id: order.id },
      data: { swishPaymentId: mockPaymentId },
    });

    return NextResponse.json({
      orderId: order.id,
      swishDeepLink,
      qrCodeUrl,
      amount: amountSek,
      // In production: swishToken would also be returned for polling
      isMock: !process.env.SWISH_MERCHANT_NUMBER,
    });
  } catch (err) {
    console.error('[checkout/swish]', err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
