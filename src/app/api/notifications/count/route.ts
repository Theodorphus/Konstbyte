import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/route';
import prisma from '../../../../lib/prisma';

// GET - Unread notification count (polled by the nav bar every 30 s).
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    const userId = session?.user?.id;
    if (!userId) return NextResponse.json({ count: 0 });

    const count = await prisma.notification.count({ where: { userId, read: false } });
    return NextResponse.json({ count });
  } catch (error) {
    console.error('Error counting notifications:', error);
    return NextResponse.json({ count: 0 });
  }
}
