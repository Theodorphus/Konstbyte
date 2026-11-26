"use client";
/* eslint-disable react-hooks/exhaustive-deps */

import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { Link } from '@/i18n/navigation';
import { useTranslations } from 'next-intl';

interface Follower {
  id: string;
  createdAt: string;
  follower: {
    id: string;
    name: string | null;
    email?: string | null;
    image: string | null;
  };
}

export default function FollowersPage() {
  const params = useParams();
  const userId = params.id as string;
  const t = useTranslations('users');

  const [followers, setFollowers] = useState<Follower[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // eslint-disable-next-line react-hooks/exhaustive-deps
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
        <h1 className="text-2xl font-semibold">{t('followers_title')}</h1>
        <Card>
          <CardContent className="p-6 text-center text-slate-600">
            {t('list_loading')}
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">{t('followers_title')}</h1>
        <Button variant="outline" asChild>
          <Link href={`/users/${userId}`}>{t('back')}</Link>
        </Button>
      </div>

      <div className="text-sm text-slate-600">
        {t('followers_count', { count: followers.length })}
      </div>

      {followers.length === 0 ? (
        <Card>
          <CardContent className="p-6 text-center">
            <p className="text-slate-600">{t('no_followers')}</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {followers.map((follower) => (
            <Card key={follower.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white font-semibold text-lg">
                    {follower.follower.name?.[0]?.toUpperCase() || '?'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold truncate">
                      {follower.follower.name || t('anonymous_user')}
                    </div>
                  </div>
                </div>
                <Button asChild variant="outline" size="sm" className="w-full mt-3">
                  <Link href={`/users/${follower.follower.id}`}>{t('view_profile')}</Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
