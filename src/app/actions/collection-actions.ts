'use server';

import prisma from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { revalidatePath } from 'next/cache';
import { isAllowedImageUrl } from '@/lib/image-url';

export interface CreateCollectionInput {
  title: string;
  description?: string;
  coverImage?: string;
}

export async function createCollection(input: CreateCollectionInput) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      throw new Error('Unauthorized');
    }

    // Server actions can be called with any input: validate like the API routes.
    const title = typeof input?.title === 'string' ? input.title.trim().slice(0, 200) : '';
    if (!title) throw new Error('Title is required');
    const description =
      typeof input.description === 'string' ? input.description.trim().slice(0, 2000) || null : null;
    // Only image hosts next/image can load; anything else would crash the pages showing it.
    const coverImage = isAllowedImageUrl(input.coverImage) ? input.coverImage : null;

    const collection = await prisma.collection.create({
      data: { artistId: user.id, title, description, coverImage },
    });

    revalidatePath('/artworks/new');
    revalidatePath(`/users/${user.id}`);
    revalidatePath('/artworks');

    return collection;
  } catch (error) {
    console.error('Error creating collection:', error);
    throw error;
  }
}

export async function getUserCollections() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      throw new Error('Unauthorized');
    }

    const collections = await prisma.collection.findMany({
      where: { artistId: user.id },
      include: {
        items: {
          include: {
            artwork: { select: { id: true, imageUrl: true, title: true } },
          },
        },
        _count: { select: { items: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return collections;
  } catch (error) {
    console.error('Error fetching user collections:', error);
    throw error;
  }
}
