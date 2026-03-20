'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import PostComposer from '@/components/community/PostComposer';
import PostCard, { type PostData } from '@/components/community/PostCard';
import { useTranslations } from 'next-intl';

export default function CommunityPage() {
  const { data: session } = useSession();
  const t = useTranslations('community');
  const [posts, setPosts] = useState<PostData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  function loadPosts() {
    setLoading(true);
    setError(false);
    fetch('/api/posts')
      .then((r) => { if (!r.ok) throw new Error(); return r.json(); })
      .then((data) => { if (Array.isArray(data)) setPosts(data); })
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }

  useEffect(() => { loadPosts(); }, []);

  function handleNewPost(post: PostData) {
    setPosts((prev) => [post, ...prev]);
  }

  function handleDeletePost(postId: string) {
    setPosts((prev) => prev.filter((p) => p.id !== postId));
  }

  const currentUserEmail = session?.user?.email;
  const currentUserName = session?.user?.name;
  const currentUserImage = session?.user?.image;

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">
      {/* Header */}
      <div className="space-y-1">
        <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Konstbyte</p>
        <h1 className="font-display text-3xl md:text-4xl text-slate-900">{t('title')}</h1>
        <p className="text-slate-500 text-sm">
          {t('tagline')}
        </p>
      </div>

      {/* Composer */}
      {currentUserEmail ? (
        <PostComposer
          currentUserEmail={currentUserEmail}
          currentUserName={currentUserName}
          currentUserImage={currentUserImage}
          onPost={handleNewPost}
        />
      ) : (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 text-center space-y-2">
          <p className="text-sm font-medium text-amber-900">
            {t('sign_in_to_post')}
          </p>
          <a
            href="/api/auth/signin"
            className="inline-flex items-center rounded-full bg-amber-400 px-5 py-2 text-sm font-semibold text-slate-900 hover:bg-amber-300 transition-colors"
          >
            {t('sign_in_btn')}
          </a>
        </div>
      )}

      {/* Feed */}
      {error ? (
        <div className="rounded-2xl border border-red-100 bg-red-50/80 p-8 text-center space-y-3">
          <p className="font-medium text-red-700">{t('load_error')}</p>
          <button
            onClick={loadPosts}
            className="inline-flex items-center rounded-full bg-slate-900 px-5 py-2 text-sm font-semibold text-white hover:bg-slate-800 transition-colors"
          >
            {t('retry')}
          </button>
        </div>
      ) : loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white/90 rounded-2xl border border-slate-200/70 p-5 space-y-3 animate-pulse">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-stone-100" />
                <div className="space-y-1.5">
                  <div className="h-3 w-28 rounded-full bg-stone-100" />
                  <div className="h-2.5 w-16 rounded-full bg-stone-100" />
                </div>
              </div>
              <div className="space-y-2">
                <div className="h-3 w-full rounded-full bg-stone-100" />
                <div className="h-3 w-3/4 rounded-full bg-stone-100" />
              </div>
            </div>
          ))}
        </div>
      ) : posts.length === 0 ? (
        <div className="bg-white/90 rounded-2xl border border-slate-200/70 p-12 text-center space-y-3">
          <p className="text-3xl">🎨</p>
          <p className="font-semibold text-slate-700">{t('no_posts')}</p>
          <p className="text-sm text-slate-400">{t('no_posts_sub')}</p>
        </div>
      ) : (
        <div className="space-y-4">
          {posts.map((post) => (
            <PostCard
              key={post.id}
              post={post}
              currentUserEmail={currentUserEmail}
              onDelete={handleDeletePost}
            />
          ))}
        </div>
      )}
    </div>
  );
}
