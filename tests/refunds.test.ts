import { beforeEach, describe, expect, it, vi } from 'vitest';

const { prisma, sendEmail, stripe } = vi.hoisted(() => ({
  prisma: {
    payment: { findUnique: vi.fn() },
    order: { findUnique: vi.fn(), update: vi.fn() },
    payout: { updateMany: vi.fn() },
    orderEvent: { create: vi.fn(), findFirst: vi.fn() },
    notification: { create: vi.fn() },
    $transaction: vi.fn((ops: unknown[]) => Promise.all(ops)),
  },
  sendEmail: vi.fn(() => Promise.resolve()),
  stripe: { transfers: { list: vi.fn(), createReversal: vi.fn(), create: vi.fn() } },
}));
vi.mock('@/lib/prisma', () => ({ default: prisma }));
vi.mock('@/lib/email', () => ({ sendEmail }));
vi.mock('@/lib/stripe', () => ({ default: stripe }));

import { handleChargeRefunded, handleDisputeCreated, handleDisputeClosed, handleDisputeFundsWithdrawn } from '@/lib/refunds';
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
  payout: null as null | { amount: number; sellerPayoutAmount: number; method: string },
};
// The artist was paid 953.20 kr for a 1 000 kr sale, through Stripe.
const paidOrder = { ...order, sellerPayoutStatus: 'paid', payout: { amount: 1000, sellerPayoutAmount: 953.2, method: 'stripe' } };
const transfer = (overrides: object = {}) => ({
  id: 'tr_1', amount: 95_320, amount_reversed: 0, metadata: {}, reversals: { data: [] }, ...overrides,
});
// The payout transfer after the 'dp_1' chargeback took it all back.
const reversedForDispute = transfer({
  amount_reversed: 95_320,
  reversals: { data: [{ amount: 95_320, metadata: { dispute: 'dp_1' } }] },
});
// The 95 320 öre sent back to the artist after winning 'dp_1'.
const returnedAfterDispute = { id: 'tr_2', amount: 95_320, amount_reversed: 0, metadata: { dispute: 'dp_1' }, reversals: { data: [] } };

const charge = (overrides: Partial<Stripe.Charge> = {}) =>
  ({ payment_intent: 'pi_1', metadata: {}, refunded: true, amount_refunded: 100_000, ...overrides }) as Stripe.Charge;
const dispute = (overrides: Partial<Stripe.Dispute> = {}) =>
  ({ id: 'dp_1', payment_intent: 'pi_1', metadata: {}, status: 'needs_response', amount: 100_000, ...overrides }) as Stripe.Dispute;

const adminMail = () => expect(sendEmail).toHaveBeenCalledWith(expect.objectContaining({ to: 'admin@example.com' }));
const sellerNotified = (text: string) =>
  expect(prisma.notification.create).toHaveBeenCalledWith({
    data: expect.objectContaining({ userId: 'seller_1', message: expect.stringContaining(text) }),
  });

beforeEach(() => {
  vi.clearAllMocks();
  process.env.ADMIN_EMAILS = 'Admin@Example.com';
  prisma.payment.findUnique.mockResolvedValue({ orderId: 'order_1' });
  prisma.order.findUnique.mockResolvedValue(order);
  prisma.orderEvent.findFirst.mockResolvedValue(null);
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

  it('pauses the payout on a partial refund, once', async () => {
    await handleChargeRefunded(charge({ refunded: false, amount_refunded: 20_000 }));
    expect(prisma.order.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ sellerPayoutStatus: 'on_hold' }) }),
    );
    expect(sendEmail).toHaveBeenCalled();

    vi.clearAllMocks();
    prisma.orderEvent.findFirst.mockResolvedValue({ id: 'e1' });
    await handleChargeRefunded(charge({ refunded: false, amount_refunded: 20_000 }));
    expect(prisma.order.update).not.toHaveBeenCalled();
    expect(sendEmail).not.toHaveBeenCalled();
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

