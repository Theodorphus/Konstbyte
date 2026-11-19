"use client";

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { Link } from '@/i18n/navigation';
import { Button } from '@/components/ui/button';
import { useTranslations } from 'next-intl';

interface User {
  id: string;
  name: string | null;
  image: string | null;
  _count: {
    artworks: number;
    followers: number;
    following: number;
    posts: number;
  };
}

const SORTS = ['recent', 'followers', 'artworks'] as const;
type Sort = (typeof SORTS)[number];

export default function UsersSearchPage() {
  const t = useTranslations('users');
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [input, setInput] = useState('');
  // The search that the list currently shows ('' = all artists).
  const [query, setQuery] = useState('');
  const [sortBy, setSortBy] = useState<Sort>('recent');
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [followingIds, setFollowingIds] = useState<Set<string>>(new Set());

  // Start from the URL (?q=…&sortBy=…) so a search can be shared.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const q = (params.get('q') || '').slice(0, 100);
    const sort = params.get('sortBy') as Sort | null;
    setInput(q);
    setQuery(q);
    if (sort && SORTS.includes(sort)) setSortBy(sort);
    fetchCurrentUser();
  }, []);

  // Load the list whenever the search or sort changes, and keep the URL in step.
  useEffect(() => {
    let current = true;
    setLoading(true);
    const params = new URLSearchParams();
    if (query) params.set('q', query);
    if (sortBy !== 'recent') params.set('sortBy', sortBy);
    const qs = params.toString();
    window.history.replaceState(null, '', `${window.location.pathname}${qs ? `?${qs}` : ''}`);

    fetch(`/api/users/search?q=${encodeURIComponent(query)}&sortBy=${sortBy}`)
      .then((res) => (res.ok ? res.json() : { users: [] }))
      .then((data) => { if (current) setUsers(data.users ?? []); })
      .catch(() => { if (current) setUsers([]); })
      .finally(() => { if (current) setLoading(false); });
    return () => { current = false; };
  }, [query, sortBy]);

  const fetchCurrentUser = async () => {
    try {
      const res = await fetch('/api/me');
      if (!res.ok) return;
      const data = await res.json();
      const id: string | undefined = data?.user?.id;
      if (!id) return;
      setCurrentUserId(id);
      const followingRes = await fetch(`/api/users/${id}/following`);
      if (followingRes.ok) {
        const follows = (await followingRes.json()) as Array<{ following: { id: string } }>;
        setFollowingIds(new Set(follows.map((f) => String(f.following.id))));
      }
    } catch (error) {
      console.error('Failed to fetch current user:', error);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setQuery(input.trim());
  };

  const clearSearch = () => {
    setInput('');
    setQuery('');
  };

  const handleFollow = async (userId: string) => {
    try {
      const isFollowing = followingIds.has(userId);
      const res = await fetch(`/api/users/${userId}/follow`, {
        method: isFollowing ? 'DELETE' : 'POST',
      });
      if (res.ok) {
        setFollowingIds((prev) => {
          const next = new Set(prev);
          if (isFollowing) next.delete(userId);
          else next.add(userId);
          return next;
        });
        setUsers((prev) =>
          prev.map((u) =>
            u.id === userId
              ? { ...u, _count: { ...u._count, followers: u._count.followers + (isFollowing ? -1 : 1) } }
              : u,
          ),
        );
      }
    } catch (error) {
      console.error('Failed to toggle follow:', error);
    }
  };

  const sortButton = (value: Sort, label: string) => (
    <button
      key={value}
      onClick={() => setSortBy(value)}
      className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${
        sortBy === value ? 'bg-stone-900 text-white' : 'border border-stone-200 text-stone-600 hover:border-stone-400 hover:bg-stone-50'
      }`}
    >
      {label}
    </button>
  );

  return (
    <div className="max-w-5xl mx-auto py-8">
      <div className="mb-8 space-y-4">
        <h1 className="font-display text-3xl md:text-4xl text-slate-900">{t('find_artists')}</h1>

        <form onSubmit={handleSearch} className="flex gap-2">
          <input
            type="search"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={t('search_placeholder')}
            aria-label={t('search_placeholder')}
            maxLength={100}
            className="flex-grow px-4 py-2.5 border border-stone-200 rounded-xl bg-white text-sm focus:outline-none focus:ring-2 focus:ring-amber-400/50"
          />
          <Button type="submit" className="rounded-xl bg-slate-900 px-6 text-white hover:bg-slate-800">{t('search_btn')}</Button>
        </form>

        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm text-slate-500 mr-1">{t('sort_by')}</span>
          {sortButton('recent', t('sort_recent'))}
          {sortButton('followers', t('sort_followers'))}
          {sortButton('artworks', t('sort_artworks'))}
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="animate-pulse bg-white border border-stone-200 rounded-2xl p-6">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-slate-200 rounded-full" />
                <div className="flex-grow">
                  <div className="h-4 bg-slate-200 rounded w-1/2 mb-2" />
                  <div className="h-3 bg-slate-200 rounded w-1/3" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : users.length === 0 ? (
        <div className="text-center py-16 bg-white border border-stone-200 rounded-2xl">
          <div className="text-5xl mb-4">🔍</div>
          <h2 className="text-xl font-semibold mb-2">{query ? t('no_results_title') : t('no_users')}</h2>
          {query && <p className="text-slate-600 mb-6">{t('no_results_msg', { query })}</p>}
          <div className="flex gap-3 justify-center">
            {query ? (
              <Button variant="outline" onClick={clearSearch}>{t('clear_search')}</Button>
            ) : (
              <Button asChild>
                <Link href="/artworks">{t('explore_art')}</Link>
              </Button>
            )}
          </div>
        </div>
      ) : (
        <>
          <div className="mb-4 flex items-center justify-between gap-4 text-sm text-slate-600">
            <span>{query ? t('showing_results', { count: users.length, query }) : t('all_artists', { count: users.length })}</span>
            {query && (
              <button onClick={clearSearch} className="text-slate-500 underline-offset-2 hover:text-slate-900 hover:underline">
                {t('clear_search')}
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {users.map((user) => (
              <div key={user.id} className="bg-white border border-stone-200 rounded-2xl p-6 hover:shadow-md transition-shadow">
                <div className="flex items-start gap-4">
                  <Link href={`/users/${user.id}`} className="flex-shrink-0">
                    <div className="relative w-16 h-16 overflow-hidden rounded-full bg-gradient-to-br from-amber-200 to-stone-200 flex items-center justify-center text-stone-700 text-2xl font-semibold">
                      {user.image ? (
                        <Image src={user.image} alt={user.name ?? ''} fill sizes="64px" className="object-cover" />
                      ) : (
                        user.name?.[0]?.toUpperCase() || '?'
                      )}
                    </div>
                  </Link>
                  <div className="flex-grow min-w-0">
                    <Link href={`/users/${user.id}`} className="font-semibold text-lg hover:underline block truncate">
                      {user.name || t('anonymous')}
                    </Link>

                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-slate-600 mt-1 mb-3">
                      <span>{t('artworks_count', { count: user._count.artworks })}</span>
                      <span>{t('followers_count', { count: user._count.followers })}</span>
                      <span>{t('posts_count', { count: user._count.posts })}</span>
                    </div>

                    {currentUserId && currentUserId !== user.id && (
                      <Button
                        size="sm"
                        variant={followingIds.has(user.id) ? 'outline' : 'default'}
                        onClick={() => handleFollow(user.id)}
                        className="w-full"
                      >
                        {followingIds.has(user.id) ? t('following') : t('follow')}
                      </Button>
                    )}
                    {currentUserId === user.id && (
                      <Button size="sm" variant="outline" asChild className="w-full">
                        <Link href="/profile">{t('your_profile')}</Link>
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
