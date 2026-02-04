import { Prisma } from '@prisma/client';
import { NextRequest, NextResponse } from 'next/server';
import prisma from '../../../lib/prisma';

// POST to create, GET to list artworks
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { title, description, price, imageUrl, ownerId, category } = body;
    if (!title || !price || !imageUrl || !ownerId) {
      return NextResponse.json({ error: 'missing fields' }, { status: 400 });
    }
    const artwork = await prisma.artwork.create({
      data: { 
        title, 
        description, 
        price: Number(price), 
        imageUrl, 
        ownerId,
        category: category || 'malningar'
      }
    });
    return NextResponse.json(artwork);
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const ownerId = searchParams.get('ownerId');
    const search = searchParams.get('search') || undefined;
    const category = searchParams.get('category') || undefined;
    const minPrice = searchParams.get('minPrice') ? parseFloat(searchParams.get('minPrice')!) : undefined;
    const maxPrice = searchParams.get('maxPrice') ? parseFloat(searchParams.get('maxPrice')!) : undefined;
    const sortBy = searchParams.get('sortBy') || 'newest';

    const page = parseInt(searchParams.get('page') || '1', 10);
    const take = parseInt(searchParams.get('take') || '12', 10);
    const skip = (Math.max(page, 1) - 1) * take;

    // Build dynamic where clause
    const where: Prisma.ArtworkWhereInput = { isPublished: true };
    if (ownerId) where.ownerId = ownerId;
    if (category) where.category = category;
    if (minPrice !== undefined || maxPrice !== undefined) {
      where.price = {
        ...(minPrice !== undefined ? { gte: minPrice } : {}),
        ...(maxPrice !== undefined ? { lte: maxPrice } : {}),
      };
    }
    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    const orderBy: Prisma.ArtworkOrderByWithRelationInput =
      sortBy === 'price-asc'
        ? { price: 'asc' }
        : sortBy === 'price-desc'
        ? { price: 'desc' }
        : sortBy === 'name'
        ? { title: 'asc' }
        : { createdAt: 'desc' };

    const [list, total] = await Promise.all([
      prisma.artwork.findMany({
        where,
        orderBy,
        skip,
        take,
      }),
      prisma.artwork.count({ where }),
    ]);

    return NextResponse.json({ items: list, total });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
