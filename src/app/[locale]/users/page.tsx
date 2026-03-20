"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';

interface User {
  id: string;
  name: string | null;
  email: string;
  image: string | null;
  _count: {
    artworks: number;
    followers: number;
    following: number;
    posts: number;
  };
}

export default function UsersSearchPage() {
  const t = useTranslations('users');
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('recent');
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [followingIds, setFollowingIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetchCurrentUser();
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const query = params.get('q') || '';
    const sort = params.get('sortBy') || 'recent';
    setSearchQuery(query);
    setSortBy(sort);
    if (query) performSearch(query, sort);
  }, []);

  const fetchCurrentUser = async () => {
    try {
      const res = await fetch('/api/me');
      if (res.ok) {
        const data = await res.json();
        setCurrentUserId(data.id);
        
        // Fetch following list
        const followingRes = await fetch(`/api/users/${data.id}/following`);
        if (followingRes.ok) {
            const followingData = await followingRes.json();
            const follows = followingData as Array<{ following: { id: string } }>;
            const ids = new Set<string>(follows.map((f) => String(f.following.id)));
            setFollowingIds(ids);
        }
      }
    } catch (error) {
      console.error('Failed to fetch current user:', error);
    }
  };

  const performSearch = async (query: string, sort: string) => {
    if (!query.trim()) {
      setUsers([]);
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`/api/users/search?q=${encodeURIComponent(query)}&sortBy=${sort}`);
      if (res.ok) {
        const data = await res.json();
        setUsers(data.users);
      }
    } catch (error) {
      console.error('Failed to search users:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/users?q=${encodeURIComponent(searchQuery)}&sortBy=${sortBy}`);
    }
  };

  const handleSortChange = (newSort: string) => {
    setSortBy(newSort);
    if (searchQuery.trim()) {
      router.push(`/users?q=${encodeURIComponent(searchQuery)}&sortBy=${newSort}`);
    }
  };

  const handleFollow = async (userId: string) => {
    try {
      const isFollowing = followingIds.has(userId);
      const res = await fetch(`/api/users/${userId}/follow`, {
        method: isFollowing ? 'DELETE' : 'POST',
      });

      if (res.ok) {
        setFollowingIds(prev => {
          const newSet = new Set(prev);
          if (isFollowing) {
            newSet.delete(userId);
          } else {
            newSet.add(userId);
          }
          return newSet;
        });
      }
    } catch (error) {
      console.error('Failed to toggle follow:', error);
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-4">{t('search_title')}</h1>

        <form onSubmit={handleSearch} className="flex gap-2 mb-4">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t('search_placeholder')}
            className="flex-grow px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <Button type="submit">
            {t('search_btn')}
          </Button>
        </form>

        {searchQuery && (
          <div className="flex items-center gap-4">
            <span className="text-sm text-slate-600">{t('sort_by')}</span>
            <div className="flex gap-2">
              <button
                onClick={() => handleSortChange('recent')}
                className={`px-3 py-1 text-sm rounded-lg transition-colors ${
                  sortBy === 'recent'
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                {t('sort_recent')}
              </button>
              <button
                onClick={() => handleSortChange('followers')}
                className={`px-3 py-1 text-sm rounded-lg transition-colors ${
                  sortBy === 'followers'
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                {t('sort_followers')}
              </button>
              <button
                onClick={() => handleSortChange('artworks')}
                className={`px-3 py-1 text-sm rounded-lg transition-colors ${
                  sortBy === 'artworks'
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                {t('sort_artworks')}
              </button>
            </div>
          </div>
        )}
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="animate-pulse bg-white border rounded-lg p-6">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-16 h-16 bg-slate-200 rounded-full"></div>
                <div className="flex-grow">
                  <div className="h-4 bg-slate-200 rounded w-1/2 mb-2"></div>
                  <div className="h-3 bg-slate-200 rounded w-1/3"></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : !searchQuery ? (
        <div className="text-center py-16 bg-white border rounded-lg">
          <div className="text-6xl mb-4">🔍</div>
          <h2 className="text-xl font-semibold mb-2">{t('empty_title')}</h2>
          <p className="text-slate-600 mb-6">{t('empty_msg')}</p>
          <div className="flex gap-3 justify-center">
            <Button asChild>
              <Link href="/artworks">{t('explore_art')}</Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/community">{t('go_community')}</Link>
            </Button>
          </div>
        </div>
      ) : users.length === 0 ? (
        <div className="text-center py-16 bg-white border rounded-lg">
          <div className="text-6xl mb-4">😕</div>
          <h2 className="text-xl font-semibold mb-2">{t('no_results_title')}</h2>
          <p className="text-slate-600 mb-6">
            {t('no_results_msg', { query: searchQuery })}
          </p>
          <Button variant="outline" onClick={() => setSearchQuery('')}>
            {t('clear_search')}
          </Button>
        </div>
      ) : (
        <>
          <div className="mb-4 text-sm text-slate-600">
            {t('showing_results', { count: users.length, query: searchQuery })}
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {users.map(user => (
              <div key={user.id} className="bg-white border rounded-lg p-6 hover:shadow-md transition-shadow">
                <div className="flex items-start gap-4">
                  <Link href={`/users/${user.id}`}>
                    <div className="w-16 h-16 bg-slate-200 rounded-full flex items-center justify-center text-slate-600 text-2xl font-semibold hover:bg-slate-300 transition-colors">
                      {user.name?.[0]?.toUpperCase() || '?'}
                    </div>
                  </Link>
                  <div className="flex-grow min-w-0">
                    <Link
                      href={`/users/${user.id}`}
                      className="font-semibold text-lg hover:underline block truncate"
                    >
                      {user.name || t('anonymous')}
                    </Link>
                    <p className="text-sm text-slate-600 truncate mb-3">
                      {user.email}
                    </p>

                    <div className="flex gap-4 text-sm text-slate-600 mb-3">
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
                      <Button
                        size="sm"
                        variant="outline"
                        asChild
                        className="w-full"
                      >
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
