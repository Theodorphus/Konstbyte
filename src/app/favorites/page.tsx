"use client";

import Link from 'next/link';
import { Card, CardContent } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { useState, useEffect } from 'react';

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
        <h1 className="text-2xl font-semibold">Mina favoriter</h1>
        <Card>
          <CardContent className="p-6 text-center text-slate-600">
            Laddar favoriter...
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Mina favoriter</h1>
        <Button variant="outline" asChild>
          <Link href="/artworks">Bläddra konstverk</Link>
        </Button>
      </div>

      <div className="text-sm text-slate-600">
        {favorites.length} sparade konstverk
      </div>

      {favorites.length === 0 ? (
        <Card>
          <CardContent className="p-6 text-center space-y-4">
            <p className="text-slate-600">
              Du har inga sparade favoriter ännu.
            </p>
            <Button asChild>
              <Link href="/artworks">Upptäck konstverk</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {favorites.map((favorite) => (
            <Link 
              key={favorite.id} 
              href={`/artworks/${favorite.artwork.id}`} 
              className="group"
            >
              <Card className="overflow-hidden hover:shadow-lg transition-shadow relative">
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
                <div className="aspect-square bg-slate-100 overflow-hidden">
                  <img 
                    src={favorite.artwork.imageUrl} 
                    alt={favorite.artwork.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                    onError={(e) => {
                      (e.currentTarget as HTMLImageElement).src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="400" height="400"%3E%3Crect fill="%23e2e8f0" width="400" height="400"/%3E%3Ctext x="50%25" y="50%25" text-anchor="middle" dy=".3em" fill="%2394a3b8" font-size="16"%3EIngen bild%3C/text%3E%3C/svg%3E';
                    }}
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
                    <span className="text-lg font-bold">{favorite.artwork.price} SEK</span>
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
