import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]/route';
import prisma from '../../../lib/prisma';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: {
        following: {
          select: { followingId: true },
        },
      },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Get IDs of users being followed (plus own ID to include own content)
    const followedUserIds = user.following.map((f) => (f as { followingId: string }).followingId);
    const userIds = [...followedUserIds, user.id];

    // Fetch posts from followed users
    const posts = await prisma.post.findMany({
      where: {
        authorId: { in: userIds },
      },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
          },
        },
        _count: {
          select: { comments: true },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 20,
    });

    // Fetch artworks from followed users
    const artworks = await prisma.artwork.findMany({
      where: {
        ownerId: { in: userIds },
        isPublished: true,
      },
      include: {
        owner: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
          },
        },
        _count: {
          select: { favorites: true },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 20,
    });

    // Combine and sort by date
    const feedItems = [
      ...posts.map((post) => ({
        id: post.id,
        type: 'post' as const,
        content: post,
        createdAt: post.createdAt,
      })),
      ...artworks.map((artwork) => ({
        id: artwork.id,
        type: 'artwork' as const,
        content: artwork,
        createdAt: artwork.createdAt,
      })),
    ].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    return NextResponse.json({
      items: feedItems.slice(0, 30), // Limit to 30 most recent items
      followingCount: followedUserIds.length,
    });
  } catch (error) {
    console.error('Error fetching feed:', error);
    return NextResponse.json(
      { error: 'Failed to fetch feed' },
      { status: 500 }
    );
  }
}
