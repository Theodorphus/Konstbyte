import { NextRequest, NextResponse } from 'next/server';
import prisma from '../../../../lib/prisma';
import { getCurrentUser } from '../../../../lib/auth';

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
      sender: { select: { id: true, name: true, email: true, image: true } },
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

  const { content } = await req.json();
  if (!content?.trim()) return NextResponse.json({ error: 'Tomt meddelande' }, { status: 400 });

  // Verify recipient exists
  const recipient = await prisma.user.findUnique({ where: { id: userId } });
  if (!recipient) return NextResponse.json({ error: 'Användaren hittades inte' }, { status: 404 });

  const message = await prisma.message.create({
    data: { senderId: user.id, recipientId: userId, content: content.trim() },
    include: { sender: { select: { id: true, name: true, email: true, image: true } } },
  });

  // Send notification to recipient
  await prisma.notification.create({
    data: {
      userId: userId,
      type: 'message',
      message: `${user.name || user.email} skickade dig ett meddelande`,
      link: `/messages/${user.id}`,
    },
  });

  return NextResponse.json(message, { status: 201 });
}
