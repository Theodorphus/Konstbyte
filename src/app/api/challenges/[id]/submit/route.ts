import { NextRequest, NextResponse } from 'next/server';
import prisma from '../../../../../lib/prisma';
import { getCurrentUser } from '../../../../../lib/auth';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id: challengeId } = await params;
    const { title, description, imageUrl, price } = await request.json();

    if (!title || !imageUrl) {
      return NextResponse.json({ error: 'title och imageUrl krävs' }, { status: 400 });
    }

    const now = new Date();
    const challenge = await prisma.challenge.findUnique({ where: { id: challengeId } });
    if (!challenge || challenge.endsAt < now || challenge.startsAt > now) {
      return NextResponse.json({ error: 'Utmaningen är inte aktiv' }, { status: 400 });
    }

    const existing = await prisma.challengeSubmission.findFirst({
      where: { challengeId, artistId: user.id },
    });
    if (existing) {
      return NextResponse.json({ error: 'Du har redan skickat in ett bidrag' }, { status: 400 });
    }

    const submission = await prisma.challengeSubmission.create({
      data: {
        challengeId,
        artistId: user.id,
        title,
        description: description || null,
        imageUrl,
        price: price ? Number(price) : null,
      },
      include: { artist: { select: { id: true, name: true, image: true } } },
    });

    // +10 points for participating
    await prisma.challengePoints.upsert({
      where: { userId: user.id },
      update: { points: { increment: 10 } },
      create: { userId: user.id, points: 10 },
    });

    return NextResponse.json({ ...submission, likeCount: null, hasLiked: false }, { status: 201 });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
