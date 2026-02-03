"use client";

import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card';
import { Button } from '../../../components/ui/button';
import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';

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

interface Artwork {
  id: string;
  title: string;
  price: number;
  imageUrl: string;
}

export default function UserProfilePage() {
  const params = useParams();
  const userId = params.id as string;

  const [user, setUser] = useState<User | null>(null);
  const [artworks, setArtworks] = useState<Artwork[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isFollowing, setIsFollowing] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  useEffect(() => {
    fetchUser();
    fetchArtworks();
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
        setArtworks(data.slice(0, 6));
      }
    } catch (error) {
      console.error('Error fetching artworks:', error);
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
            setIsFollowing(followingData.some((f: any) => f.following.id === userId));
          }
        }
      }
    } catch (error) {
      console.error('Error checking follow status:', error);
    }
  };

  const toggleFollow = async () => {
    if (!currentUserId) {
      alert('Du måste vara inloggad för att följa användare');
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
        alert('Du måste vara inloggad');
      }
    } catch (error) {
      console.error('Error toggling follow:', error);
      alert('Något gick fel');
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Card>
          <CardContent className="p-6 text-center text-slate-600">
            Laddar profil...
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="space-y-6">
        <Card>
          <CardContent className="p-6 text-center">
            <p className="text-slate-600 mb-4">Användaren hittades inte.</p>
            <Button asChild>
              <Link href="/community">Tillbaka till community</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const isOwnProfile = currentUserId === userId;

  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="p-6">
          <div className="flex items-start gap-6">
            <div className="w-24 h-24 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white font-semibold text-3xl">
              {user.name?.[0]?.toUpperCase() || user.email[0].toUpperCase()}
            </div>
            <div className="flex-1">
              <h1 className="text-2xl font-bold">{user.name || 'Anonym användare'}</h1>
              <p className="text-slate-600">{user.email}</p>
              <div className="flex gap-6 mt-4 text-sm">
                <Link href={`/users/${userId}/followers`} className="hover:text-slate-900">
                  <span className="font-bold">{user._count.followers}</span> följare
                </Link>
                <Link href={`/users/${userId}/following`} className="hover:text-slate-900">
                  <span className="font-bold">{user._count.following}</span> följer
                </Link>
                <div>
                  <span className="font-bold">{user._count.artworks}</span> konstverk
                </div>
                <div>
                  <span className="font-bold">{user._count.posts}</span> inlägg
                </div>
              </div>
              {!isOwnProfile && currentUserId && (
                <Button onClick={toggleFollow} className="mt-4">
                  {isFollowing ? 'Sluta följ' : 'Följ'}
                </Button>
              )}
              {isOwnProfile && (
                <Button asChild variant="outline" className="mt-4">
                  <Link href="/profile/edit">Redigera profil</Link>
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Konstverk</CardTitle>
        </CardHeader>
        <CardContent>
          {artworks.length === 0 ? (
            <p className="text-sm text-slate-600">Inga konstverk ännu.</p>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {artworks.map((artwork) => (
                <Link key={artwork.id} href={`/artworks/${artwork.id}`}>
                  <div className="aspect-square bg-slate-100 rounded overflow-hidden mb-2">
                    <img
                      src={artwork.imageUrl}
                      alt={artwork.title}
                      className="w-full h-full object-cover hover:scale-105 transition-transform"
                    />
                  </div>
                  <div className="text-xs font-medium truncate">{artwork.title}</div>
                  <div className="text-xs text-slate-500">{artwork.price} SEK</div>
                </Link>
              ))}
            </div>
          )}
          {artworks.length > 0 && (
            <Button asChild variant="outline" className="w-full mt-4">
              <Link href={`/artworks?ownerId=${userId}`}>Visa alla konstverk</Link>
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
