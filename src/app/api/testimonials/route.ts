import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '../../../lib/auth';
import prisma from '../../../../lib/prisma';

export async function GET() {
  try {
    const items = await prisma.testimonial.findMany({ orderBy: { createdAt: 'desc' } });
    return NextResponse.json(items);
  } catch (error) {
    console.error('Error reading testimonials:', error);
    return NextResponse.json([], { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await request.json();
    const { text, author } = body;
    if (!text) return NextResponse.json({ error: 'Missing text' }, { status: 400 });

    const finalAuthor = author || user.name || user.email || 'Anonymous';
    const created = await prisma.testimonial.create({ data: { text, author: finalAuthor } });
    return NextResponse.json(created, { status: 201 });
  } catch (error) {
    console.error('Error writing testimonial:', error);
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    const allowed = (process.env.ADMIN_EMAILS || process.env.NEXT_PUBLIC_ADMIN_EMAIL || '').split(',').map((s) => s.trim()).filter(Boolean);
    if (!user || !user.email || !allowed.includes(user.email)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const body = await request.json();
    const { id } = body as { id?: string };
    if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 });

    await prisma.testimonial.deleteMany({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('Error deleting testimonial:', error);
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}
