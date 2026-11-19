import { NextRequest, NextResponse } from 'next/server';
import type { Prisma } from '@prisma/client';
import prisma from '../../../../lib/prisma';

// GET /api/users/search?q=…&sortBy=recent|followers|artworks
// With a query: people whose name or Instagram matches. Without one: artists
// who have published work. Deleted accounts (no email left) never show up.
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const query = (searchParams.get('q') || '').trim().slice(0, 100);
    const sortBy = searchParams.get('sortBy') || 'recent';

    const where: Prisma.UserWhereInput = query
      ? {
          email: { not: null },
          OR: [
            { name: { contains: query, mode: 'insensitive' } },
            { instagram: { contains: query, mode: 'insensitive' } },
          ],
        }
      : { email: { not: null }, artworks: { some: { isPublished: true } } };

    const orderBy: Prisma.UserOrderByWithRelationInput =
      sortBy === 'followers' ? { followers: { _count: 'desc' } } :
      sortBy === 'artworks' ? { artworks: { _count: 'desc' } } :
      { createdAt: 'desc' };

    const users = await prisma.user.findMany({
      where,
      // Only public profile fields — never email, Stripe ids or auth data.
      select: {
        id: true,
        name: true,
        image: true,
        bio: true,
        instagram: true,
        createdAt: true,
        _count: {
          select: {
            artworks: { where: { isPublished: true } },
            followers: true,
            following: true,
            posts: true,
          },
        },
      },
      orderBy,
      take: 50,
    });

    return NextResponse.json({ users, count: users.length });
  } catch (error) {
    console.error('Error searching users:', error);
    return NextResponse.json({ error: 'Failed to search users' }, { status: 500 });
  }
}
