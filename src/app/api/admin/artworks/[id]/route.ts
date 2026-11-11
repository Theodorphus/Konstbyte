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
      await prisma.artwork.update({ where: { id }, data: { isPublished: false } });
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
