import { NextRequest, NextResponse } from 'next/server';
import prisma from '../../../../../../lib/prisma';
import { getCurrentUser } from '../../../../../../lib/auth';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id: submissionId } = await params;
    const submission = await prisma.challengeSubmission.findUnique({ where: { id: submissionId } });
    if (!submission) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    if (submission.artistId === user.id) {
      return NextResponse.json({ error: 'Du kan inte gilla ditt eget bidrag' }, { status: 400 });
    }

    const existing = await prisma.challengeLike.findUnique({
      where: { submissionId_userId: { submissionId, userId: user.id } },
    });

    if (existing) {
      await prisma.challengeLike.delete({ where: { id: existing.id } });
      await prisma.challengePoints.upsert({
        where: { userId: submission.artistId },
        update: { points: { increment: -1 } },
        create: { userId: submission.artistId, points: 0 },
      });
      return NextResponse.json({ liked: false });
    } else {
      await prisma.challengeLike.create({ data: { submissionId, userId: user.id } });
      await prisma.challengePoints.upsert({
        where: { userId: submission.artistId },
        update: { points: { increment: 1 } },
        create: { userId: submission.artistId, points: 1 },
      });
      return NextResponse.json({ liked: true });
    }
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
