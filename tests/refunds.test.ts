import { beforeEach, describe, expect, it, vi } from 'vitest';

const { prisma, sendEmail, stripe } = vi.hoisted(() => ({
  prisma: {
    payment: { findUnique: vi.fn() },
    order: { findUnique: vi.fn(), update: vi.fn() },
    payout: { updateMany: vi.fn() },
    orderEvent: { create: vi.fn() },
    notification: { create: vi.fn() },
    $transaction: vi.fn((ops: unknown[]) => Promise.all(ops)),
  },
  sendEmail: vi.fn(() => Promise.resolve()),
  stripe: { transfers: { list: vi.fn(), createReversal: vi.fn(), create: vi.fn() } },
}));
vi.mock('@/lib/prisma', () => ({ default: prisma }));
vi.mock('@/lib/email', () => ({ sendEmail }));
vi.mock('@/lib/stripe', () => ({ default: stripe }));

import { handleChargeRefunded, handleDisputeCreated, handleDisputeClosed } from '@/lib/refunds';
import type Stripe from 'stripe';

const order = {
  id: 'order_1',
  status: 'completed',
  amount: 1000,
  sellerId: 'seller_1',
  buyerId: 'buyer_1',
  sellerPayoutStatus: 'unpaid',
  artwork: { title: 'Sommarhav' },
  seller: { stripeAccountId: 'acct_1' },
  payout: null as null | { amount: number; sellerPayoutAmount: number },
};
// The artist was paid 953.20 kr for a 1 000 kr sale.
const paidOrder = { ...order, sellerPayoutStatus: 'paid', payout: { amount: 1000, sellerPayoutAmount: 953.2 } };
const transfer = (overrides: object = {}) => ({ id: 'tr_1', amount: 95_320, amount_reversed: 0, reversals: { data: [] }, ...overrides });

const charge = (overrides: Partial<Stripe.Charge> = {}) =>
  ({ payment_intent: 'pi_1', metadata: {}, refunded: true, amount_refunded: 100_000, ...overrides }) as Stripe.Charge;
const dispute = (overrides: Partial<Stripe.Dispute> = {}) =>
  ({ id: 'dp_1', payment_intent: 'pi_1', metadata: {}, status: 'needs_response', ...overrides }) as Stripe.Dispute;

beforeEach(() => {
  vi.clearAllMocks();
  process.env.ADMIN_EMAILS = 'Admin@Example.com';
  prisma.payment.findUnique.mockResolvedValue({ orderId: 'order_1' });
  prisma.order.findUnique.mockResolvedValue(order);
  stripe.transfers.list.mockResolvedValue({ data: [transfer()] });
  stripe.transfers.createReversal.mockResolvedValue({});
  stripe.transfers.create.mockResolvedValue({ id: 'tr_2' });
});

