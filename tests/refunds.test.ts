import { beforeEach, describe, expect, it, vi } from 'vitest';

const { prisma, sendEmail } = vi.hoisted(() => ({
  prisma: {
    payment: { findUnique: vi.fn() },
    order: { findUnique: vi.fn(), update: vi.fn() },
    payout: { updateMany: vi.fn() },
    orderEvent: { create: vi.fn() },
    notification: { create: vi.fn() },
    $transaction: vi.fn((ops: unknown[]) => Promise.all(ops)),
  },
  sendEmail: vi.fn(() => Promise.resolve()),
}));
vi.mock('@/lib/prisma', () => ({ default: prisma }));
vi.mock('@/lib/email', () => ({ sendEmail }));

import { handleChargeRefunded, handleDisputeCreated, handleDisputeClosed } from '@/lib/refunds';
import type Stripe from 'stripe';

const order = {
  id: 'order_1',
  status: 'completed',
  sellerId: 'seller_1',
  buyerId: 'buyer_1',
  sellerPayoutStatus: 'unpaid',
  artwork: { title: 'Sommarhav' },
};

const charge = (overrides: Partial<Stripe.Charge> = {}) =>
  ({ payment_intent: 'pi_1', metadata: {}, refunded: true, amount_refunded: 100_000, ...overrides }) as Stripe.Charge;
const dispute = (overrides: Partial<Stripe.Dispute> = {}) =>
  ({ payment_intent: 'pi_1', metadata: {}, status: 'needs_response', ...overrides }) as Stripe.Dispute;

beforeEach(() => {
  vi.clearAllMocks();
  process.env.ADMIN_EMAILS = 'Admin@Example.com';
  prisma.payment.findUnique.mockResolvedValue({ orderId: 'order_1' });
  prisma.order.findUnique.mockResolvedValue(order);
});

describe('refunds and disputes', () => {
  it('cancels the payout when the buyer gets a full refund before the artist is paid', async () => {
    await handleChargeRefunded(charge());

    expect(prisma.order.update).toHaveBeenCalledWith({
      where: { id: 'order_1' },
      data: { status: 'refunded', sellerPayoutStatus: 'cancelled', sellerPayoutNote: 'Köpet återbetalades.' },
    });
    expect(sendEmail).not.toHaveBeenCalled();
  });

  it('flags a refund after the artist was paid and emails the admins', async () => {
    prisma.order.findUnique.mockResolvedValue({ ...order, sellerPayoutStatus: 'paid' });

    await handleChargeRefunded(charge());

    expect(prisma.order.update).toHaveBeenCalledWith({ where: { id: 'order_1' }, data: { status: 'refunded' } });
    expect(sendEmail).toHaveBeenCalledWith(expect.objectContaining({ to: 'admin@example.com' }));
  });

  it('pauses the payout on a partial refund', async () => {
    await handleChargeRefunded(charge({ refunded: false, amount_refunded: 20_000 }));

    expect(prisma.order.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ sellerPayoutStatus: 'on_hold' }) }),
    );
    expect(sendEmail).toHaveBeenCalled();
  });

  it('ignores refunds Konstbyte already handled (double sale)', async () => {
    prisma.order.findUnique.mockResolvedValue({ ...order, status: 'refunded' });

    await handleChargeRefunded(charge());

    expect(prisma.order.update).not.toHaveBeenCalled();
  });

  it('pauses the payout when the buyer disputes the payment', async () => {
    await handleDisputeCreated(dispute());

    expect(prisma.order.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ sellerPayoutStatus: 'on_hold' }) }),
    );
    expect(sendEmail).toHaveBeenCalled();
  });

  it('releases the payout again when the dispute is won or the bank inquiry closes, cancels it when lost', async () => {
    prisma.order.findUnique.mockResolvedValue({ ...order, sellerPayoutStatus: 'on_hold' });

    await handleDisputeClosed(dispute({ status: 'won' }));
    expect(prisma.order.update).toHaveBeenLastCalledWith({
      where: { id: 'order_1' },
      data: { sellerPayoutStatus: 'unpaid', sellerPayoutNote: null },
    });

    await handleDisputeClosed(dispute({ status: 'warning_closed' }));
    expect(prisma.order.update).toHaveBeenLastCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ sellerPayoutStatus: 'unpaid' }) }),
    );

    await handleDisputeClosed(dispute({ status: 'lost' }));
    expect(prisma.order.update).toHaveBeenLastCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ sellerPayoutStatus: 'cancelled' }) }),
    );
  });
});
