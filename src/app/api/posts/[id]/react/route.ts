import { NextRequest, NextResponse } from 'next/server';
import prisma from '../../../../../lib/prisma';
import { getCurrentUser } from '../../../../../lib/auth';

const VALID_TYPES = ['like', 'heart', 'wow'] as const;
type ReactionType = (typeof VALID_TYPES)[number];

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: postId } = await params;
    const { type } = await request.json();

    if (!VALID_TYPES.includes(type as ReactionType)) {
      return NextResponse.json({ error: 'Invalid reaction type' }, { status: 400 });
    }

    const post = await prisma.post.findUnique({ where: { id: postId } });
    if (!post) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 });
    }

    const existing = await prisma.postReaction.findUnique({
      where: { postId_userId: { postId, userId: user.id } },
    });

    if (existing) {
      if (existing.type === type) {
        // Toggle off — remove the reaction
        await prisma.postReaction.delete({ where: { id: existing.id } });
      } else {
        // Change reaction type
        await prisma.postReaction.update({
          where: { id: existing.id },
          data: { type },
        });
      }
    } else {
      await prisma.postReaction.create({
        data: { postId, userId: user.id, type },
      });

      // Notify post author (not for self-reactions)
      if (post.authorId !== user.id) {
        const emoji = type === 'like' ? '👍' : type === 'heart' ? '❤️' : '😮';
        await prisma.notification.create({
          data: {
            userId: post.authorId,
            type: 'like',
            message: `${user.name || 'Någon'} reagerade ${emoji} på ditt inlägg`,
            link: '/community',
          },
        });
      }
    }

    // Return updated counts + user's current reaction
    const reactions = await prisma.postReaction.findMany({
      where: { postId },
      select: { type: true, userId: true },
    });

    const counts: Record<string, number> = { like: 0, heart: 0, wow: 0 };
    let userReaction: string | null = null;
    for (const r of reactions) {
      counts[r.type] = (counts[r.type] ?? 0) + 1;
      if (r.userId === user.id) userReaction = r.type;
    }

    return NextResponse.json({ reactions: counts, userReaction });
  } catch (error) {
    console.error('Error handling reaction:', error);
    return NextResponse.json({ error: 'Failed to update reaction' }, { status: 500 });
  }
}
