import { beforeEach, describe, expect, it, vi } from 'vitest';

const { prisma, tx, getCurrentUser } = vi.hoisted(() => {
  const tx = {
    artwork: { create: vi.fn() },
    artworkImage: { create: vi.fn() },
    collectionItem: { create: vi.fn() },
  };
  return {
    tx,
    prisma: {
      collection: { findFirst: vi.fn() },
      $transaction: vi.fn((fn: (t: typeof tx) => unknown) => fn(tx)),
    },
    getCurrentUser: vi.fn(),
  };
});
vi.mock('@/lib/prisma', () => ({ default: prisma }));
vi.mock('@/lib/auth', () => ({ getCurrentUser }));
vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }));

import { createMultipleArtworks } from '@/app/actions/artwork-actions';

const goodSlot = {
  url: 'https://utfs.io/f/abc.jpg',
  details: { title: 'Sommarhav', price: 1200, category: 'malningar' },
};

function upload(overrides: Record<string, unknown> = {}) {
  return createMultipleArtworks({ slots: [goodSlot], shippingType: 'postnord', ...overrides });
}

beforeEach(() => {
  vi.clearAllMocks();
  getCurrentUser.mockResolvedValue({ id: 'artist_1' });
  tx.artwork.create.mockResolvedValue({ id: 'art_1' });
});

describe('createMultipleArtworks', () => {
  it('creates a valid artwork', async () => {
    expect(await upload()).toEqual({ success: true, artworkIds: ['art_1'] });
    expect(tx.artwork.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ price: 1200, ownerId: 'artist_1' }) }),
    );
  });

  it('rejects images from hosts the site cannot show', async () => {
    const result = await upload({ slots: [{ ...goodSlot, url: 'https://evil.example/x.jpg' }] });
    expect(result.success).toBe(false);
    expect(tx.artwork.create).not.toHaveBeenCalled();
  });

  it.each([-5, 0, 2, 'abc', 5_000_000])('rejects the price %s', async (price) => {
    const result = await upload({ slots: [{ ...goodSlot, details: { ...goodSlot.details, price } }] });
    expect(result.success).toBe(false);
    expect(tx.artwork.create).not.toHaveBeenCalled();
  });

  it('rejects unknown shipping types and categories', async () => {
    expect((await upload({ shippingType: 'teleport' })).success).toBe(false);
    expect(
      (await upload({ slots: [{ ...goodSlot, details: { ...goodSlot.details, category: 'x' } }] })).success,
    ).toBe(false);
  });

  it("won't add artworks to someone else's collection", async () => {
    prisma.collection.findFirst.mockResolvedValue(null);

    const result = await upload({ collectionId: 'other_artists_collection' });

    expect(result).toEqual({ success: false, error: 'Samlingen hittades inte.' });
    expect(prisma.collection.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: 'other_artists_collection', artistId: 'artist_1' } }),
    );
    expect(tx.artwork.create).not.toHaveBeenCalled();
  });

  it('requires a signed-in user', async () => {
    getCurrentUser.mockResolvedValue(null);
    expect((await upload()).success).toBe(false);
  });
});
