import { NextRequest, NextResponse } from 'next/server';
import prisma from '../../../lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q')?.slice(0, 100) || '';

    if (!query || query.trim().length < 2) {
      return NextResponse.json({ users: [], artworks: [] });
    }

    // Search for users (artists)
    const users = await prisma.user.findMany({
      where: {
        OR: [
          { name: { contains: query, mode: 'insensitive' } },
          { email: { contains: query, mode: 'insensitive' } },
        ],
      },
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
        _count: {
          select: { artworks: true },
        },
      },
      take: 5,
    });

    // Search for artworks
    const artworks = await prisma.artwork.findMany({
      where: {
        isPublished: true,
        OR: [
          { title: { contains: query, mode: 'insensitive' } },
          { description: { contains: query, mode: 'insensitive' } },
          { owner: { name: { contains: query, mode: 'insensitive' } } },
        ],
      },
      include: { owner: true },
      take: 6,
    });

    return NextResponse.json({ users, artworks });
  } catch (error) {
    console.error('Search error:', error);
    return NextResponse.json(
      { error: 'Search failed' },
      { status: 500 }
    );
  }
}
