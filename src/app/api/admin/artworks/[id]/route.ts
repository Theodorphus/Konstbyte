import { NextRequest, NextResponse } from 'next/server';
import prisma from '../../../../../lib/prisma';
import { getCurrentUser } from '../../../../../lib/auth';
import { isAdmin } from '../../../../../lib/admin';

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    if (!isAdmin(user.email)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { id } = await params;

    const artwork = await prisma.artwork.findUnique({
      where: { id },
      include: { orders: true },
    });

    if (!artwork) {
      return NextResponse.json({ error: 'Artwork not found' }, { status: 404 });
    }

    // Orders reference the artwork (and are needed for bookkeeping), so an artwork
    // that has been ordered is unpublished instead of deleted.
    if (artwork.orders.length > 0) {
      await prisma.artwork.update({ where: { id }, data: { isPublished: false, removedByAdmin: true } });
      return NextResponse.json({ success: true, unpublished: true });
    }

    await prisma.$transaction([
      // Delete favorites that reference this artwork
      prisma.favorite.deleteMany({ where: { artworkId: id } }),
      // Delete the artwork
      prisma.artwork.delete({ where: { id } }),
    ]);
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('[admin/artworks DELETE]', err);
    return NextResponse.json({ error: 'Kunde inte ta bort konstverket' }, { status: 500 });
  }
}

// PATCH /api/admin/artworks/[id] { action: 'restore' } — undo an admin removal.
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user || !isAdmin(user.email)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    const { id } = await params;
    const body = await request.json().catch(() => ({}));
    if (body?.action !== 'restore') {
      return NextResponse.json({ error: 'Okänd åtgärd' }, { status: 400 });
    }
    const result = await prisma.artwork.updateMany({
      where: { id, removedByAdmin: true },
      data: { removedByAdmin: false, isPublished: true },
    });
    if (result.count === 0) return NextResponse.json({ error: 'Hittades inte' }, { status: 404 });
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('[admin/artworks PATCH]', err);
    return NextResponse.json({ error: 'Kunde inte återställa konstverket' }, { status: 500 });
  }
}
