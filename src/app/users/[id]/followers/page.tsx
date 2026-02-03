"use client";

import { Card, CardContent, CardHeader, CardTitle } from '../../../../components/ui/card';
import { Button } from '../../../../components/ui/button';
import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';

interface Follower {
  id: string;
  createdAt: string;
  follower: {
    id: string;
    name: string | null;
    email: string;
    image: string | null;
  };
}

export default function FollowersPage() {
  const params = useParams();
  const router = useRouter();
  const userId = params.id as string;

  const [followers, setFollowers] = useState<Follower[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchFollowers();
  }, [userId]);

  const fetchFollowers = async () => {
    try {
      const response = await fetch(`/api/users/${userId}/followers`);
      if (response.ok) {
        const data = await response.json();
        setFollowers(data);
      }
    } catch (error) {
      console.error('Error fetching followers:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-semibold">Följare</h1>
        <Card>
          <CardContent className="p-6 text-center text-slate-600">
            Laddar följare...
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Följare</h1>
        <Button variant="outline" asChild>
          <Link href="/profile">Tillbaka</Link>
        </Button>
      </div>

      <div className="text-sm text-slate-600">
        {followers.length} följare
      </div>

      {followers.length === 0 ? (
        <Card>
          <CardContent className="p-6 text-center">
            <p className="text-slate-600">Inga följare ännu.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {followers.map((follower) => (
            <Card key={follower.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white font-semibold text-lg">
                    {follower.follower.name?.[0]?.toUpperCase() || follower.follower.email[0].toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold truncate">
                      {follower.follower.name || 'Anonym användare'}
                    </div>
                    <div className="text-xs text-slate-500 truncate">
                      {follower.follower.email}
                    </div>
                  </div>
                </div>
                <Button asChild variant="outline" size="sm" className="w-full mt-3">
                  <Link href={`/users/${follower.follower.id}`}>Visa profil</Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
