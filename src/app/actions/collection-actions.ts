'use server';

import prisma from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { revalidatePath } from 'next/cache';

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

    const collection = await prisma.collection.create({
      data: {
        artistId: user.id,
        title: input.title.trim(),
        description: input.description?.trim() || null,
        coverImage: input.coverImage || null,
      },
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
