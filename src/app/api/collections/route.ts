import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';

// Hidden or removed artworks don't show up in public collections.
const VISIBLE_ITEM = { artwork: { isPublished: true } };

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const mine = searchParams.get('mine') === 'true';
    const artistId = searchParams.get('artistId');
    const limit = Math.min(Math.max(parseInt(searchParams.get('limit') || '6', 10) || 6, 1), 50);

    if (mine) {
      // Get current user's collections
      const user = await getCurrentUser();
      if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }

      const collections = await prisma.collection.findMany({
        where: { artistId: user.id },
        include: {
          items: {
            where: VISIBLE_ITEM,
            include: { artwork: { select: { imageUrl: true, id: true } } },
            take: 4,
          },
          _count: { select: { items: { where: VISIBLE_ITEM } } },
        },
        orderBy: { createdAt: 'desc' },
        take: limit,
      });

      return NextResponse.json(collections);
    }

    if (artistId) {
      // Get specific artist's collections
      const collections = await prisma.collection.findMany({
        where: { artistId },
        include: {
          items: {
            where: VISIBLE_ITEM,
            include: { artwork: { select: { imageUrl: true, id: true } } },
            take: 4,
          },
          _count: { select: { items: { where: VISIBLE_ITEM } } },
        },
        orderBy: { createdAt: 'desc' },
        take: limit,
      });

      return NextResponse.json(collections);
    }

    // Get all/featured collections
    const collections = await prisma.collection.findMany({
      include: {
        items: {
          where: VISIBLE_ITEM,
            include: { artwork: { select: { imageUrl: true, id: true } } },
          take: 4,
        },
        _count: { select: { items: { where: VISIBLE_ITEM } } },
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });

    return NextResponse.json(collections);
  } catch (error) {
    console.error('Error fetching collections:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
