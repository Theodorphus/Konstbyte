"use client";
/* eslint-disable react-hooks/exhaustive-deps */

import { Card, CardContent } from '../../../../components/ui/card';
import { Button } from '../../../../components/ui/button';
import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';

interface Following {
  id: string;
  createdAt: string;
  following: {
    id: string;
    name: string | null;
    email: string;
    image: string | null;
  };
}

export default function FollowingPage() {
  const params = useParams();
  const userId = params.id as string;

  const [following, setFollowing] = useState<Following[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    fetchFollowing();
  }, [userId]);

  const fetchFollowing = async () => {
    try {
      const response = await fetch(`/api/users/${userId}/following`);
      if (response.ok) {
        const data = await response.json();
        setFollowing(data);
      }
    } catch (error) {
      console.error('Error fetching following:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-semibold">Följer</h1>
        <Card>
          <CardContent className="p-6 text-center text-slate-600">
            Laddar...
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Följer</h1>
        <Button variant="outline" asChild>
          <Link href="/profile">Tillbaka</Link>
        </Button>
      </div>

      <div className="text-sm text-slate-600">
        Följer {following.length} användare
      </div>

      {following.length === 0 ? (
        <Card>
          <CardContent className="p-6 text-center space-y-3">
            <p className="text-slate-600">Du följer inga användare ännu.</p>
            <Button asChild>
              <Link href="/community">Upptäck användare</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {following.map((follow) => (
            <Card key={follow.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white font-semibold text-lg">
                    {follow.following.name?.[0]?.toUpperCase() || follow.following.email[0].toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold truncate">
                      {follow.following.name || 'Anonym användare'}
                    </div>
                    <div className="text-xs text-slate-500 truncate">
                      {follow.following.email}
                    </div>
                  </div>
                </div>
                <Button asChild variant="outline" size="sm" className="w-full mt-3">
                  <Link href={`/users/${follow.following.id}`}>Visa profil</Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
