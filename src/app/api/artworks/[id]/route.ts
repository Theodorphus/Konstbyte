import { NextRequest, NextResponse } from 'next/server';
import { isAllowedImageUrl } from '@/lib/image-url';
import prisma from '../../../../lib/prisma';
import { getCurrentUser } from '../../../../lib/auth';
import { parseArtworkPrice, parseShippingCost, MIN_ARTWORK_PRICE, MAX_ARTWORK_PRICE } from '../../../../lib/payout';
import { SHIPPING_OPTIONS } from '@/lib/shipping';
import { isAdmin } from '@/lib/admin';
import { blockingOrders, canOwnerRemove } from '@/lib/artwork-removal';

/** Rolls back an artwork delete when someone started buying it meanwhile. */
class OrderAppeared extends Error {}

const CATEGORIES = ['malningar', 'skulpturer', 'fotografi', 'digital'];
const SHIPPING_TYPES: string[] = SHIPPING_OPTIONS.map((o) => o.value);
const optionalText = (v: unknown) => (typeof v === 'string' && v.trim() ? v.trim().slice(0, 200) : null);

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
    if (!artwork.isPublished) {
      // Hidden artworks are only visible to their owner and admins.
      const user = await getCurrentUser();
      if (!user || (user.id !== artwork.ownerId && !isAdmin(user.email))) {
        return NextResponse.json({ error: 'Not found' }, { status: 404 });
      }
    }
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
    if (body.isPublished === true && existingArtwork.removedByAdmin && !isAdmin(user.email)) {
      return NextResponse.json(
        { error: 'Konstverket har tagits bort av Konstbyte och kan inte publiceras igen. Kontakta webbdevstudio@gmail.com om du tror att det är fel.' },
        { status: 403 },
      );
    }
    if (body.category !== undefined && !CATEGORIES.includes(body.category)) {
      return NextResponse.json({ error: 'Ogiltig kategori' }, { status: 400 });
    }

    // Shipping: only sent by the edit form; the type decides which extra field applies.
    let shipping: { shippingType: string; shippingCost: number | null; shippingArea: string | null; shippingCarrier: string | null } | undefined;
    if (body.shippingType !== undefined) {
      if (!SHIPPING_TYPES.includes(body.shippingType)) {
        return NextResponse.json({ error: 'Välj ett fraktsätt' }, { status: 400 });
      }
      const cost = body.shippingType === 'fixed' ? parseShippingCost(body.shippingCost) : null;
      if (cost === undefined) {
        return NextResponse.json({ error: 'Ogiltig fraktkostnad' }, { status: 400 });
      }
      shipping = {
        shippingType: body.shippingType,
        shippingCost: cost,
        shippingArea: body.shippingType === 'pickup' ? optionalText(body.shippingArea) : null,
        shippingCarrier: body.shippingType === 'other' ? optionalText(body.shippingCarrier) : null,
      };
    }

    // A sold artwork, or one a buyer is paying for right now, must keep the price
    // and image the buyer saw.
    const changesSale =
      (price !== undefined && price !== existingArtwork.price) ||
      (body.imageUrl !== undefined && body.imageUrl !== existingArtwork.imageUrl) ||
      (shipping !== undefined &&
        (shipping.shippingType !== existingArtwork.shippingType ||
          (shipping.shippingCost ?? 0) !== (existingArtwork.shippingCost ?? 0)));
    if (changesSale) {
      const locked =
        existingArtwork.isSold ||
        (await prisma.order.count({
          where: { artworkId: id, status: { in: ['pending', 'payment_processing', 'awaiting_swish'] }, createdAt: { gt: new Date(Date.now() - 24 * 60 * 60 * 1000) } },
        })) > 0;
      if (locked) {
        return NextResponse.json(
          { error: 'Pris, bild och frakt kan inte ändras på ett sålt verk eller medan ett köp pågår.' },
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
        isPublished: typeof body.isPublished === 'boolean' ? body.isPublished : undefined,
        technique: body.technique !== undefined ? optionalText(body.technique) : undefined,
        dimensions: body.dimensions !== undefined ? optionalText(body.dimensions) : undefined,
        ...shipping,
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
      include: { orders: { select: { status: true, createdAt: true } } },
    });

    if (!artwork) {
      return NextResponse.json({ error: 'Verket hittades inte' }, { status: 404 });
    }

    if (artwork.ownerId !== user.id) {
      return NextResponse.json({ error: 'Du kan bara ta bort dina egna verk' }, { status: 403 });
    }

    // Orders keep a reference to the artwork, so it can't be deleted once anyone
    // has tried to buy it. A real sale (or a payment in progress) blocks removal;
    // if every attempt was abandoned or refunded, the artwork is hidden instead.
    if (artwork.removedByAdmin) {
      return NextResponse.json(
        { error: 'Konstverket har tagits bort av Konstbyte. Kontakta webbdevstudio@gmail.com om du har frågor.' },
        { status: 403 },
      );
    }
    const blocked = NextResponse.json(
      { error: 'Verket har sålts eller håller på att köpas och kan inte tas bort.' },
      { status: 409 },
    );
    if (!canOwnerRemove(artwork)) return blocked;

    // The writes repeat the check, since a buyer may start a checkout meanwhile.
    if (artwork.orders.length > 0) {
      const hidden = await prisma.artwork.updateMany({
        where: { id, orders: { none: blockingOrders() } },
        data: { isPublished: false },
      });
      return hidden.count === 1 ? NextResponse.json({ success: true, hidden: true }) : blocked;
    }

    // Favorites don't cascade in the schema, so remove them first; undone if
    // an order turned up in the meantime.
    const deleted = await prisma
      .$transaction(async (tx) => {
        await tx.favorite.deleteMany({ where: { artworkId: id } });
        const result = await tx.artwork.deleteMany({ where: { id, orders: { none: {} } } });
        if (result.count === 0) throw new OrderAppeared();
        return true;
      })
      .catch((err) => {
        // An order inserted at the same moment can also surface as the
        // database's foreign-key error (P2003).
        if (err instanceof OrderAppeared || (err as { code?: string })?.code === 'P2003') return false;
        throw err;
      });
    return deleted ? NextResponse.json({ success: true }) : blocked;
  } catch (err) {
    console.error('[artworks/[id]]', err);
    return NextResponse.json({ error: 'Något gick fel. Försök igen.' }, { status: 500 });
  }
}

