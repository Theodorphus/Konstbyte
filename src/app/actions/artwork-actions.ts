'use server';

import prisma from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { revalidatePath } from 'next/cache';

export interface UploadedImage {
  url: string;
  isMain: boolean;
  sortOrder: number;
}

export interface CreateArtworkInput {
  images: UploadedImage[];
  title: string;
  description?: string;
  price: number;
  category: string;
  technique?: string;
  dimensions?: string;
  shippingType: string;
  shippingCost?: number;
  shippingArea?: string;
  shippingCarrier?: string;
  collectionId?: string | null;
}

export async function createArtworkWithImages(input: CreateArtworkInput) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      throw new Error('Unauthorized');
    }

    if (!input.images || input.images.length === 0) {
      throw new Error('At least one image is required');
    }

    const mainImage = input.images.find((img) => img.isMain);
    const mainImageUrl = mainImage?.url || input.images[0]?.url;

    const artwork = await prisma.$transaction(async (tx) => {
      // 1. Create artwork
      const newArtwork = await tx.artwork.create({
        data: {
          title: input.title.trim(),
          description: input.description?.trim() || null,
          price: input.price,
          category: input.category,
          imageUrl: mainImageUrl, // backward compat: set to main image
          ownerId: user.id,
          technique: input.technique?.trim() || null,
          dimensions: input.dimensions?.trim() || null,
          shippingType: input.shippingType,
          shippingCost: input.shippingCost || null,
          shippingArea: input.shippingArea?.trim() || null,
          shippingCarrier: input.shippingCarrier?.trim() || null,
          isPublished: true,
        },
      });

      // 2. Create artwork images
      await tx.artworkImage.createMany({
        data: input.images.map((img, idx) => ({
          artworkId: newArtwork.id,
          url: img.url,
          isMain: img.isMain,
          sortOrder: idx,
        })),
      });

      // 3. Add to collection if provided
      if (input.collectionId) {
        await tx.collectionItem.create({
          data: {
            collectionId: input.collectionId,
            artworkId: newArtwork.id,
          },
        });
      }

      return newArtwork;
    });

    // Revalidate related pages
    revalidatePath('/artworks');
    revalidatePath(`/artworks/${artwork.id}`);
    revalidatePath(`/users/${user.id}`);

    return {
      success: true,
      artworkId: artwork.id,
    };
  } catch (error) {
    console.error('Error creating artwork:', error);
    throw error;
  }
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

export async function createMultipleArtworks(input: CreateMultipleArtworksInput) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      throw new Error('Unauthorized');
    }

    if (!input.slots || input.slots.length === 0) {
      throw new Error('At least one artwork is required');
    }

    const artworkIds = await prisma.$transaction(async (tx) => {
      const ids: string[] = [];

      for (const slot of input.slots) {
        // 1. Create artwork
        const newArtwork = await tx.artwork.create({
          data: {
            title: slot.details.title.trim(),
            description: slot.details.description?.trim() || null,
            price: typeof slot.details.price === 'string' ? parseFloat(slot.details.price) : slot.details.price,
            category: slot.details.category,
            imageUrl: slot.url, // set to the image URL (each artwork has one image)
            ownerId: user.id,
            technique: slot.details.technique?.trim() || null,
            dimensions: slot.details.dimensions?.trim() || null,
            shippingType: input.shippingType,
            shippingCost: input.shippingCost ? (typeof input.shippingCost === 'string' ? parseFloat(input.shippingCost) : input.shippingCost) : null,
            shippingArea: input.shippingArea?.trim() || null,
            shippingCarrier: input.shippingCarrier?.trim() || null,
            isPublished: true,
          },
        });

        // 2. Create artwork image (one per artwork)
        await tx.artworkImage.create({
          data: {
            artworkId: newArtwork.id,
            url: slot.url,
            isMain: true,
            sortOrder: 0,
          },
        });

        // 3. Add to collection if provided
        if (input.collectionId) {
          await tx.collectionItem.create({
            data: {
              collectionId: input.collectionId,
              artworkId: newArtwork.id,
            },
          });
        }

        ids.push(newArtwork.id);
      }

      return ids;
    });

    // Revalidate related pages
    revalidatePath('/artworks');
    revalidatePath(`/users/${user.id}`);

    return {
      success: true,
      artworkIds,
    };
  } catch (error) {
    console.error('Error creating multiple artworks:', error);
    throw error;
  }
}
