import { NextRequest, NextResponse } from 'next/server';
import prisma from '../../../lib/prisma';
import { getCurrentUser } from '../../../lib/auth';
import { Prisma } from '@prisma/client';

const MAX_TAKE = 100;

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Du måste vara inloggad' }, { status: 401 });
    }

    const body = await request.json();
    const { title, description, price, imageUrl, category,
            shippingType, shippingCost, shippingArea, shippingCarrier } = body;

    if (!title || price == null || !imageUrl) {
      return NextResponse.json({ error: 'Saknade obligatoriska fält' }, { status: 400 });
    }

    const parsedPrice = Number(price);
    if (isNaN(parsedPrice) || parsedPrice < 0) {
      return NextResponse.json({ error: 'Ogiltigt pris' }, { status: 400 });
    }

    const artwork = await prisma.artwork.create({
      data: {
        title: String(title).trim(),
        description: description ? String(description).trim() : null,
        price: parsedPrice,
        imageUrl: String(imageUrl),
        ownerId: user.id, // Always from session — never trust client-supplied ownerId
        category: category || 'malningar',
        shippingType: shippingType || 'overenskommes',
        shippingCost: shippingCost != null ? Number(shippingCost) : null,
        shippingArea: shippingArea ? String(shippingArea).trim() : null,
        shippingCarrier: shippingCarrier ? String(shippingCarrier).trim() : null,
      },
    });

    return NextResponse.json(artwork, { status: 201 });
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const ownerId  = searchParams.get('ownerId');
    const search   = searchParams.get('search') || undefined;
    const category = searchParams.get('category') || undefined;
    const minPrice = searchParams.get('minPrice') ? parseFloat(searchParams.get('minPrice')!) : undefined;
    const maxPrice = searchParams.get('maxPrice') ? parseFloat(searchParams.get('maxPrice')!) : undefined;
    const sortBy   = searchParams.get('sortBy') || 'newest';

    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const take = Math.min(MAX_TAKE, Math.max(1, parseInt(searchParams.get('take') || '12', 10)));
    const skip = (page - 1) * take;

    const where: Record<string, unknown> = { isPublished: true };
    if (ownerId)  where.ownerId  = ownerId;
    if (category) where.category = category;
    if (minPrice !== undefined) where.price = { ...(where.price as object || {}), gte: minPrice };
    if (maxPrice !== undefined) where.price = { ...(where.price as object || {}), lte: maxPrice };
    if (search) {
      where.OR = [
        { title:       { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    const orderBy: Prisma.ArtworkOrderByWithRelationInput =
      sortBy === 'price-asc'  ? { price: 'asc' }  :
      sortBy === 'price-desc' ? { price: 'desc' } :
      sortBy === 'name'       ? { title: 'asc' }  :
      { createdAt: 'desc' };

    const [list, total] = await Promise.all([
      prisma.artwork.findMany({ where, orderBy, skip, take }),
      prisma.artwork.count({ where }),
    ]);

    return NextResponse.json({ items: list, total });
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
