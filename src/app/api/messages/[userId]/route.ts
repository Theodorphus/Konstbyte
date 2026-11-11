import { NextRequest, NextResponse } from 'next/server';
import prisma from '../../../../lib/prisma';
import { getCurrentUser } from '../../../../lib/auth';
import { tooManyRequests, notifyOnce, since, MINUTE, DAY } from '@/lib/rate-limit';

// GET /api/messages/[userId] — get conversation between current user and userId
export async function GET(req: NextRequest, { params }: { params: Promise<{ userId: string }> }) {
  const { userId } = await params;
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const messages = await prisma.message.findMany({
    where: {
      OR: [
        { senderId: user.id, recipientId: userId },
        { senderId: userId, recipientId: user.id },
      ],
    },
    orderBy: { createdAt: 'asc' },
    include: {
      sender: { select: { id: true, name: true, image: true } },
    },
  });

  // Mark incoming messages as read
  await prisma.message.updateMany({
    where: { senderId: userId, recipientId: user.id, read: false },
    data: { read: true },
  });

  // Delete message notifications from this sender
  await prisma.notification.deleteMany({
    where: { userId: user.id, type: 'message', link: `/messages/${userId}` },
  });

  return NextResponse.json(messages);
}

// POST /api/messages/[userId] — send a message to userId
export async function POST(req: NextRequest, { params }: { params: Promise<{ userId: string }> }) {
  const { userId } = await params;
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  if (userId === user.id) return NextResponse.json({ error: 'Du kan inte skicka meddelanden till dig själv' }, { status: 400 });

  const { content } = await req.json();
  if (typeof content !== 'string' || !content.trim()) return NextResponse.json({ error: 'Tomt meddelande' }, { status: 400 });
  if (content.length > 5000) return NextResponse.json({ error: 'Meddelandet är för långt (max 5000 tecken)' }, { status: 400 });

  const [lastMinute, lastDay] = await Promise.all([
    prisma.message.count({ where: { senderId: user.id, createdAt: { gt: since(MINUTE) } } }),
    prisma.message.count({ where: { senderId: user.id, createdAt: { gt: since(DAY) } } }),
  ]);
  if (lastMinute >= 15 || lastDay >= 500) return tooManyRequests();

  // Verify recipient exists
  const recipient = await prisma.user.findUnique({ where: { id: userId } });
  if (!recipient) return NextResponse.json({ error: 'Användaren hittades inte' }, { status: 404 });

  const message = await prisma.message.create({
    data: { senderId: user.id, recipientId: userId, content: content.trim() },
    include: { sender: { select: { id: true, name: true, image: true } } },
  });

  // Notify the recipient — one unread notification per conversation is enough
  // (they are removed when the conversation is opened).
  await notifyOnce({
    userId,
    type: 'message',
    message: `${user.name || 'Någon'} skickade dig ett meddelande`,
    link: `/messages/${user.id}`,
  });

  return NextResponse.json(message, { status: 201 });
}