describe('refunds and disputes before the artist is paid', () => {
  it('cancels the payout when the buyer gets a full refund', async () => {
    await handleChargeRefunded(charge());

    expect(prisma.order.update).toHaveBeenCalledWith({
      where: { id: 'order_1' },
      data: { status: 'refunded', sellerPayoutStatus: 'cancelled', sellerPayoutNote: 'Köpet återbetalades.' },
    });
    expect(stripe.transfers.createReversal).not.toHaveBeenCalled();
    expect(sendEmail).not.toHaveBeenCalled();
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
    expect(stripe.transfers.createReversal).not.toHaveBeenCalled();
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

describe('refunds and disputes after the artist was paid', () => {
  beforeEach(() => {
    prisma.order.findUnique.mockResolvedValue(paidOrder);
  });

  it('takes the whole payout back from the artist on a full refund', async () => {
    await handleChargeRefunded(charge());

    expect(stripe.transfers.list).toHaveBeenCalledWith({ transfer_group: 'order_1', limit: 20 });
    expect(stripe.transfers.createReversal).toHaveBeenCalledWith(
      'tr_1',
      { amount: 95_320, metadata: { orderId: 'order_1', reason: 'refund' } },
      expect.objectContaining({ idempotencyKey: expect.any(String) }),
    );
    expect(prisma.order.update).toHaveBeenCalledWith({
      where: { id: 'order_1' },
      data: { status: 'refunded', sellerPayoutStatus: 'cancelled', sellerPayoutNote: 'Köpet återbetalades.' },
    });
    expect(prisma.notification.create).toHaveBeenCalledWith({
      data: expect.objectContaining({ userId: 'seller_1', message: expect.stringContaining('dragits tillbaka') }),
    });
    expect(sendEmail).not.toHaveBeenCalled();
  });

  it('does not reverse twice when Stripe sends the refund again', async () => {
    stripe.transfers.list.mockResolvedValue({ data: [transfer({ amount_reversed: 95_320 })] });

    await handleChargeRefunded(charge());

    expect(stripe.transfers.createReversal).not.toHaveBeenCalled();
  });

  it('emails the admins when the payout cannot be taken back', async () => {
    stripe.transfers.createReversal.mockRejectedValue(new Error('insufficient funds'));
    vi.spyOn(console, 'error').mockImplementation(() => {});

    await handleChargeRefunded(charge());

    expect(prisma.order.update).toHaveBeenCalledWith({ where: { id: 'order_1' }, data: { status: 'refunded' } });
    expect(sendEmail).toHaveBeenCalledWith(expect.objectContaining({ to: 'admin@example.com' }));
  });

  it('takes back only what the buyer got back on a partial refund', async () => {
    await handleChargeRefunded(charge({ refunded: false, amount_refunded: 20_000 }));

    expect(stripe.transfers.createReversal).toHaveBeenCalledWith(
      'tr_1',
      expect.objectContaining({ amount: 20_000 }),
      expect.anything(),
    );
    expect(prisma.order.update).not.toHaveBeenCalled();
    expect(sendEmail).not.toHaveBeenCalled();
  });

  it('does not charge the artist again for a refund that was taken into account in the payout', async () => {
    // 200 kr was refunded before the payout (payout based on 800 kr); now 300 kr more.
    prisma.order.findUnique.mockResolvedValue({ ...paidOrder, payout: { amount: 800, sellerPayoutAmount: 760 } });
    stripe.transfers.list.mockResolvedValue({ data: [transfer({ amount: 76_000 })] });

    await handleChargeRefunded(charge({ refunded: false, amount_refunded: 50_000 }));

    expect(stripe.transfers.createReversal).toHaveBeenCalledWith('tr_1', expect.objectContaining({ amount: 30_000 }), expect.anything());
  });

  it('takes the payout back while a dispute is open, and still asks the admins to answer it', async () => {
    await handleDisputeCreated(dispute());

    expect(stripe.transfers.createReversal).toHaveBeenCalledWith(
      'tr_1',
      { amount: 95_320, metadata: { orderId: 'order_1', reason: 'dispute', dispute: 'dp_1' } },
      expect.anything(),
    );
    expect(prisma.notification.create).toHaveBeenCalled();
    expect(sendEmail).toHaveBeenCalledWith(expect.objectContaining({ to: 'admin@example.com' }));
  });

  it('pays the artist back when Konstbyte wins the dispute', async () => {
    stripe.transfers.list.mockResolvedValue({
      data: [transfer({ amount_reversed: 95_320, reversals: { data: [{ amount: 95_320, metadata: { dispute: 'dp_1' } }] } })],
    });

    await handleDisputeClosed(dispute({ status: 'won' }));

    expect(stripe.transfers.create).toHaveBeenCalledWith(
      expect.objectContaining({ amount: 95_320, destination: 'acct_1', transfer_group: 'order_1' }),
      { idempotencyKey: 'konstbyte-dispute-return-dp_1' },
    );
    expect(prisma.notification.create).toHaveBeenCalled();
  });

  it('keeps what was taken back when the dispute is lost', async () => {
    stripe.transfers.list.mockResolvedValue({
      data: [transfer({ amount_reversed: 95_320, reversals: { data: [{ amount: 95_320, metadata: { dispute: 'dp_1' } }] } })],
    });

    await handleDisputeClosed(dispute({ status: 'lost' }));

    expect(stripe.transfers.create).not.toHaveBeenCalled();
    expect(prisma.orderEvent.create).toHaveBeenCalledWith({ data: expect.objectContaining({ type: 'dispute_lost' }) });
    expect(sendEmail).not.toHaveBeenCalled();
  });
});
