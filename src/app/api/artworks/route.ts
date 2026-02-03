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

    const where = ownerId ? { ownerId } : {};

    const list = await prisma.artwork.findMany({
      where,
      where: { isPublished: true },
      orderBy: { createdAt: 'desc' }
    });
    return NextResponse.json(list);
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
