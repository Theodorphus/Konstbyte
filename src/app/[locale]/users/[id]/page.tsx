"use client";
/* eslint-disable react-hooks/exhaustive-deps */

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import SafeImage from '@/components/SafeImage';
import { Button } from '@/components/ui/button';
import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { Link } from '@/i18n/navigation';
import { formatSek } from '@/lib/currency';
import StatusCard from '@/components/StatusCard';
import { CollectionStrip } from '@/components/collections/CollectionStrip';
import { useTranslations } from 'next-intl';

interface User {
  id: string;
  name: string | null;
  email: string;
  image: string | null;
  bio: string | null;
  instagram: string | null;
  _count: {
    artworks: number;
    followers: number;
    following: number;
    posts: number;
  };
}

interface Artwork {
  id: string;
  title: string;
  price: number;
  imageUrl: string;
}

export default function UserProfilePage() {
  const t = useTranslations('users');
  const params = useParams();
  const userId = params.id as string;

  const [user, setUser] = useState<User | null>(null);
  const [artworks, setArtworks] = useState<Artwork[]>([]);
  const [collections, setCollections] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isFollowing, setIsFollowing] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    fetchUser();
    fetchArtworks();
    fetchCollections();
    checkFollowStatus();
  }, [userId]);

  const fetchUser = async () => {
    try {
      const response = await fetch(`/api/users/${userId}`);
      if (response.ok) {
        const data = await response.json();
        setUser(data);
      }
    } catch (error) {
      console.error('Error fetching user:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchArtworks = async () => {
    try {
      const response = await fetch(`/api/artworks?ownerId=${userId}`);
      if (response.ok) {
        const data = await response.json();
        setArtworks((data.items || []).slice(0, 6));
      }
    } catch (error) {
      console.error('Error fetching artworks:', error);
    }
  };

  const fetchCollections = async () => {
    try {
      const response = await fetch(`/api/collections?artistId=${userId}`);
      if (response.ok) {
        const data = await response.json();
        setCollections(data || []);
      }
    } catch (error) {
      console.error('Error fetching collections:', error);
    }
  };

  const checkFollowStatus = async () => {
    try {
      const meResponse = await fetch('/api/me');
      if (meResponse.ok) {
        const meData = await meResponse.json();
        setCurrentUserId(meData?.user?.id || null);

        if (meData?.user?.id) {
          const followingResponse = await fetch(`/api/users/${meData.user.id}/following`);
          if (followingResponse.ok) {
            const followingData = await followingResponse.json();
            const follows = followingData as Array<{ following: { id: string } }>;
            setIsFollowing(follows.some((f) => f.following.id === userId));
          }
        }
      }
    } catch (error) {
      console.error('Error checking follow status:', error);
    }
  };

  const toggleFollow = async () => {
    if (!currentUserId) {
      alert(t('must_signin_follow'));
      return;
    }

    try {
      const response = await fetch(`/api/users/${userId}/follow`, {
        method: isFollowing ? 'DELETE' : 'POST',
      });

      if (response.ok) {
        setIsFollowing(!isFollowing);
        // Update follower count
        if (user) {
          setUser({
            ...user,
            _count: {
              ...user._count,
              followers: user._count.followers + (isFollowing ? -1 : 1),
            },
          });
        }
      } else if (response.status === 401) {
        alert(t('must_signin'));
      }
    } catch (error) {
      console.error('Error toggling follow:', error);
      alert(t('error_generic'));
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <StatusCard message={t('loading')} icon="⏳" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="space-y-6">
        <StatusCard
          icon="👤"
          title={t('not_found_title')}
          message={t('not_found_msg')}
          actions={
            <Button asChild>
              <Link href="/community">{t('back_community')}</Link>
            </Button>
          }
        />
      </div>
    );
  }

  const isOwnProfile = currentUserId === userId;

  return (
    <div className="space-y-6">
      <Card className="transition-all duration-200 ease-out motion-reduce:transition-none hover:-translate-y-0.5 hover:shadow-md">
        <CardContent className="p-6">
          <div className="flex items-start gap-6">
            <div className="w-24 h-24 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white font-semibold text-3xl">
              {user.name?.[0]?.toUpperCase() || user.email[0].toUpperCase()}
            </div>
            <div className="flex-1">
              <h1 className="text-2xl font-bold">{user.name || t('anonymous_user')}</h1>
              <p className="text-slate-600">{user.email}</p>
              {user.bio && <p className="text-slate-600 mt-2">{user.bio}</p>}
              {user.instagram && (
                <p className="text-slate-600 mt-1">
                  <a
                    href={`https://instagram.com/${user.instagram.replace(/^@/, '')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-amber-600 hover:text-amber-700 underline"
                  >
                    @{user.instagram.replace(/^@/, '')}
                  </a>
                </p>
              )}
              <div className="flex gap-6 mt-4 text-sm">
                <Link href={`/users/${userId}/followers`} className="hover:text-slate-900">
                  <span className="font-bold">{user._count.followers}</span> {t('followers_label')}
                </Link>
                <Link href={`/users/${userId}/following`} className="hover:text-slate-900">
                  <span className="font-bold">{user._count.following}</span> {t('following_label')}
                </Link>
                <div>
                  <span className="font-bold">{user._count.artworks}</span> {t('artworks_label')}
                </div>
                <div>
                  <span className="font-bold">{user._count.posts}</span> {t('posts_label')}
                </div>
              </div>
              {!isOwnProfile && currentUserId && (
                <div className="flex gap-2 mt-4">
                  <Button onClick={toggleFollow}>
                    {isFollowing ? t('unfollow') : t('follow')}
                  </Button>
                  <Button variant="outline" asChild>
                    <Link href={`/messages/${userId}`}>{t('send_message')}</Link>
                  </Button>
                </div>
              )}
              {isOwnProfile && (
                <Button asChild variant="outline" className="mt-4">
                  <Link href="/profile/edit">{t('edit_profile')}</Link>
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Collections section */}
      {collections.length > 0 && (
        <div>
          <CollectionStrip
            collections={collections}
            title={`${user?.name || 'Konstnärens'} samlingar`}
          />
        </div>
      )}

      <Card className="transition-all duration-200 ease-out motion-reduce:transition-none hover:-translate-y-0.5 hover:shadow-md">
        <CardHeader>
          <CardTitle>{t('artworks_section')}</CardTitle>
        </CardHeader>
        <CardContent>
          {artworks.length === 0 ? (
            <StatusCard icon="🖼️" message={t('no_artworks')} className="py-8" />
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {artworks.map((artwork) => (
                <Link key={artwork.id} href={`/artworks/${artwork.id}`} className="group">
                  <div className="aspect-square bg-slate-100 rounded overflow-hidden mb-2 relative">
                    <SafeImage
                      src={artwork.imageUrl}
                      alt={artwork.title}
                      fill
                      className="object-cover transition-transform duration-300 ease-out motion-reduce:transition-none group-hover:scale-105"
                    />
                  </div>
                  <div className="text-xs font-medium truncate">{artwork.title}</div>
                  <div className="text-xs text-slate-500">{formatSek(artwork.price)}</div>
                </Link>
              ))}
            </div>
          )}
          {artworks.length > 0 && (
            <Button asChild variant="outline" className="w-full mt-4">
              <Link href={`/artworks?ownerId=${userId}`}>{t('view_all_artworks')}</Link>
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
