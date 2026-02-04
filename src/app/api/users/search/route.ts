import { NextRequest, NextResponse } from 'next/server';
import prisma from '../../../../lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const query = searchParams.get('q') || '';
    const sortBy = searchParams.get('sortBy') || 'recent'; // recent, followers, artworks

    if (!query || query.trim().length === 0) {
      return NextResponse.json({ users: [] });
    }

    // Build where clause for search
    const whereClause = {
      OR: [
        { name: { contains: query, mode: 'insensitive' as const } },
        { email: { contains: query, mode: 'insensitive' as const } },
      ],
    };

    // Build orderBy based on sortBy parameter
    
    const users = await prisma.user.findMany({
      where: whereClause,
      include: {
        _count: {
          select: {
            artworks: true,
            followers: true,
            following: true,
            posts: true,
          },
        },
      },
      take: 50,
    });

    // Sort users based on sortBy parameter (since Prisma can't directly sort by relation counts in all cases)
    const sortedUsers = [...users];
    if (sortBy === 'followers') {
      sortedUsers.sort((a, b) => b._count.followers - a._count.followers);
    } else if (sortBy === 'artworks') {
      sortedUsers.sort((a, b) => b._count.artworks - a._count.artworks);
    } else {
      // Default to recent (already sorted by createdAt desc)
    }

    return NextResponse.json({
      users: sortedUsers,
      count: sortedUsers.length,
    });
  } catch (error) {
    console.error('Error searching users:', error);
    return NextResponse.json(
      { error: 'Failed to search users' },
      { status: 500 }
    );
  }
}