describe('refunds after the artist was paid', () => {
  beforeEach(() => {
    prisma.order.findUnique.mockResolvedValue(paidOrder);
  });

  it('takes the whole payout back on a full refund', async () => {
    await handleChargeRefunded(charge());

    expect(stripe.transfers.list).toHaveBeenCalledWith({ transfer_group: 'order_1', limit: 20 });
    expect(stripe.transfers.createReversal).toHaveBeenCalledWith(
      'tr_1',
      { amount: 95_320, metadata: { orderId: 'order_1', reason: 'refund', refunded: '100000' } },
      expect.objectContaining({ idempotencyKey: expect.any(String) }),
    );
    expect(prisma.order.update).toHaveBeenCalledWith({
      where: { id: 'order_1' },
      data: { status: 'refunded', sellerPayoutStatus: 'cancelled', sellerPayoutNote: 'Köpet återbetalades.' },
    });
    sellerNotified('953,2 kr');
    // The payout no longer counts as paid out.
    expect(prisma.payout.updateMany).toHaveBeenCalledWith({
      where: { orderId: 'order_1', status: 'completed' },
      data: expect.objectContaining({ status: 'reversed' }),
    });
    expect(sendEmail).not.toHaveBeenCalled();
  });

  it('reports what was taken back when a retry comes after the money already moved', async () => {
    stripe.transfers.list.mockResolvedValue({
      data: [transfer({ amount_reversed: 95_320, reversals: { data: [{ amount: 95_320, metadata: { reason: 'refund', refunded: '100000' } }] } })],
    });

    await handleChargeRefunded(charge());

    expect(stripe.transfers.createReversal).not.toHaveBeenCalled();
    sellerNotified('953,2 kr');
    expect(sendEmail).not.toHaveBeenCalled();
  });

  it('counts a full refund as done when earlier partial refunds already took everything', async () => {
    stripe.transfers.list.mockResolvedValue({
      data: [transfer({ amount_reversed: 95_320, reversals: { data: [{ amount: 95_320, metadata: { reason: 'refund', refunded: '90000' } }] } })],
    });

    await handleChargeRefunded(charge());

    expect(stripe.transfers.createReversal).not.toHaveBeenCalled();
    sellerNotified('953,2 kr');
    expect(prisma.payout.updateMany).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ status: 'reversed' }) }));
    expect(sendEmail).not.toHaveBeenCalled();
  });

  it('does not count money that was taken back for a won dispute and already returned', async () => {
    stripe.transfers.list.mockResolvedValue({ data: [returnedAfterDispute, reversedForDispute] });

    await handleChargeRefunded(charge());

    expect(stripe.transfers.createReversal).toHaveBeenCalledWith('tr_2', expect.objectContaining({ amount: 95_320 }), expect.anything());
    sellerNotified('(953,2 kr)');
    expect(prisma.notification.create).not.toHaveBeenCalledWith({
      data: expect.objectContaining({ message: expect.stringContaining('1 906') }),
    });
  });

  it('asks the admins to step in when the payout cannot be taken back', async () => {
    stripe.transfers.createReversal.mockRejectedValue(new Error('insufficient funds'));
    vi.spyOn(console, 'error').mockImplementation(() => {});

    await handleChargeRefunded(charge());

    expect(prisma.order.update).toHaveBeenCalledWith({ where: { id: 'order_1' }, data: { status: 'refunded' } });
    adminMail();
  });

  it('asks the admins to step in when the artist was paid outside Stripe', async () => {
    prisma.order.findUnique.mockResolvedValue({ ...paidOrder, payout: { ...paidOrder.payout, method: 'swish' } });

    await handleChargeRefunded(charge());

    expect(stripe.transfers.createReversal).not.toHaveBeenCalled();
    expect(prisma.order.update).toHaveBeenCalledWith({ where: { id: 'order_1' }, data: { status: 'refunded' } });
    adminMail();
    sellerNotified('Konstbyte kontaktar dig');
  });

  it('takes back only what the buyer got back on a partial refund', async () => {
    await handleChargeRefunded(charge({ refunded: false, amount_refunded: 20_000 }));

    expect(stripe.transfers.createReversal).toHaveBeenCalledWith(
      'tr_1',
      expect.objectContaining({ amount: 20_000, metadata: expect.objectContaining({ refunded: '20000' }) }),
      expect.anything(),
    );
    expect(prisma.order.update).not.toHaveBeenCalled();
    expect(sendEmail).not.toHaveBeenCalled();
  });

  it('does not charge the artist again for a refund that was taken into account in the payout', async () => {
    // 200 kr was refunded before the payout (payout based on 800 kr); now 300 kr more.
    prisma.order.findUnique.mockResolvedValue({ ...paidOrder, payout: { amount: 800, sellerPayoutAmount: 760, method: 'stripe' } });
    stripe.transfers.list.mockResolvedValue({ data: [transfer({ amount: 76_000 })] });

    await handleChargeRefunded(charge({ refunded: false, amount_refunded: 50_000 }));

    expect(stripe.transfers.createReversal).toHaveBeenCalledWith('tr_1', expect.objectContaining({ amount: 30_000 }), expect.anything());
  });

  it('records a partial refund and tells the admins when nothing is left to take back', async () => {
    stripe.transfers.list.mockResolvedValue({ data: [reversedForDispute] });

    await handleChargeRefunded(charge({ refunded: false, amount_refunded: 30_000 }));

    expect(stripe.transfers.createReversal).not.toHaveBeenCalled();
    expect(prisma.orderEvent.create).toHaveBeenCalledWith({ data: expect.objectContaining({ type: 'partially_refunded' }) });
    adminMail();
  });
});

