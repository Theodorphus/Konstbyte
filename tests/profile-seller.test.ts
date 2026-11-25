import { beforeEach, describe, expect, it, vi } from 'vitest';

const { prisma, getCurrentUser } = vi.hoisted(() => ({
  prisma: { user: { update: vi.fn() } },
  getCurrentUser: vi.fn(),
}));
vi.mock('@/lib/prisma', () => ({ default: prisma }));
vi.mock('@/lib/auth', () => ({ getCurrentUser }));

import { PUT } from '@/app/api/profile/route';
import { NextRequest } from 'next/server';

const put = (body: unknown) =>
  PUT(new NextRequest('https://konstbyte.se/api/profile', { method: 'PUT', body: JSON.stringify(body) }));

beforeEach(() => {
  vi.clearAllMocks();
  getCurrentUser.mockResolvedValue({ id: 'u1', name: 'Anna', image: null });
  prisma.user.update.mockImplementation(({ data }: { data: object }) => Promise.resolve({ id: 'u1', ...data }));
});

describe('PUT /api/profile seller details', () => {
  it('saves a business with a normalised org.nr', async () => {
    const res = await put({ sellerType: 'business', businessName: 'Lind Konst', businessOrgNr: '5561234567' });
    expect(res.status).toBe(200);
    expect(prisma.user.update.mock.calls[0][0].data).toMatchObject({
      sellerType: 'business',
      businessName: 'Lind Konst',
      businessOrgNr: '556123-4567',
    });
  });

  it('rejects an invalid org.nr with a code the form can show', async () => {
    const res = await put({ sellerType: 'business', businessName: 'Lind Konst', businessOrgNr: '556123-4568' });
    expect(res.status).toBe(400);
    expect(await res.json()).toMatchObject({ code: 'org_nr' });
    expect(prisma.user.update).not.toHaveBeenCalled();
  });

  it('leaves the seller details alone when they are not sent', async () => {
    await put({ bio: 'Målar hav' });
    expect(prisma.user.update.mock.calls[0][0].data).not.toHaveProperty('sellerType');
  });
});
