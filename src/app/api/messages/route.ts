import { NextResponse } from 'next/server';
import prisma from '../../../lib/prisma';
import { getCurrentUser } from '../../../lib/auth';

// GET /api/messages — get all conversations (one entry per unique counterpart)
export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    // Fetch all messages + unread counts in two parallel queries (avoids N+1)
    const [messages, unreadGroups] = await Promise.all([
      prisma.message.findMany({
        where: { OR: [{ senderId: user.id }, { recipientId: user.id }] },
        orderBy: { createdAt: 'desc' },
        include: {
          sender:    { select: { id: true, name: true, email: true, image: true } },
          recipient: { select: { id: true, name: true, email: true, image: true } },
        },
      }),
      prisma.message.groupBy({
        by: ['senderId'],
        where: { recipientId: user.id, read: false },
        _count: { id: true },
      }),
    ]);

    // Build a map of senderId → unread count for O(1) lookup
    const unreadByUser = new Map(
      unreadGroups.map((g) => [g.senderId, g._count.id])
    );

    // One conversation entry per unique counterpart (messages are sorted desc)
    const seen = new Set<string>();
    const conversations = [];
    for (const msg of messages) {
      const other = msg.senderId === user.id ? msg.recipient : msg.sender;
      if (!seen.has(other.id)) {
        seen.add(other.id);
        conversations.push({
          other,
          lastMessage: msg,
          unread: unreadByUser.get(other.id) ?? 0,
        });
      }
    }

    return NextResponse.json(conversations);
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
