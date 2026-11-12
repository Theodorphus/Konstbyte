import { beforeEach, describe, expect, it, vi } from 'vitest';

const { prisma, stripe } = vi.hoisted(() => {
  const prisma = {
    order: { findUnique: vi.fn(), update: vi.fn(), updateMany: vi.fn() },
    user: { update: vi.fn() },
    payout: { upsert: vi.fn() },
    orderEvent: { create: vi.fn() },
    notification: { create: vi.fn() },
    $transaction: vi.fn(),
  };
  const stripe = {
    accounts: { retrieve: vi.fn() },
    checkout: { sessions: { retrieve: vi.fn() } },
    paymentIntents: { retrieve: vi.fn() },
    transfers: { create: vi.fn() },
  };
  return { prisma, stripe };
});
vi.mock('@/lib/prisma', () => ({ default: prisma }));
vi.mock('@/lib/stripe', () => ({ default: stripe }));

import { isConnectAccountReady, releaseSellerPayout } from '@/lib/release-payout';

function paidOrder(overrides: Record<string, unknown> = {}) {
  return {
    id: 'order_1',
    sellerId: 'seller_1',
    seller: { id: 'seller_1', stripeAccountId: 'acct_1', stripeOnboardingDone: true },
    artwork: { title: 'Solnedgång' },
    payments: [{ stripeId: 'pi_1' }],
    stripeSessionId: 'cs_1',
    paymentMethod: 'stripe',
    status: 'delivered',
    sellerPayoutStatus: 'unpaid',
    amount: 1000,
    ...overrides,
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  delete process.env.PLATFORM_FEE_PERCENT;
  prisma.$transaction.mockImplementation((arg: unknown) =>
    Array.isArray(arg) ? Promise.all(arg) : (arg as (tx: typeof prisma) => unknown)(prisma),
  );
  stripe.paymentIntents.retrieve.mockResolvedValue({ status: 'succeeded', latest_charge: 'ch_1' });
  stripe.transfers.create.mockResolvedValue({ id: 'tr_1' });
});

describe('releaseSellerPayout', () => {
  it('transfers the artist share (minus 3 %) idempotently and marks the order paid', async () => {
    prisma.order.findUnique.mockResolvedValue(paidOrder());

    const result = await releaseSellerPayout('order_1');

    expect(result).toEqual({ status: 'transferred', transferId: 'tr_1', sellerPayoutAmount: 970 });
    expect(stripe.transfers.create).toHaveBeenCalledWith(
      expect.objectContaining({
        amount: 97_000,
        currency: 'sek',
        destination: 'acct_1',
        source_transaction: 'ch_1',
        transfer_group: 'order_1',
      }),
      { idempotencyKey: 'konstbyte-payout-order_1' },
    );
    expect(prisma.order.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ sellerPayoutStatus: 'paid' }) }),
    );
    expect(prisma.payout.upsert).toHaveBeenCalledWith(
      expect.objectContaining({ create: expect.objectContaining({ status: 'completed', method: 'stripe' }) }),
    );
  });

  it('leaves a manual payout when the artist has not connected Stripe', async () => {
    prisma.order.findUnique.mockResolvedValue(
      paidOrder({ seller: { id: 'seller_1', stripeAccountId: null, stripeOnboardingDone: false } }),
    );

    const result = await releaseSellerPayout('order_1');

    expect(result).toEqual({ status: 'manual', sellerPayoutAmount: 970 });
    expect(stripe.transfers.create).not.toHaveBeenCalled();
    expect(prisma.order.update).not.toHaveBeenCalled();
    expect(prisma.payout.upsert).toHaveBeenCalledTimes(1);
  });

  it('falls back to manual (with a note) when the transfer fails', async () => {
    prisma.order.findUnique.mockResolvedValue(paidOrder());
    stripe.transfers.create.mockRejectedValue(new Error('insufficient funds'));
    vi.spyOn(console, 'error').mockImplementation(() => {});

    const result = await releaseSellerPayout('order_1');

    expect(result.status).toBe('manual');
    expect(prisma.payout.upsert).toHaveBeenCalledWith(
      expect.objectContaining({ create: expect.objectContaining({ adminNote: expect.stringContaining('misslyckades') }) }),
    );
  });

  it('checks a not-yet-confirmed account with Stripe before transferring', async () => {
    prisma.order.findUnique.mockResolvedValue(
      paidOrder({ seller: { id: 'seller_1', stripeAccountId: 'acct_1', stripeOnboardingDone: false } }),
    );
    stripe.accounts.retrieve.mockResolvedValue({ details_submitted: false });

    const result = await releaseSellerPayout('order_1');

    expect(result.status).toBe('manual');
    expect(stripe.transfers.create).not.toHaveBeenCalled();
  });

  it('does nothing for an order that is already paid out', async () => {
    prisma.order.findUnique.mockResolvedValue(paidOrder({ sellerPayoutStatus: 'paid' }));
    expect(await releaseSellerPayout('order_1')).toEqual({ status: 'already_paid' });
    expect(stripe.transfers.create).not.toHaveBeenCalled();
  });

  it('refuses to pay out an unpaid order', async () => {
    prisma.order.findUnique.mockResolvedValue(paidOrder({ status: 'pending' }));
    expect(await releaseSellerPayout('order_1')).toEqual({ status: 'skipped', reason: 'not_paid' });
    expect(prisma.payout.upsert).not.toHaveBeenCalled();
  });

  it('does not transfer when the payment has not succeeded', async () => {
    prisma.order.findUnique.mockResolvedValue(paidOrder());
    stripe.paymentIntents.retrieve.mockResolvedValue({ status: 'processing', latest_charge: null });

    expect((await releaseSellerPayout('order_1')).status).toBe('manual');
    expect(stripe.transfers.create).not.toHaveBeenCalled();
  });
});

describe('isConnectAccountReady', () => {
  it.each([
    [{ details_submitted: true, capabilities: { transfers: 'active' } }, true],
    [{ details_submitted: true, charges_enabled: true, payouts_enabled: true }, true],
    [{ details_submitted: true, capabilities: { transfers: 'pending' } }, false],
    [{ details_submitted: false, capabilities: { transfers: 'active' } }, false],
  ])('%j → %s', (account, expected) => {
    expect(isConnectAccountReady(account as never)).toBe(expected);
  });
});
