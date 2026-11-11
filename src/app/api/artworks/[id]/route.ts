import { NextRequest, NextResponse } from 'next/server';
import { isAllowedImageUrl } from '@/lib/image-url';
import prisma from '../../../../lib/prisma';
import { getCurrentUser } from '../../../../lib/auth';
import { parseArtworkPrice, MIN_ARTWORK_PRICE, MAX_ARTWORK_PRICE } from '../../../../lib/payout';

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
          },
        },
      },
    });
    if (!artwork) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json(artwork);
  } catch (err) {
    console.error('[artworks/[id]]', err);
    return NextResponse.json({ error: 'Något gick fel. Försök igen.' }, { status: 500 });
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

    let price: number | undefined;
    if (body.price !== undefined && body.price !== null && body.price !== '') {
      const parsed = parseArtworkPrice(body.price);
      if (parsed === null) {
        return NextResponse.json(
          { error: `Priset måste vara mellan ${MIN_ARTWORK_PRICE} och ${MAX_ARTWORK_PRICE.toLocaleString('sv-SE')} kr` },
          { status: 400 },
        );
      }
      price = parsed;
    }
    if (body.imageUrl !== undefined && !isAllowedImageUrl(body.imageUrl)) {
      return NextResponse.json({ error: 'Ogiltig bildlänk' }, { status: 400 });
    }
    if (body.title !== undefined && !String(body.title).trim()) {
      return NextResponse.json({ error: 'Titel krävs' }, { status: 400 });
    }

    // A sold artwork, or one a buyer is paying for right now, must keep the price
    // and image the buyer saw.
    const changesSale =
      (price !== undefined && price !== existingArtwork.price) ||
      (body.imageUrl !== undefined && body.imageUrl !== existingArtwork.imageUrl);
    if (changesSale) {
      const locked =
        existingArtwork.isSold ||
        (await prisma.order.count({
          where: { artworkId: id, status: { in: ['pending', 'payment_processing', 'awaiting_swish'] }, createdAt: { gt: new Date(Date.now() - 24 * 60 * 60 * 1000) } },
        })) > 0;
      if (locked) {
        return NextResponse.json(
          { error: 'Pris och bild kan inte ändras på ett sålt verk eller medan ett köp pågår.' },
          { status: 409 },
        );
      }
    }

    const artwork = await prisma.artwork.update({
      where: { id },
      data: {
        title: body.title !== undefined ? String(body.title).trim().slice(0, 200) : undefined,
        description: body.description == null ? body.description : String(body.description).slice(0, 5000),
        price,
        imageUrl: body.imageUrl,
        category: body.category,
        isPublished: body.isPublished
      },
      include: {
        owner: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });
    return NextResponse.json(artwork);
  } catch (err) {
    console.error('[artworks/[id]]', err);
    return NextResponse.json({ error: 'Något gick fel. Försök igen.' }, { status: 500 });
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
    console.error('[artworks/[id]]', err);
    return NextResponse.json({ error: 'Något gick fel. Försök igen.' }, { status: 500 });
  }
}

