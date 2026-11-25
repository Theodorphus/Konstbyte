import { NextRequest, NextResponse } from 'next/server';
import prisma from '../../../lib/prisma';
import { getCurrentUser } from '../../../lib/auth';
import { isAllowedImageUrl } from '../../../lib/image-url';
import { deleteAccount } from '@/lib/delete-account';
import { parseSellerDetails, SELLER_DETAILS_ERRORS } from '@/lib/seller';

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const full = await prisma.user.findUnique({
      where: { id: user.id },
      select: {
        id: true, name: true, email: true, image: true, bio: true, instagram: true,
        sellerType: true, businessName: true, businessOrgNr: true,
      },
    });
    return NextResponse.json(full);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch profile' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const body = await request.json();
    const { name, image, bio, instagram } = body;
    if (image && image !== user.image && !isAllowedImageUrl(image)) {
      return NextResponse.json({ error: 'Ogiltig bildlänk' }, { status: 400 });
    }
    const handle = instagram ? String(instagram).trim().replace(/^@/, '') : '';
    if (handle && !/^[A-Za-z0-9._]{1,30}$/.test(handle)) {
      return NextResponse.json({ error: 'Ogiltigt Instagram-namn' }, { status: 400 });
    }
    // Private person or business, sent together with the business details.
    let seller = {};
    if (body.sellerType !== undefined) {
      const parsed = parseSellerDetails(body);
      if (!parsed.ok) {
        return NextResponse.json({ error: SELLER_DETAILS_ERRORS[parsed.error], code: parsed.error }, { status: 400 });
      }
      seller = parsed.data;
    }
    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: {
        ...(name !== undefined ? { name: String(name || '').trim().slice(0, 80) || user.name } : {}),
        ...(image !== undefined ? { image: image || null } : {}),
        ...(bio !== undefined ? { bio: bio ? String(bio).slice(0, 1000) : null } : {}),
        ...(instagram !== undefined ? { instagram: handle || null } : {}),
        ...seller,
      },
    });
    return NextResponse.json({
      id: updatedUser.id,
      name: updatedUser.name,
      email: updatedUser.email,
      image: updatedUser.image,
      bio: updatedUser.bio,
      instagram: updatedUser.instagram,
      sellerType: updatedUser.sellerType,
      businessName: updatedUser.businessName,
      businessOrgNr: updatedUser.businessOrgNr,
    });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 });
  }
}

// DELETE /api/profile — delete the signed-in user's account (see lib/delete-account).
export async function DELETE(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const body = await request.json().catch(() => ({}));
    if (body?.confirm !== true) {
      return NextResponse.json({ error: 'Bekräftelse saknas' }, { status: 400 });
    }
    const result = await deleteAccount(user.id);
    if (!result.ok) {
      return NextResponse.json({ error: 'open_orders', count: result.count }, { status: 409 });
    }
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[profile DELETE]', error);
    return NextResponse.json({ error: 'Kunde inte radera kontot' }, { status: 500 });
  }
}
