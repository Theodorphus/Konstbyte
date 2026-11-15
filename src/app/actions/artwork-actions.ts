'use server';

import prisma from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { revalidatePath } from 'next/cache';
import { isAllowedImageUrl } from '@/lib/image-url';
import { SHIPPING_OPTIONS } from '@/lib/shipping';
import { parseArtworkPrice, parseShippingCost, MIN_ARTWORK_PRICE, MAX_ARTWORK_PRICE } from '@/lib/payout';

export interface UploadedImage {
  url: string;
  isMain: boolean;
  sortOrder: number;
}

export interface ArtworkSlotDetails {
  title: string;
  price: number;
  category: string;
  description?: string;
  technique?: string;
  dimensions?: string;
}

export interface CreateMultipleArtworksInput {
  slots: Array<{
    url: string;
    details: ArtworkSlotDetails;
  }>;
  shippingType: string;
  shippingCost?: number;
  shippingArea?: string;
  shippingCarrier?: string;
  collectionId?: string | null;
}

export type CreateMultipleArtworksResult =
  | { success: true; artworkIds: string[] }
  | { success: false; error: string };

// Keep in sync with the category list in the upload form and /artworks filter.
const CATEGORIES = ['malningar', 'skulpturer', 'fotografi', 'digital'];
const SHIPPING_TYPES: string[] = SHIPPING_OPTIONS.map((o) => o.value);
const MAX_ARTWORKS_PER_UPLOAD = 20;

/** Trims and caps an optional text field; empty becomes null. */
function text(value: unknown, max: number): string | null {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim().slice(0, max);
  return trimmed || null;
}

/**
 * Creates one artwork per uploaded image. Server actions can be called directly
 * with any input, so everything is validated here (same rules as the
 * /api/artworks routes). Errors are returned rather than thrown, because Next.js
 * hides thrown error messages from the browser in production.
 */
export async function createMultipleArtworks(
  input: CreateMultipleArtworksInput,
): Promise<CreateMultipleArtworksResult> {
  const user = await getCurrentUser();
  if (!user) return { success: false, error: 'Du måste vara inloggad.' };

  const slots = Array.isArray(input?.slots) ? input.slots : [];
  if (slots.length === 0) return { success: false, error: 'Lägg till minst ett konstverk.' };
  if (slots.length > MAX_ARTWORKS_PER_UPLOAD) {
    return { success: false, error: `Du kan ladda upp högst ${MAX_ARTWORKS_PER_UPLOAD} konstverk åt gången.` };
  }

  if (!SHIPPING_TYPES.includes(input.shippingType)) return { success: false, error: 'Välj ett fraktsätt.' };
  const shippingCost = parseShippingCost(input.shippingCost);
  if (shippingCost === undefined) return { success: false, error: 'Fraktkostnaden måste vara mellan 0 och 100 000 kr.' };

  const artworks: {
    url: string;
    title: string;
    price: number;
    category: string;
    description: string | null;
    technique: string | null;
    dimensions: string | null;
  }[] = [];
  for (const [i, slot] of slots.entries()) {
    const n = i + 1;
    if (!isAllowedImageUrl(slot?.url)) return { success: false, error: `Bild ${n} kunde inte användas. Ladda upp den igen.` };
    const title = text(slot.details?.title, 200);
    if (!title) return { success: false, error: `Konstverk ${n} saknar titel.` };
    const price = parseArtworkPrice(slot.details?.price);
    if (price === null) {
      return {
        success: false,
        error: `Priset för "${title}" måste vara mellan ${MIN_ARTWORK_PRICE} och ${MAX_ARTWORK_PRICE.toLocaleString('sv-SE')} kr.`,
      };
    }
    if (!CATEGORIES.includes(slot.details?.category)) return { success: false, error: `Välj en kategori för "${title}".` };
    artworks.push({
      url: slot.url,
      title,
      price,
      category: slot.details.category,
      description: text(slot.details.description, 5000),
      technique: text(slot.details.technique, 200),
      dimensions: text(slot.details.dimensions, 100),
    });
  }

  // Only the artist's own collection.
  if (input.collectionId) {
    const collection = await prisma.collection.findFirst({
      where: { id: input.collectionId, artistId: user.id },
      select: { id: true },
    });
    if (!collection) return { success: false, error: 'Samlingen hittades inte.' };
  }

  try {
    const artworkIds = await prisma.$transaction(async (tx) => {
      const ids: string[] = [];
      for (const artwork of artworks) {
        const created = await tx.artwork.create({
          data: {
            title: artwork.title,
            description: artwork.description,
            price: artwork.price,
            category: artwork.category,
            imageUrl: artwork.url,
            ownerId: user.id,
            technique: artwork.technique,
            dimensions: artwork.dimensions,
            shippingType: input.shippingType,
            shippingCost: shippingCost ?? null,
            shippingArea: text(input.shippingArea, 200),
            shippingCarrier: text(input.shippingCarrier, 100),
            isPublished: true,
          },
        });
        await tx.artworkImage.create({
          data: { artworkId: created.id, url: artwork.url, isMain: true, sortOrder: 0 },
        });
        if (input.collectionId) {
          await tx.collectionItem.create({
            data: { collectionId: input.collectionId, artworkId: created.id },
          });
        }
        ids.push(created.id);
      }
      return ids;
    });

    revalidatePath('/artworks');
    revalidatePath(`/users/${user.id}`);
    return { success: true, artworkIds };
  } catch (error) {
    console.error('Error creating multiple artworks:', error);
    return { success: false, error: 'Kunde inte skapa konstverken. Försök igen senare.' };
  }
}
