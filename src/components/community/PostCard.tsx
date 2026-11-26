'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { useTimeAgo } from '@/lib/use-time-ago';
import Image from 'next/image';
import { Link } from '@/i18n/navigation';
import ReactionBar from './ReactionBar';
import CommentSection from './CommentSection';
import ImageLightbox from './ImageLightbox';
import ReportButton from '@/components/ReportButton';

interface Author {
  id: string;
  name: string | null;
  image: string | null;
  email?: string | null;
}

interface ReactionCounts {
  like: number;
  heart: number;
  wow: number;
}

export interface PostData {
  id: string;
  content: string;
  imageUrl: string | null;
  createdAt: string;
  author: Author;
  reactions: ReactionCounts;
  userReaction: string | null;
  commentCount: number;
}

interface Props {
  post: PostData;
  currentUserEmail: string | null | undefined;
  currentUserId?: string | null;
  isAdmin?: boolean;
  onDelete: (postId: string) => void;
}

function AvatarCircle({ user, size = 'md' }: { user: Author; size?: 'sm' | 'md' }) {
  const dim = size === 'md' ? 'w-10 h-10' : 'w-8 h-8';
  const textSize = size === 'md' ? 'text-sm' : 'text-xs';
  const initials = user.name?.[0]?.toUpperCase() ?? '?';

  if (user.image) {
    return (
      <div className={`relative ${dim} rounded-full overflow-hidden flex-shrink-0`}>
        <Image src={user.image} alt={user.name ?? 'User'} fill className="object-cover" />
      </div>
    );
  }
  return (
    <div
      className={`${dim} rounded-full bg-gradient-to-br from-amber-200 to-stone-200 flex items-center justify-center flex-shrink-0 ${textSize} font-bold text-stone-700`}
    >
      {initials}
    </div>
  );
}

export default function PostCard({ post, currentUserEmail, currentUserId, isAdmin = false, onDelete }: Props) {
  const t = useTranslations('community');
  const timeAgo = useTimeAgo();
  const [reactions, setReactions] = useState<ReactionCounts>(post.reactions);
  const [userReaction, setUserReaction] = useState<string | null>(post.userReaction);
  const [commentCount, setCommentCount] = useState(post.commentCount);
  const [commentsOpen, setCommentsOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [lightboxOpen, setLightboxOpen] = useState(false);

  const isOwner = Boolean(currentUserId) && currentUserId === post.author.id;
  const canDelete = isOwner || isAdmin;

  async function handleReact(type: 'like' | 'heart' | 'wow') {
    // Optimistic update
    const wasActive = userReaction === type;
    const prevReactions = { ...reactions };
    const prevUserReaction = userReaction;

    setUserReaction(wasActive ? null : type);
    setReactions((prev) => ({
      ...prev,
      ...(wasActive
        ? { [type]: Math.max(0, prev[type] - 1) }
        : {
            ...(prevUserReaction ? { [prevUserReaction]: Math.max(0, prev[prevUserReaction as keyof ReactionCounts] - 1) } : {}),
            [type]: prev[type] + 1,
          }),
    }));

    try {
      const res = await fetch(`/api/posts/${post.id}/react`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type }),
      });
      if (res.ok) {
        const data = await res.json();
        setReactions(data.reactions);
        setUserReaction(data.userReaction);
      } else if (res.status === 401) {
        // Revert
        setReactions(prevReactions);
        setUserReaction(prevUserReaction);
        alert(t('sign_in_to_react'));
      }
    } catch {
      setReactions(prevReactions);
      setUserReaction(prevUserReaction);
    }
  }

  async function handleDelete() {
    if (!confirm(t('delete_post_confirm'))) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/posts/${post.id}`, { method: 'DELETE' });
      if (res.ok) onDelete(post.id);
      else alert(t('delete_post_error'));
    } finally {
      setDeleting(false);
    }
  }

  return (
    <article className="bg-white/90 rounded-2xl border border-slate-200/70 shadow-sm hover:shadow-md transition-shadow duration-200 overflow-hidden">
      {/* Header */}
      <div className="flex items-start justify-between px-5 pt-5 pb-3">
        <Link href={`/users/${post.author.id}`} className="flex items-center gap-3 group">
          <AvatarCircle user={post.author} />
          <div>
            <p className="text-sm font-semibold text-slate-900 group-hover:text-amber-800 transition-colors">
              {post.author.name ?? t('anonymous')}
            </p>
            <p className="text-xs text-slate-400">{timeAgo(post.createdAt)}</p>
          </div>
        </Link>
        {canDelete ? (
          <button
            onClick={handleDelete}
            disabled={deleting}
            className="text-xs text-slate-300 hover:text-red-500 transition-colors px-2 py-1 rounded-lg hover:bg-red-50"
          >
            {deleting ? '…' : t('delete')}
          </button>
        ) : (
          <ReportButton type="post" id={post.id} />
        )}
      </div>

      {/* Content */}
      <div className="px-5 pb-3">
        <p className="text-sm text-slate-800 leading-relaxed whitespace-pre-wrap break-words">
          {post.content}
        </p>
      </div>

      {/* Image */}
      {post.imageUrl && (
        <>
          <button
            type="button"
            onClick={() => setLightboxOpen(true)}
            className="relative w-full aspect-[4/3] bg-stone-100 overflow-hidden block group cursor-zoom-in"
            aria-label={t('enlarge_image')}
          >
            <Image
              src={post.imageUrl}
              alt={t('post_image_alt')}
              fill
              className="object-cover transition-transform duration-300 group-hover:scale-[1.02]"
              sizes="(max-width: 672px) 100vw, 672px"
            />
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-200 flex items-center justify-center">
              <span className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 bg-black/40 text-white text-xs font-medium px-3 py-1.5 rounded-full">
                Klicka för att förstora
              </span>
            </div>
          </button>
          {lightboxOpen && (
            <ImageLightbox
              src={post.imageUrl}
              alt={t('post_image_alt')}
              onClose={() => setLightboxOpen(false)}
            />
          )}
        </>
      )}

      {/* Reactions */}
      <div className="px-5 py-3">
        <ReactionBar
          reactions={reactions}
          userReaction={userReaction}
          commentCount={commentCount}
          onReact={handleReact}
          onToggleComments={() => setCommentsOpen((o) => !o)}
          commentsOpen={commentsOpen}
        />
      </div>

      {/* Comments */}
      {commentsOpen && (
        <div className="px-5 pb-5 border-t border-slate-100 pt-0">
          <CommentSection
            postId={post.id}
            currentUserEmail={currentUserEmail}
            currentUserId={currentUserId}
            postAuthorId={post.author.id}
            isAdmin={isAdmin}
          />
        </div>
      )}
    </article>
  );
}
