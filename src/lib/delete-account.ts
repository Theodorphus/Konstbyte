import prisma from './prisma';

// Account deletion (GDPR "right to erasure").
//
// Orders and payouts must be kept for seven years (bokföringslagen), and they
// point at the user row, so the row itself stays — but everything that
// identifies the person is wiped and they can no longer sign in. All their
// own content (artworks without orders, posts, comments, messages, …) is
// deleted. Deletion is refused while an order is still in progress, so
// nobody loses money or a parcel halfway through.

const IN_PROGRESS = ['payment_processing', 'awaiting_swish', 'completed', 'paid'];
const PAYOUT_PENDING = ['unpaid', 'awaiting_stripe', 'on_hold'];

export const DELETED_USER_NAME = 'Raderad användare';

/** Orders that must finish before the account can be deleted. */
export async function openOrderCount(userId: string, now = new Date()): Promise<number> {
  const dayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  return prisma.order.count({
    where: {
      OR: [
        { OR: [{ buyerId: userId }, { sellerId: userId }], status: { in: IN_PROGRESS } },
        { OR: [{ buyerId: userId }, { sellerId: userId }], status: 'pending', createdAt: { gt: dayAgo } },
        { sellerId: userId, status: 'delivered', sellerPayoutStatus: { in: PAYOUT_PENDING } },
      ],
    },
  });
}

export type DeleteAccountResult = { ok: true } | { ok: false; reason: 'open_orders'; count: number };

export async function deleteAccount(userId: string): Promise<DeleteAccountResult> {
  const open = await openOrderCount(userId);
  if (open > 0) return { ok: false, reason: 'open_orders', count: open };

  const user = await prisma.user.findUnique({ where: { id: userId }, select: { email: true } });
  if (!user) return { ok: true };

  const [artworks, posts, submissions] = await Promise.all([
    prisma.artwork.findMany({ where: { ownerId: userId }, select: { id: true, _count: { select: { orders: true } } } }),
    prisma.post.findMany({ where: { authorId: userId }, select: { id: true } }),
    prisma.challengeSubmission.findMany({ where: { artistId: userId }, select: { id: true } }),
  ]);
  // Artworks that were sold stay (hidden) for the order history; the rest go.
  const removableArtworks = artworks.filter((a) => a._count.orders === 0).map((a) => a.id);
  const keptArtworks = artworks.filter((a) => a._count.orders > 0).map((a) => a.id);
  const postIds = posts.map((p) => p.id);
  const submissionIds = submissions.map((s) => s.id);

  await prisma.$transaction([
    // Sign-in
    prisma.session.deleteMany({ where: { userId } }),
    prisma.account.deleteMany({ where: { userId } }),
    ...(user.email ? [prisma.verificationToken.deleteMany({ where: { identifier: user.email } })] : []),

    // Social
    prisma.notification.deleteMany({ where: { userId } }),
    prisma.follow.deleteMany({ where: { OR: [{ followerId: userId }, { followingId: userId }] } }),
    prisma.message.deleteMany({ where: { OR: [{ senderId: userId }, { recipientId: userId }] } }),
    prisma.postReaction.deleteMany({ where: { userId } }),
    prisma.comment.deleteMany({ where: { OR: [{ authorId: userId }, { postId: { in: postIds } }] } }),
    prisma.post.deleteMany({ where: { id: { in: postIds } } }),

    // Challenges
    prisma.challengeLike.deleteMany({ where: { OR: [{ userId }, { submissionId: { in: submissionIds } }] } }),
    prisma.challengeSubmission.deleteMany({ where: { id: { in: submissionIds } } }),
    prisma.challengePoints.deleteMany({ where: { userId } }),

    // Art
    prisma.favorite.deleteMany({ where: { OR: [{ userId }, { artworkId: { in: removableArtworks } }] } }),
    prisma.collection.deleteMany({ where: { artistId: userId } }),
    prisma.artwork.deleteMany({ where: { id: { in: removableArtworks } } }),
    prisma.artwork.updateMany({ where: { id: { in: keptArtworks } }, data: { isPublished: false } }),
    prisma.artValuationLog.deleteMany({ where: { userId } }),

    // The person
    prisma.user.update({
      where: { id: userId },
      data: {
        name: DELETED_USER_NAME,
        email: null,
        emailVerified: null,
        image: null,
        bio: null,
        instagram: null,
        stripeAccountId: null,
        stripeOnboardingDone: false,
        // A sole trader's organisation number is their personal identity number.
        businessName: null,
        businessOrgNr: null,
      },
    }),
  ]);

  return { ok: true };
}
