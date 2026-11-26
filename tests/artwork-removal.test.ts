import { describe, expect, it } from 'vitest';
import { canOwnerRemove, saleWasRefunded } from '@/lib/artwork-removal';

const now = Date.now();
const order = (status: string, hoursAgo = 0) => ({ status, createdAt: new Date(now - hoursAgo * 60 * 60 * 1000) });

describe('artwork removal rules', () => {
  it('lets the artist remove an unsold artwork with no live sale', () => {
    expect(canOwnerRemove({ isSold: false, orders: [] }, now)).toBe(true);
    expect(canOwnerRemove({ isSold: false, orders: [order('expired'), order('pending', 48)] }, now)).toBe(true);
  });

  it('blocks while a sale stands or a payment is in progress', () => {
    expect(canOwnerRemove({ isSold: true, orders: [order('delivered')] }, now)).toBe(false);
    expect(canOwnerRemove({ isSold: false, orders: [order('pending', 1)] }, now)).toBe(false);
  });

  it('keeps a sold artwork unless the sale was refunded', () => {
    expect(canOwnerRemove({ isSold: true, orders: [] }, now)).toBe(false);
    expect(canOwnerRemove({ isSold: true, orders: [order('expired')] }, now)).toBe(false);
    expect(canOwnerRemove({ isSold: true, orders: [order('payment_failed'), order('refunded')] }, now)).toBe(true);
  });

  it('never lets the artist remove what an admin took down', () => {
    expect(canOwnerRemove({ isSold: false, removedByAdmin: true, orders: [] }, now)).toBe(false);
  });

  it('labels a refunded sale the same way the button decides', () => {
    expect(saleWasRefunded({ isSold: true, orders: [order('payment_failed'), order('refunded')] }, now)).toBe(true);
    expect(saleWasRefunded({ isSold: true, orders: [order('expired')] }, now)).toBe(false);
    expect(saleWasRefunded({ isSold: true, orders: [order('refunded'), order('delivered')] }, now)).toBe(false);
  });
});
