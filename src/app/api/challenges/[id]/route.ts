import { NextRequest, NextResponse } from 'next/server';
import prisma from '../../../../lib/prisma';

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Delete in dependency order
    await prisma.challengeLike.deleteMany({
      where: { submission: { challengeId: id } },
    });
    await prisma.challengeSubmission.deleteMany({ where: { challengeId: id } });
    await prisma.challenge.delete({ where: { id } });

    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
