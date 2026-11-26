import { NextRequest, NextResponse } from 'next/server';
import prisma from '../../../../../lib/prisma';
import { getCurrentUser } from '../../../../../lib/auth';
import { isAdmin } from '../../../../../lib/admin';
import { artworkRemovedEmail, sendEmail } from '@/lib/email';
import { COMPANY } from '@/lib/company';
import { APP_URL } from '@/lib/urls';
import { notificationText } from '@/lib/notification-message';

const MAX_REASON_LENGTH = 1000;

// DELETE /api/admin/artworks/[id] { reason } — take an artwork down. The artist
// is told why (in-app and by email), as the DSA requires.
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
    const body = await request.json().catch(() => ({}));
    const reason = typeof body?.reason === 'string' ? body.reason.trim() : '';
    if (reason.length < 3) {
      return NextResponse.json({ error: 'Skriv varför verket tas bort. Konstnären får se skälet.' }, { status: 400 });
    }
    if (reason.length > MAX_REASON_LENGTH) {
      return NextResponse.json({ error: `Skälet får vara högst ${MAX_REASON_LENGTH} tecken` }, { status: 400 });
    }

    const artwork = await prisma.artwork.findUnique({
      where: { id },
      select: {
        title: true,
        ownerId: true,
        owner: { select: { email: true } },
        _count: { select: { orders: true } },
      },
    });

    if (!artwork) {
      return NextResponse.json({ error: 'Artwork not found' }, { status: 404 });
    }

    // Orders reference the artwork (and are needed for bookkeeping), so an artwork
    // that has been ordered is unpublished instead of deleted.
    const hidden = artwork._count.orders > 0;
    const notify = prisma.notification.create({
      data: {
        userId: artwork.ownerId,
        type: 'artwork_removed',
        ...notificationText('artwork_removed', { title: artwork.title, reason }),
        link: '/policies/content',
      },
    });

    if (hidden) {
      await prisma.$transaction([
        prisma.artwork.update({ where: { id }, data: { isPublished: false, removedByAdmin: true } }),
        notify,
      ]);
    } else {
      await prisma.$transaction([
        // Delete favorites that reference this artwork
        prisma.favorite.deleteMany({ where: { artworkId: id } }),
        prisma.artwork.delete({ where: { id } }),
        notify,
      ]);
    }

    if (artwork.owner.email) {
      const mail = artworkRemovedEmail({
        artworkTitle: artwork.title,
        reason,
        hidden,
        contactEmail: COMPANY.email,
        appUrl: APP_URL,
      });
      // The removal stands even if the email can't be sent; the in-app notice is saved.
      await sendEmail({ to: artwork.owner.email, ...mail }).catch((err) =>
        console.error('[admin/artworks DELETE] removal email failed', err),
      );
    }

    return NextResponse.json(hidden ? { success: true, unpublished: true } : { success: true });
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
    const artwork = await prisma.artwork.findFirst({
      where: { id, removedByAdmin: true },
      select: { title: true, ownerId: true },
    });
    if (!artwork) return NextResponse.json({ error: 'Hittades inte' }, { status: 404 });
    await prisma.$transaction([
      prisma.artwork.update({ where: { id }, data: { removedByAdmin: false, isPublished: true } }),
      prisma.notification.create({
        data: {
          userId: artwork.ownerId,
          type: 'artwork_restored',
          ...notificationText('artwork_restored', { title: artwork.title }),
          link: `/artworks/${id}`,
        },
      }),
    ]);
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('[admin/artworks PATCH]', err);
    return NextResponse.json({ error: 'Kunde inte återställa konstverket' }, { status: 500 });
  }
}
