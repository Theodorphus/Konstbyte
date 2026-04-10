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