describe('disputes after the artist was paid', () => {
  beforeEach(() => {
    prisma.order.findUnique.mockResolvedValue(paidOrder);
  });

  it('takes the payout back while a dispute is open, and still asks the admins to answer it', async () => {
    await handleDisputeCreated(dispute());

    expect(stripe.transfers.createReversal).toHaveBeenCalledWith(
      'tr_1',
      { amount: 95_320, metadata: { orderId: 'order_1', reason: 'dispute', dispute: 'dp_1' } },
      expect.anything(),
    );
    sellerNotified('953,2 kr');
    adminMail();
  });

  it('takes back only the disputed amount', async () => {
    await handleDisputeCreated(dispute({ amount: 20_000 }));

    expect(stripe.transfers.createReversal).toHaveBeenCalledWith('tr_1', expect.objectContaining({ amount: 20_000 }), expect.anything());
  });

  it('leaves the artist their money during a bank inquiry, but tells the admins', async () => {
    await handleDisputeCreated(dispute({ status: 'warning_needs_response' }));

    expect(stripe.transfers.createReversal).not.toHaveBeenCalled();
    expect(prisma.order.update).not.toHaveBeenCalled();
    expect(prisma.orderEvent.create).toHaveBeenCalledWith({ data: expect.objectContaining({ type: 'dispute_inquiry' }) });
    expect(sendEmail).toHaveBeenCalledWith(expect.objectContaining({ subject: expect.stringContaining('Förfrågan') }));
  });

  it('takes the money back when an inquiry becomes a chargeback', async () => {
    prisma.orderEvent.findFirst.mockImplementation(({ where }: { where: { type: string } }) =>
      Promise.resolve(where.type === 'dispute_inquiry' ? { id: 'e1' } : null),
    );

    await handleDisputeFundsWithdrawn(dispute());

    expect(stripe.transfers.createReversal).toHaveBeenCalledWith('tr_1', expect.objectContaining({ amount: 95_320 }), expect.anything());
    expect(prisma.orderEvent.create).toHaveBeenCalledWith({ data: expect.objectContaining({ type: 'disputed' }) });
    expect(sendEmail).toHaveBeenCalledWith(expect.objectContaining({ subject: expect.stringContaining('Tvist') }));
  });

  it('ignores the withdrawal of a normal chargeback, which was handled when it was created', async () => {
    await handleDisputeFundsWithdrawn(dispute());

    expect(stripe.transfers.createReversal).not.toHaveBeenCalled();
    expect(sendEmail).not.toHaveBeenCalled();
  });

  it('does nothing more when the dispute is already recorded', async () => {
    prisma.orderEvent.findFirst.mockResolvedValue({ id: 'e1' });

    await handleDisputeCreated(dispute());

    expect(stripe.transfers.createReversal).not.toHaveBeenCalled();
    expect(prisma.orderEvent.create).not.toHaveBeenCalled();
    expect(sendEmail).not.toHaveBeenCalled();
  });

  it('still records everything when a retry comes after the money already moved', async () => {
    stripe.transfers.list.mockResolvedValue({ data: [reversedForDispute] });

    await handleDisputeCreated(dispute());

    expect(stripe.transfers.createReversal).not.toHaveBeenCalled();
    expect(prisma.orderEvent.create).toHaveBeenCalledWith({
      data: expect.objectContaining({ type: 'disputed', message: expect.stringContaining('953,2 kr') }),
    });
    adminMail();
  });

  it('pays the artist back when Konstbyte wins the dispute', async () => {
    stripe.transfers.list.mockResolvedValue({ data: [reversedForDispute] });

    await handleDisputeClosed(dispute({ status: 'won' }));

    expect(stripe.transfers.create).toHaveBeenCalledWith(
      expect.objectContaining({ amount: 95_320, destination: 'acct_1', transfer_group: 'order_1' }),
      { idempotencyKey: 'konstbyte-dispute-return-dp_1' },
    );
    expect(prisma.orderEvent.create).toHaveBeenCalledWith({ data: expect.objectContaining({ type: 'dispute_won' }) });
  });

  it('pays the artist back only once, even if Stripe sends the win again days later', async () => {
    stripe.transfers.list.mockResolvedValue({ data: [returnedAfterDispute, reversedForDispute] });

    await handleDisputeClosed(dispute({ status: 'won' }));

    expect(stripe.transfers.create).not.toHaveBeenCalled();
    // The interrupted first attempt never wrote it down, so this one does.
    expect(prisma.orderEvent.create).toHaveBeenCalledWith({ data: expect.objectContaining({ type: 'dispute_won' }) });
  });

  it('records a closed inquiry even though nothing was taken back', async () => {
    await handleDisputeClosed(dispute({ status: 'warning_closed' }));

    expect(stripe.transfers.create).not.toHaveBeenCalled();
    expect(prisma.orderEvent.create).toHaveBeenCalledWith({
      data: expect.objectContaining({ type: 'dispute_won', message: expect.stringContaining('pengarna finns kvar') }),
    });
  });

  it('tells the admins, and moves no money, when Stripe cannot be read', async () => {
    stripe.transfers.list.mockRejectedValue(new Error('rate limited'));
    vi.spyOn(console, 'error').mockImplementation(() => {});

    await handleDisputeClosed(dispute({ status: 'won' }));

    expect(stripe.transfers.create).not.toHaveBeenCalled();
    expect(prisma.orderEvent.create).not.toHaveBeenCalled();
    adminMail();
  });

  it('keeps what was taken back when the dispute is lost', async () => {
    stripe.transfers.list.mockResolvedValue({ data: [reversedForDispute] });

    await handleDisputeClosed(dispute({ status: 'lost' }));

    expect(stripe.transfers.create).not.toHaveBeenCalled();
    expect(prisma.orderEvent.create).toHaveBeenCalledWith({ data: expect.objectContaining({ type: 'dispute_lost' }) });
    expect(prisma.payout.updateMany).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ status: 'reversed' }) }));
    expect(sendEmail).not.toHaveBeenCalled();
  });

  it('records a lost dispute and tells the admins when nothing was taken back', async () => {
    await handleDisputeClosed(dispute({ status: 'lost' }));

    expect(prisma.orderEvent.create).toHaveBeenCalledWith({ data: expect.objectContaining({ type: 'dispute_lost' }) });
    adminMail();
  });
});
