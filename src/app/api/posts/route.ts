import { NextRequest, NextResponse } from 'next/server';
import prisma from '../../../lib/prisma';
import { getCurrentUser } from '../../../lib/auth';

export async function GET() {
  try {
    const user = await getCurrentUser();

    const posts = await prisma.post.findMany({
      include: {
        author: { select: { id: true, name: true, image: true, email: true } },
        reactions: { select: { type: true, userId: true } },
        _count: { select: { comments: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    // Aggregate reaction counts + flag user's own reaction
    const serialized = posts.map((post) => {
      const counts: Record<string, number> = { like: 0, heart: 0, wow: 0 };
      let userReaction: string | null = null;
      for (const r of post.reactions) {
        counts[r.type] = (counts[r.type] ?? 0) + 1;
        if (user && r.userId === user.id) userReaction = r.type;
      }
      return {
        id: post.id,
        content: post.content,
        imageUrl: post.imageUrl,
        createdAt: post.createdAt,
        author: post.author,
        reactions: counts,
        userReaction,
        commentCount: post._count.comments,
      };
    });

    return NextResponse.json(serialized);
  } catch (error) {
    console.error('Error fetching posts:', error);
    return NextResponse.json({ error: 'Failed to fetch posts' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { content, imageUrl } = await request.json();
    if (!content || content.trim().length === 0) {
      return NextResponse.json({ error: 'Content is required' }, { status: 400 });
    }

    const post = await prisma.post.create({
      data: {
        content: content.trim(),
        imageUrl: imageUrl ?? null,
        authorId: user.id,
      },
      include: {
        author: { select: { id: true, name: true, image: true, email: true } },
        _count: { select: { comments: true } },
      },
    });

    return NextResponse.json({
      id: post.id,
      content: post.content,
      imageUrl: post.imageUrl,
      createdAt: post.createdAt,
      author: post.author,
      reactions: { like: 0, heart: 0, wow: 0 },
      userReaction: null,
      commentCount: 0,
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating post:', error);
    return NextResponse.json({ error: 'Failed to create post' }, { status: 500 });
  }
}
