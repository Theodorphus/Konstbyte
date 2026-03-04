"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link';
import SafeImage from '../../components/SafeImage';
import { Button } from '../../components/ui/button';
import { formatSek } from '../../lib/currency';
import StatusCard from '../../components/StatusCard';
import { PageHeader } from '../../components/PageHeader';
import { Skeleton } from '../../components/ui/Skeleton';

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
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    fetchFeed();
  }, []);

  const fetchFeed = async () => {
    setErrorMessage('');
    setLoading(true);
    try {
      const res = await fetch('/api/feed');
      if (res.ok) {
        const data = await res.json();
        setFeedItems(data.items);
        setFollowingCount(data.followingCount);
      } else {
        setErrorMessage('Kunde inte hämta ditt flöde just nu.');
      }
    } catch (error) {
      console.error('Failed to fetch feed:', error);
      setErrorMessage('Nätverksfel när flödet skulle laddas.');
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
        <PageHeader title="Ditt flöde" className="mb-6" />
        <div className="space-y-6">
          <Skeleton className="h-8 w-1/4 mb-2" />
          {[1, 2, 3].map(i => (
            <div key={i} className="bg-white border rounded-lg p-6">
              <div className="flex items-center gap-3 mb-4">
                <Skeleton className="w-10 h-10 rounded-full" />
                <div className="flex-grow">
                  <Skeleton className="h-4 w-1/3 mb-2" />
                  <Skeleton className="h-3 w-1/4" />
                </div>
              </div>
              <Skeleton className="h-40 w-full" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (errorMessage) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <PageHeader title="Ditt flöde" className="mb-6" />
        <StatusCard
          icon="⚠️"
          title="Kunde inte ladda flödet"
          message={errorMessage}
          actions={
            <>
              <Button onClick={fetchFeed}>Försök igen</Button>
              <Button variant="outline" asChild>
                <Link href="/community">Gå till community</Link>
              </Button>
            </>
          }
        />
      </div>
    );
  }

  if (feedItems.length === 0) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <PageHeader title="Ditt flöde" className="mb-6" />
        <StatusCard
          icon="📰"
          title={followingCount === 0 ? 'Ditt flöde är tomt' : 'Inga nya aktiviteter'}
          message={
            followingCount === 0
              ? 'Börja följa konstnärer för att se deras inlägg och konstverk här!'
              : 'Användare du följer har inte publicerat något nytt ännu.'
          }
          actions={
            followingCount === 0 ? (
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
            )
          }
          className="py-8"
        />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <PageHeader
        title="Ditt flöde"
        description={`Följer ${followingCount} användare`}
        className="mb-6"
      />
      <div className="space-y-6">
        {feedItems.map(item => (
          <div
            key={`${item.type}-${item.id}`}
            className="bg-white border rounded-lg p-6 transition-all duration-200 ease-out motion-reduce:transition-none hover:-translate-y-0.5 hover:shadow-md"
          >
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
                    <SafeImage
                      src={(item.content as Artwork).imageUrl}
                      alt={(item.content as Artwork).title}
                      fill
                      className="object-cover transition-transform duration-300 ease-out motion-reduce:transition-none hover:scale-105"
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
                      {formatSek((item.content as Artwork).price)}
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
