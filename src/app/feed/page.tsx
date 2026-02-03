"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Button } from '../../components/ui/button';

interface Post {
  id: string;
  content: string;
  likes: number;
  createdAt: string;
  author: {
    id: string;
    name: string | null;
    email: string;
    image: string | null;
  };
  _count: {
    comments: number;
  };
}

interface Artwork {
  id: string;
  title: string;
  description: string | null;
  price: number;
  imageUrl: string;
  category: string;
  createdAt: string;
  owner: {
    id: string;
    name: string | null;
    email: string;
    image: string | null;
  };
  _count: {
    favorites: number;
  };
}

interface FeedItem {
  id: string;
  type: 'post' | 'artwork';
  content: Post | Artwork;
  createdAt: string;
}

export default function FeedPage() {
  const [feedItems, setFeedItems] = useState<FeedItem[]>([]);
  const [followingCount, setFollowingCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchFeed();
  }, []);

  const fetchFeed = async () => {
    try {
      const res = await fetch('/api/feed');
      if (res.ok) {
        const data = await res.json();
        setFeedItems(data.items);
        setFollowingCount(data.followingCount);
      }
    } catch (error) {
      console.error('Failed to fetch feed:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (date: string) => {
    const now = new Date();
    const itemDate = new Date(date);
    const diffInSeconds = Math.floor((now.getTime() - itemDate.getTime()) / 1000);

    if (diffInSeconds < 60) return 'Just nu';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m sedan`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h sedan`;
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d sedan`;
    return itemDate.toLocaleDateString('sv-SE');
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-slate-200 rounded w-1/4"></div>
          {[1, 2, 3].map(i => (
            <div key={i} className="bg-white border rounded-lg p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-slate-200 rounded-full"></div>
                <div className="flex-grow">
                  <div className="h-4 bg-slate-200 rounded w-1/3 mb-2"></div>
                  <div className="h-3 bg-slate-200 rounded w-1/4"></div>
                </div>
              </div>
              <div className="h-40 bg-slate-200 rounded"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (feedItems.length === 0) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-6">Ditt flöde</h1>
        <div className="text-center py-16 bg-white border rounded-lg">
          <div className="text-6xl mb-4">📰</div>
          <h2 className="text-xl font-semibold mb-2">
            {followingCount === 0 ? 'Ditt flöde är tomt' : 'Inga nya aktiviteter'}
          </h2>
          <p className="text-slate-600 mb-6 max-w-md mx-auto">
            {followingCount === 0 
              ? 'Börja följa konstnärer för att se deras inlägg och konstverk här!'
              : 'Användare du följer har inte publicerat något nytt ännu.'}
          </p>
          <div className="flex gap-3 justify-center">
            {followingCount === 0 ? (
              <>
                <Button asChild>
                  <Link href="/artworks">Utforska konst</Link>
                </Button>
                <Button variant="outline" asChild>
                  <Link href="/community">Gå till Community</Link>
                </Button>
              </>
            ) : (
              <>
                <Button asChild>
                  <Link href="/artworks">Bläddra i marknadsplatsen</Link>
                </Button>
                <Button variant="outline" asChild>
                  <Link href="/community">Se alla inlägg</Link>
                </Button>
              </>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">Ditt flöde</h1>
        <p className="text-sm text-slate-600">
          Följer {followingCount} {followingCount === 1 ? 'användare' : 'användare'}
        </p>
      </div>

      <div className="space-y-6">
        {feedItems.map(item => (
          <div key={`${item.type}-${item.id}`} className="bg-white border rounded-lg p-6">
            {item.type === 'post' ? (
              // Post card
              <>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-slate-200 rounded-full flex items-center justify-center text-slate-600">
                    {(item.content as Post).author.name?.[0]?.toUpperCase() || '?'}
                  </div>
                  <div className="flex-grow">
                    <Link 
                      href={`/users/${(item.content as Post).author.id}`}
                      className="font-semibold hover:underline"
                    >
                      {(item.content as Post).author.name || 'Anonym'}
                    </Link>
                    <p className="text-sm text-slate-500">
                      {formatDate(item.createdAt)} • Inlägg
                    </p>
                  </div>
                </div>
                <Link href="/community">
                  <p className="text-slate-800 mb-4 whitespace-pre-wrap hover:text-slate-900">
                    {(item.content as Post).content}
                  </p>
                </Link>
                <div className="flex items-center gap-4 text-sm text-slate-600">
                  <span className="flex items-center gap-1">
                    ❤️ {(item.content as Post).likes}
                  </span>
                  <span className="flex items-center gap-1">
                    💬 {(item.content as Post)._count.comments}
                  </span>
                </div>
              </>
            ) : (
              // Artwork card
              <>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-slate-200 rounded-full flex items-center justify-center text-slate-600">
                    {(item.content as Artwork).owner.name?.[0]?.toUpperCase() || '?'}
                  </div>
                  <div className="flex-grow">
                    <Link 
                      href={`/users/${(item.content as Artwork).owner.id}`}
                      className="font-semibold hover:underline"
                    >
                      {(item.content as Artwork).owner.name || 'Anonym'}
                    </Link>
                    <p className="text-sm text-slate-500">
                      {formatDate(item.createdAt)} • Nytt konstverk
                    </p>
                  </div>
                </div>
                <Link href={`/artworks/${item.id}`}>
                  <div className="relative aspect-video mb-3 rounded-lg overflow-hidden bg-slate-100">
                    <Image
                      src={(item.content as Artwork).imageUrl}
                      alt={(item.content as Artwork).title}
                      fill
                      className="object-cover hover:scale-105 transition-transform"
                    />
                  </div>
                  <h3 className="font-semibold text-lg mb-1 hover:text-slate-700">
                    {(item.content as Artwork).title}
                  </h3>
                  {(item.content as Artwork).description && (
                    <p className="text-slate-600 text-sm mb-2 line-clamp-2">
                      {(item.content as Artwork).description}
                    </p>
                  )}
                  <div className="flex items-center justify-between">
                    <span className="text-lg font-bold">
                      {(item.content as Artwork).price} kr
                    </span>
                    <span className="text-sm text-slate-600">
                      🤍 {(item.content as Artwork)._count.favorites}
                    </span>
                  </div>
                </Link>
              </>
            )}
          </div>
        ))}
      </div>

      {feedItems.length >= 30 && (
        <div className="text-center py-8">
          <p className="text-slate-600 mb-4">Du har sett alla senaste aktiviteterna</p>
          <div className="flex gap-3 justify-center">
            <Button variant="outline" asChild>
              <Link href="/artworks">Utforska mer konst</Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/community">Se alla inlägg</Link>
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
