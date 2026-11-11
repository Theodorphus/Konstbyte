import { NextRequest, NextResponse } from 'next/server';
import prisma from '../../../lib/prisma';
import { getCurrentUser } from '../../../lib/auth';
import { isAllowedImageUrl } from '../../../lib/image-url';

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const full = await prisma.user.findUnique({
      where: { id: user.id },
      select: { id: true, name: true, email: true, image: true, bio: true, instagram: true },
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
    const { name, image, bio, instagram } = await request.json();
    if (image && image !== user.image && !isAllowedImageUrl(image)) {
      return NextResponse.json({ error: 'Ogiltig bildlänk' }, { status: 400 });
    }
    const handle = instagram ? String(instagram).trim().replace(/^@/, '') : '';
    if (handle && !/^[A-Za-z0-9._]{1,30}$/.test(handle)) {
      return NextResponse.json({ error: 'Ogiltigt Instagram-namn' }, { status: 400 });
    }
    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: {
        ...(name !== undefined ? { name: String(name || '').trim().slice(0, 80) || user.name } : {}),
        ...(image !== undefined ? { image: image || null } : {}),
        ...(bio !== undefined ? { bio: bio ? String(bio).slice(0, 1000) : null } : {}),
        ...(instagram !== undefined ? { instagram: handle || null } : {}),
      },
    });
    return NextResponse.json({
      id: updatedUser.id,
      name: updatedUser.name,
      email: updatedUser.email,
      image: updatedUser.image,
      bio: updatedUser.bio,
      instagram: updatedUser.instagram,
    });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 });
  }
}
