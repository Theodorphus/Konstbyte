import { NextResponse } from 'next/server';
import prisma from '../../../lib/prisma';
import { getCurrentUser } from '../../../lib/auth';

export async function GET() {
  try {
    const user = await getCurrentUser();
    const now = new Date();

    // Most recent challenge (active or latest ended)
    const challenge = await prisma.challenge.findFirst({
      where: { startsAt: { lte: now } },
      orderBy: { startsAt: 'desc' },
      include: {
        submissions: {
          include: {
            artist: { select: { id: true, name: true, image: true } },
            likes: { select: { userId: true } },
          },
        },
      },
    });

    const isActive = challenge ? challenge.endsAt > now : false;

    // Hall of Fame: all ended challenges except the current one
    const pastChallenges = await prisma.challenge.findMany({
      where: {
        endsAt: { lt: now },
        ...(challenge ? { id: { not: challenge.id } } : {}),
      },
      orderBy: { endsAt: 'desc' },
      take: 8,
      include: {
        submissions: {
          include: {
            artist: { select: { id: true, name: true, image: true } },
            _count: { select: { likes: true } },
          },
        },
      },
    });

    // Global points leaderboard
    const leaderboard = await prisma.challengePoints.findMany({
      orderBy: { points: 'desc' },
      take: 10,
      include: { user: { select: { id: true, name: true, image: true } } },
    });

    const mapSub = (s: {
      id: string; title: string; description: string | null; imageUrl: string; price: number | null;
      artist: { id: string; name: string | null; image: string | null };
      likes: { userId: string }[];
    }, hideCount: boolean) => ({
      id: s.id,
      title: s.title,
      description: s.description,
      imageUrl: s.imageUrl,
      price: s.price,
      artist: s.artist,
      likeCount: hideCount ? null : s.likes.length,
      hasLiked: user ? s.likes.some(l => l.userId === user.id) : false,
    });

    // Shuffle when active (fair voting), sort by likes when ended
    const subs = challenge?.submissions ?? [];
    const sorted = isActive
      ? [...subs].sort(() => Math.random() - 0.5)
      : [...subs].sort((a, b) => b.likes.length - a.likes.length);

    return NextResponse.json({
      current: challenge ? {
        id: challenge.id,
        title: challenge.title,
        description: challenge.description,
        themePrompt: challenge.themePrompt,
        imageUrl: challenge.imageUrl ?? null,
        weekNumber: challenge.weekNumber,
        year: challenge.year,
        startsAt: challenge.startsAt,
        endsAt: challenge.endsAt,
        isActive,
        submissions: sorted.map(s => mapSub(s, isActive)),
      } : null,
      hallOfFame: pastChallenges.map(c => {
        const top = [...c.submissions].sort(
          (a, b) => b._count.likes - a._count.likes
        )[0];
        return {
          id: c.id,
          title: c.title,
          weekNumber: c.weekNumber,
          year: c.year,
          endsAt: c.endsAt,
          topSubmission: top ? {
            id: top.id,
            title: top.title,
            imageUrl: top.imageUrl,
            artist: top.artist,
            likeCount: top._count.likes,
          } : null,
        };
      }),
      leaderboard: leaderboard.map(p => ({
        userId: p.userId,
        points: p.points,
        user: p.user,
      })),
    });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

// Admin: create a new challenge
export async function POST(request: Request) {
  try {
    const { title, description, themePrompt, imageUrl, weekNumber, year, startsAt, endsAt } = await request.json();
    if (!title || !weekNumber || !year || !startsAt || !endsAt) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }
    const challenge = await prisma.challenge.create({
      data: {
        title,
        description: description ?? '',
        themePrompt: themePrompt ?? '',
        imageUrl: imageUrl ?? null,
        weekNumber: Number(weekNumber),
        year: Number(year),
        startsAt: new Date(startsAt),
        endsAt: new Date(endsAt),
      },
    });
    return NextResponse.json(challenge, { status: 201 });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
