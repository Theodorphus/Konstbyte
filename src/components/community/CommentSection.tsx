'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { Link } from '@/i18n/navigation';

interface Author {
  id: string;
  name: string | null;
  image: string | null;
  email: string;
}

interface Comment {
  id: string;
  content: string;
  createdAt: string;
  author: Author;
}

interface Props {
  postId: string;
  currentUserEmail: string | null | undefined;
}

function timeAgo(dateString: string) {
  const now = Date.now();
  const then = new Date(dateString).getTime();
  const diff = Math.floor((now - then) / 1000);
  if (diff < 60) return 'just nu';
  if (diff < 3600) return `${Math.floor(diff / 60)} min sedan`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} tim sedan`;
  return new Date(dateString).toLocaleDateString('sv-SE', { day: 'numeric', month: 'short' });
}

function AvatarCircle({ user }: { user: Author }) {
  const initials = user.name?.[0]?.toUpperCase() ?? user.email[0].toUpperCase();
  if (user.image) {
    return (
      <div className="relative w-8 h-8 rounded-full overflow-hidden flex-shrink-0">
        <Image src={user.image} alt={user.name ?? 'User'} fill className="object-cover" />
      </div>
    );
  }
  return (
    <div className="w-8 h-8 rounded-full bg-stone-200 flex items-center justify-center flex-shrink-0 text-xs font-semibold text-stone-600">
      {initials}
    </div>
  );
}

export default function CommentSection({ postId, currentUserEmail }: Props) {
  const [comments, setComments] = useState<Comment[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [input, setInput] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetch(`/api/posts/${postId}/comments`)
      .then((r) => r.json())
      .then((data) => { if (!cancelled && Array.isArray(data)) setComments(data); })
      .catch(() => { if (!cancelled) setComments([]); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [postId]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!input.trim()) return;
    setSubmitting(true);
    try {
      const res = await fetch(`/api/posts/${postId}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: input.trim() }),
      });
      if (res.ok) {
        const newComment: Comment = await res.json();
        setComments((prev) => [newComment, ...(prev ?? [])]);
        setInput('');
      } else if (res.status === 401) {
        alert('Du måste vara inloggad för att kommentera');
      }
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDeleteComment(commentId: string) {
    if (!confirm('Ta bort kommentaren?')) return;
    const res = await fetch(`/api/comments/${commentId}`, { method: 'DELETE' });
    if (res.ok) setComments((prev) => (prev ?? []).filter((c) => c.id !== commentId));
  }

  if (loading) {
    return <div className="py-3 text-center text-xs text-slate-400">Laddar kommentarer…</div>;
  }

  return (
    <div className="pt-3 space-y-3">
      {/* Composer */}
      {currentUserEmail && (
        <form onSubmit={handleSubmit} className="flex items-center gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Skriv en kommentar…"
            className="flex-1 rounded-full border border-stone-200 bg-stone-50 px-4 py-2 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-300 focus:border-transparent transition"
            disabled={submitting}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSubmit(e as unknown as React.FormEvent);
              }
            }}
          />
          <button
            type="submit"
            disabled={!input.trim() || submitting}
            className="px-4 py-2 rounded-full bg-amber-400 text-slate-900 text-xs font-semibold disabled:opacity-50 hover:bg-amber-300 transition-colors"
          >
            Skicka
          </button>
        </form>
      )}

      {/* Comments list */}
      {comments && comments.length === 0 && (
        <p className="text-center text-xs text-slate-400 py-2">
          Inga kommentarer ännu — var först!
        </p>
      )}
      <div className="space-y-2">
        {(comments ?? []).map((comment) => (
          <div key={comment.id} className="flex items-start gap-2.5 group">
            <Link href={`/users/${comment.author.id}`} className="flex-shrink-0 mt-0.5">
              <AvatarCircle user={comment.author} />
            </Link>
            <div className="flex-1 min-w-0">
              <div className="bg-stone-50 rounded-2xl px-3.5 py-2.5">
                <div className="flex items-center justify-between gap-2 mb-0.5">
                  <Link
                    href={`/users/${comment.author.id}`}
                    className="text-xs font-semibold text-slate-900 hover:underline truncate"
                  >
                    {comment.author.name ?? 'Anonym'}
                  </Link>
                  {currentUserEmail === comment.author.email && (
                    <button
                      onClick={() => handleDeleteComment(comment.id)}
                      className="text-xs text-slate-300 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                    >
                      ✕
                    </button>
                  )}
                </div>
                <p className="text-sm text-slate-700 whitespace-pre-wrap break-words">{comment.content}</p>
              </div>
              <p className="text-xs text-slate-400 mt-0.5 ml-3">{timeAgo(comment.createdAt)}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
