import { NextRequest, NextResponse } from 'next/server';
import prisma from '../../../../lib/prisma';
import { getCurrentUser } from '../../../../lib/auth';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const artwork = await prisma.artwork.findUnique({
      where: { id },
      include: {
        owner: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });
    if (!artwork) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json(artwork);
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();

    // Check ownership
    const existingArtwork = await prisma.artwork.findUnique({
      where: { id },
    });

    if (!existingArtwork) {
      return NextResponse.json({ error: 'Artwork not found' }, { status: 404 });
    }

    if (existingArtwork.ownerId !== user.id) {
      return NextResponse.json(
        { error: 'You can only edit your own artworks' },
        { status: 403 }
      );
    }

    const artwork = await prisma.artwork.update({
      where: { id },
      data: {
        title: body.title,
        description: body.description,
        price: body.price ? Number(body.price) : undefined,
        imageUrl: body.imageUrl,
        category: body.category,
        isPublished: body.isPublished
      },
      include: {
        owner: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });
    return NextResponse.json(artwork);
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    const artwork = await prisma.artwork.findUnique({
      where: { id },
      include: {
        orders: true,
      },
    });

    if (!artwork) {
      return NextResponse.json({ error: 'Artwork not found' }, { status: 404 });
    }

    if (artwork.ownerId !== user.id) {
      return NextResponse.json(
        { error: 'You can only delete your own artworks' },
        { status: 403 }
      );
    }

    // Check if artwork has orders
    if (artwork.orders.length > 0) {
      return NextResponse.json(
        { error: 'Cannot delete artwork with existing orders' },
        { status: 400 }
      );
    }

    await prisma.artwork.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

