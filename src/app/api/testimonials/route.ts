import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '../../../lib/auth';
import { promises as fs } from 'fs';
import path from 'path';

const DATA_PATH = path.join(process.cwd(), 'data', 'testimonials.json');

export async function GET() {
  try {
    const raw = await fs.readFile(DATA_PATH, 'utf8');
    const items = JSON.parse(raw || '[]');
    return NextResponse.json(items);
  } catch (error) {
    console.error('Error reading testimonials:', error);
    return NextResponse.json([], { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { text, author } = body;
    if (!text || !author) return NextResponse.json({ error: 'Missing fields' }, { status: 400 });

    const raw = await fs.readFile(DATA_PATH, 'utf8');
    const items = JSON.parse(raw || '[]');
    const id = String(Date.now());
    const item = { id, text, author };
    items.unshift(item);
    await fs.writeFile(DATA_PATH, JSON.stringify(items, null, 2), 'utf8');
    return NextResponse.json(item, { status: 201 });
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

    const raw = await fs.readFile(DATA_PATH, 'utf8');
    const items = JSON.parse(raw || '[]') as Array<{ id: string }>;
    const filtered = items.filter((it) => it.id !== id);
    await fs.writeFile(DATA_PATH, JSON.stringify(filtered, null, 2), 'utf8');
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('Error deleting testimonial:', error);
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}
