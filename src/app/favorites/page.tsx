"use client";

import Link from 'next/link';
import SafeImage from '../../components/SafeImage';
import { Card, CardContent } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { useState, useEffect } from 'react';
import { formatSek } from '../../lib/currency';
import StatusCard from '../../components/StatusCard';
import { PageHeader } from '../../components/PageHeader';

interface Favorite {
  id: string;
  createdAt: string;
  artwork: {
    id: string;
    title: string;
    description: string | null;
    price: number;
    imageUrl: string;
    category: string;
    owner: {
      id: string;
      name: string | null;
      email: string;
    };
  };
}

export default function FavoritesPage() {
  const [favorites, setFavorites] = useState<Favorite[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchFavorites();
  }, []);

  const fetchFavorites = async () => {
    try {
      const response = await fetch('/api/favorites');
      if (response.ok) {
        const data = await response.json();
        setFavorites(data);
      } else if (response.status === 401) {
        // Not logged in
      }
    } catch (error) {
      console.error('Error fetching favorites:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemoveFavorite = async (artworkId: string) => {
    try {
      const response = await fetch(`/api/favorites?artworkId=${artworkId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setFavorites(favorites.filter(fav => fav.artwork.id !== artworkId));
      }
    } catch (error) {
      console.error('Error removing favorite:', error);
      alert('Misslyckades att ta bort favorit');
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <PageHeader title="Mina favoriter" />
        <StatusCard message="Laddar favoriter..." icon="⏳" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Mina favoriter"
        description={`${favorites.length} sparade konstverk`}
        className="mb-2"
      >
        <Button variant="outline" asChild>
          <Link href="/artworks">Bläddra konstverk</Link>
        </Button>
      </PageHeader>
      {favorites.length === 0 ? (
        <StatusCard
          icon="❤️"
          title="Inga favoriter ännu"
          message="Du har inga sparade favoriter ännu."
          actions={
            <Button asChild>
              <Link href="/artworks">Upptäck konstverk</Link>
            </Button>
          }
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {favorites.map((favorite) => (
            <Link 
              key={favorite.id} 
              href={`/artworks/${favorite.artwork.id}`} 
              className="group"
            >
              <Card className="relative overflow-hidden transition-all duration-200 ease-out motion-reduce:transition-none hover:-translate-y-0.5 hover:shadow-lg">
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    handleRemoveFavorite(favorite.artwork.id);
                  }}
                  className="absolute top-3 right-3 z-10 w-8 h-8 rounded-full bg-white/90 hover:bg-white flex items-center justify-center shadow-md transition-all"
                  title="Ta bort från favoriter"
                >
                  ❤️
                </button>
                <div className="aspect-square bg-slate-100 overflow-hidden relative">
                  <SafeImage
                    src={favorite.artwork.imageUrl}
                    alt={favorite.artwork.title}
                    fill
                    className="object-cover transition-transform duration-300 ease-out motion-reduce:transition-none group-hover:scale-105"
                  />
                </div>
                <CardContent className="p-4">
                  <h3 className="font-semibold mb-1 truncate">{favorite.artwork.title}</h3>
                  {favorite.artwork.description && (
                    <p className="text-xs text-slate-500 mb-2 line-clamp-2">
                      {favorite.artwork.description}
                    </p>
                  )}
                  <div className="flex items-center justify-between">
                    <span className="text-lg font-bold">{formatSek(favorite.artwork.price)}</span>
                    <span className="text-xs text-slate-400 capitalize">
                      {favorite.artwork.category}
                    </span>
                  </div>
                  <div className="text-xs text-slate-500 mt-2">
                    av {favorite.artwork.owner.name || 'Anonym'}
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
