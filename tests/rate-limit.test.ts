import { beforeEach, describe, expect, it, vi } from 'vitest';

const prisma = vi.hoisted(() => ({
  notification: { findFirst: vi.fn(), create: vi.fn() },
}));
vi.mock('@/lib/prisma', () => ({ default: prisma }));

import { hitLimit, notifyOnce } from '@/lib/rate-limit';

describe('hitLimit', () => {
  it('allows up to the limit, then blocks until the window passes', () => {
    vi.useFakeTimers();
    const key = `test:${Math.random()}`;
    expect(hitLimit(key, 2, 1000)).toBe(false);
    expect(hitLimit(key, 2, 1000)).toBe(false);
    expect(hitLimit(key, 2, 1000)).toBe(true);
    vi.advanceTimersByTime(1001);
    expect(hitLimit(key, 2, 1000)).toBe(false);
    vi.useRealTimers();
  });

  it('keeps keys separate', () => {
    expect(hitLimit('a:1', 1, 1000)).toBe(false);
    expect(hitLimit('b:1', 1, 1000)).toBe(false);
  });
});

describe('notifyOnce', () => {
  const data = { userId: 'u1', type: 'follow', message: 'X började följa dig', link: '/users/x' };
  beforeEach(() => vi.clearAllMocks());

  it('creates a notification when none exists', async () => {
    prisma.notification.findFirst.mockResolvedValue(null);
    await notifyOnce(data);
    expect(prisma.notification.create).toHaveBeenCalledWith({ data });
  });

  it('skips a duplicate within the window', async () => {
    prisma.notification.findFirst.mockResolvedValue({ id: 'n1' });
    await notifyOnce(data);
    expect(prisma.notification.create).not.toHaveBeenCalled();
  });
});
