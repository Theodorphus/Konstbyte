import { NextRequest, NextResponse } from 'next/server';
import prisma from '../../../../lib/prisma';
import { getCurrentUser } from '../../../../lib/auth';
import { tooManyRequests, notifyOnce, since, MINUTE, HOUR, DAY } from '@/lib/rate-limit';
import { newMessageEmail, sendEmail } from '@/lib/email';
import { APP_URL } from '@/lib/urls';

const EMAIL_EVERY = 3 * HOUR;

const MAX_MESSAGES = 200;

// GET /api/messages/[userId] — get conversation between current user and userId
export async function GET(req: NextRequest, { params }: { params: Promise<{ userId: string }> }) {
  const { userId } = await params;
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  // The newest messages only, so a long conversation stays fast; shown oldest first.
  const newestFirst = await prisma.message.findMany({
    where: {
      OR: [
        { senderId: user.id, recipientId: userId },
        { senderId: userId, recipientId: user.id },
      ],
    },
    orderBy: { createdAt: 'desc' },
    take: MAX_MESSAGES,
    include: {
      sender: { select: { id: true, name: true, image: true } },
    },
  });
  const messages = newestFirst.reverse();

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
  // A deleted account has no email left; nobody can read messages sent to it.
  if (!recipient || !recipient.email) return NextResponse.json({ error: 'Användaren hittades inte' }, { status: 404 });

  const message = await prisma.message.create({
    data: { senderId: user.id, recipientId: userId, content: content.trim() },
    include: { sender: { select: { id: true, name: true, image: true } } },
  });

  // Email the recipient too (buyers' questions were easy to miss), but at most
  // once per conversation every few hours so a chat doesn't flood their inbox.
  const recentFromSender = await prisma.message.count({
    where: { senderId: user.id, recipientId: userId, id: { not: message.id }, createdAt: { gt: since(EMAIL_EVERY) } },
  });
  if (recentFromSender === 0 && recipient.email) {
    const mail = newMessageEmail({
      senderName: user.name || 'En användare',
      preview: message.content.length > 300 ? `${message.content.slice(0, 300)}…` : message.content,
      conversationUrl: `${APP_URL}/messages/${user.id}`,
    });
    await sendEmail({ to: recipient.email, ...mail }).catch((err) => console.error('[messages] email failed', err));
  }

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
