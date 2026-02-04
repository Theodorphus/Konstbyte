import { NextResponse } from 'next/server';
import prisma from '../../../lib/prisma';

export async function GET() {
  try {
    // Get platform statistics
    const [totalUsers, totalArtworks, totalPosts, recentArtworks] = await Promise.all([
      prisma.user.count(),
      prisma.artwork.count({ where: { isPublished: true } }),
      prisma.post.count(),
      prisma.artwork.findMany({
        where: { isPublished: true },
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
        take: 8,
      }),
    ]);

    // Get featured artworks (most favorited)
    const featuredArtworks = await prisma.artwork.findMany({
      where: { isPublished: true },
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
      take: 150, // Get more to ensure we have enough quality content
    });

    // Sort by favorites count - Type assertion for sorting
    const sortedFeatured = [...featuredArtworks]
      .sort((a, b) => (b._count?.favorites || 0) - (a._count?.favorites || 0))
      .slice(0, 8); // Increased to 8 for hero grid

    // Get recent posts
    const recentPosts = await prisma.post.findMany({
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
      take: 5,
    });

    return NextResponse.json({
      stats: {
        totalUsers,
        totalArtworks,
        totalPosts,
      },
      featuredArtworks: sortedFeatured,
      recentArtworks,
      recentPosts,
    });
  } catch (error) {
    console.error('Error fetching homepage data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch homepage data' },
      { status: 500 }
    );
  }
}
