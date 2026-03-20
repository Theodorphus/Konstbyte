import { NextRequest, NextResponse } from 'next/server';
import prisma from '../../../../../lib/prisma';
import { getCurrentUser } from '../../../../../lib/auth';

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id: submissionId } = await params;
    const submission = await prisma.challengeSubmission.findUnique({
      where: { id: submissionId },
      include: { challenge: true },
    });

    if (!submission) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    if (submission.artistId !== user.id) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const now = new Date();
    if (submission.challenge.endsAt < now) {
      return NextResponse.json({ error: 'Utmaningen är avslutad — du kan inte ta bort ditt bidrag' }, { status: 400 });
    }

    // Count likes on this submission to subtract from points
    const likeCount = await prisma.challengeLike.count({ where: { submissionId } });

    // Delete likes and submission
    await prisma.challengeLike.deleteMany({ where: { submissionId } });
    await prisma.challengeSubmission.delete({ where: { id: submissionId } });

    // Reverse participation points (+10) and likes earned
    const pointsToRemove = 10 + likeCount;
    await prisma.challengePoints.upsert({
      where: { userId: user.id },
      update: { points: { increment: -pointsToRemove } },
      create: { userId: user.id, points: 0 },
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
