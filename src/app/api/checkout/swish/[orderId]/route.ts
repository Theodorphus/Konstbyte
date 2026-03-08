import { NextRequest, NextResponse } from 'next/server';
import prisma from '../../../../../lib/prisma';
import { getCurrentUser } from '../../../../../lib/auth';

// GET /api/checkout/swish/[orderId]
// Polling endpoint — frontend calls this every 3s to check if Swish payment is complete.
//
// PRODUCTION TODO:
// Instead of (or in addition to) polling, implement a Swish callback route:
// POST /api/checkout/swish/callback  — Swish calls this when the user pays.
// The callback updates the order status and the polling endpoint reflects it.
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ orderId: string }> }
) {
  try {
    const { orderId } = await params;
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      select: { id: true, buyerId: true, status: true },
    });

    if (!order || order.buyerId !== user.id) {
      return NextResponse.json({ error: 'Order hittades inte' }, { status: 404 });
    }

    // Map DB status to frontend-friendly status
    let paymentStatus: 'pending' | 'paid' | 'failed' | 'cancelled';
    switch (order.status) {
      case 'awaiting_swish':
        paymentStatus = 'pending';
        break;
      case 'paid':
      case 'completed':
        paymentStatus = 'paid';
        break;
      case 'cancelled':
        paymentStatus = 'cancelled';
        break;
      default:
        paymentStatus = 'failed';
    }

    return NextResponse.json({ orderId, paymentStatus });
  } catch (err) {
    console.error('[swish/status]', err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
