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

    const page = parseInt(searchParams.get('page') || '1', 10);
    const take = parseInt(searchParams.get('take') || '12', 10);
    const skip = (Math.max(page, 1) - 1) * take;

    const where = ownerId ? { ownerId, isPublished: true } : { isPublished: true };

    const [list, total] = await Promise.all([
      prisma.artwork.findMany({
        where,
        orderBy: { createdAt: 'desc' },
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
