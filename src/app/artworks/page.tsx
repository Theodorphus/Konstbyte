"use client";

import Link from 'next/link';
import { Card, CardContent } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { useState, useEffect } from 'react';

interface Artwork {
  id: string;
  title: string;
  description: string | null;
  price: number;
  imageUrl: string;
  category: string;
}

export default function ArtworksPage() {
  const [artworks, setArtworks] = useState<Artwork[]>([]);
  const [filteredArtworks, setFilteredArtworks] = useState<Artwork[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [sortBy, setSortBy] = useState<string>('newest');
  const [minPrice, setMinPrice] = useState<string>('');
  const [maxPrice, setMaxPrice] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [favoriteIds, setFavoriteIds] = useState<Set<string>>(new Set());
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  useEffect(() => {
    fetchArtworks();
    fetchFavorites();
  }, []);

  useEffect(() => {
    filterArtworks();
  }, [searchQuery, selectedCategory, sortBy, minPrice, maxPrice, artworks]);

  const fetchArtworks = async () => {
    try {
      const response = await fetch('/api/artworks');
      if (response.ok) {
        const data = await response.json();
        setArtworks(data);
        setFilteredArtworks(data);
      }
    } catch (error) {
      console.error('Error fetching artworks:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchFavorites = async () => {
    try {
      const response = await fetch('/api/favorites');
      if (response.ok) {
        const data = await response.json();
        const ids = new Set(data.map((fav: any) => fav.artworkId));
        setFavoriteIds(ids);
      }
      const meResponse = await fetch('/api/me');
      if (meResponse.ok) {
        const userData = await meResponse.json();
        setCurrentUserId(userData?.user?.id || null);
      }
    } catch (error) {
      console.error('Error fetching favorites:', error);
    }
  };

  const toggleFavorite = async (artworkId: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!currentUserId) {
      alert('Du måste vara inloggad för att spara favoriter');
      return;
    }

    const isFavorited = favoriteIds.has(artworkId);

    try {
      if (isFavorited) {
        const response = await fetch(`/api/favorites?artworkId=${artworkId}`, {
          method: 'DELETE',
        });
        if (response.ok) {
          setFavoriteIds(prev => {
            const newSet = new Set(prev);
            newSet.delete(artworkId);
            return newSet;
          });
        }
      } else {
        const response = await fetch('/api/favorites', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ artworkId }),
        });
        if (response.ok) {
          setFavoriteIds(prev => new Set(prev).add(artworkId));
        }
      }
    } catch (error) {
      console.error('Error toggling favorite:', error);
      alert('Något gick fel');
    }
  };

  const filterArtworks = () => {
    let filtered = artworks;

    if (searchQuery) {
      filtered = filtered.filter(art => 
        art.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        art.description?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    if (selectedCategory) {
      filtered = filtered.filter(art => art.category === selectedCategory);
    }

    // Price filter
    if (minPrice) {
      filtered = filtered.filter(art => art.price >= parseInt(minPrice));
    }
    if (maxPrice) {
      filtered = filtered.filter(art => art.price <= parseInt(maxPrice));
    }

    // Sorting
    filtered = [...filtered].sort((a, b) => {
      switch (sortBy) {
        case 'price-asc':
          return a.price - b.price;
        case 'price-desc':
          return b.price - a.price;
        case 'name':
          return a.title.localeCompare(b.title);
        case 'newest':
        default:
          return 0; // Already sorted by createdAt desc from API
      }
    });

    setFilteredArtworks(filtered);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Konstverk</h1>
        <Button asChild variant="outline">
          <Link href="/artworks/new">Lägg upp konst</Link>
        </Button>
      </div>

      <div className="space-y-3">
        <div className="flex gap-3 flex-wrap items-end">
          <div className="flex-1 min-w-[200px]">
            <Input
              placeholder="Sök efter konstverk..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="flex gap-2">
            <Input
              type="number"
              placeholder="Min pris"
              value={minPrice}
              onChange={(e) => setMinPrice(e.target.value)}
              className="w-28"
            />
            <Input
              type="number"
              placeholder="Max pris"
              value={maxPrice}
              onChange={(e) => setMaxPrice(e.target.value)}
              className="w-28"
            />
          </div>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="px-3 py-2 border rounded text-sm"
          >
            <option value="newest">Senaste</option>
            <option value="price-asc">Pris: Låg-Hög</option>
            <option value="price-desc">Pris: Hög-Låg</option>
            <option value="name">Namn: A-Ö</option>
          </select>
        </div>
        
        <div className="flex items-center gap-2 text-sm flex-wrap">
          <button 
            onClick={() => setSelectedCategory('')}
            className={`px-3 py-1 rounded ${!selectedCategory ? 'bg-slate-900 text-white' : 'border hover:bg-slate-50'}`}
          >
            Alla
          </button>
          <button 
            onClick={() => setSelectedCategory('malningar')}
            className={`px-3 py-1 rounded ${selectedCategory === 'malningar' ? 'bg-slate-900 text-white' : 'border hover:bg-slate-50'}`}
          >
            Målningar
          </button>
          <button 
            onClick={() => setSelectedCategory('skulpturer')}
            className={`px-3 py-1 rounded ${selectedCategory === 'skulpturer' ? 'bg-slate-900 text-white' : 'border hover:bg-slate-50'}`}
          >
            Skulpturer
          </button>
          <button 
            onClick={() => setSelectedCategory('fotografi')}
            className={`px-3 py-1 rounded ${selectedCategory === 'fotografi' ? 'bg-slate-900 text-white' : 'border hover:bg-slate-50'}`}
          >
            Fotografi
          </button>
          <button 
            onClick={() => setSelectedCategory('digital')}
            className={`px-3 py-1 rounded ${selectedCategory === 'digital' ? 'bg-slate-900 text-white' : 'border hover:bg-slate-50'}`}
          >
            Digital konst
          </button>
          {(searchQuery || selectedCategory || minPrice || maxPrice) && (
            <button 
              onClick={() => {
                setSearchQuery('');
                setSelectedCategory('');
                setMinPrice('');
                setMaxPrice('');
                setSortBy('newest');
              }}
              className="px-3 py-1 rounded border border-red-300 text-red-600 hover:bg-red-50"
            >
              Rensa filter
            </button>
          )}
        </div>
      </div>

      <div className="text-sm text-slate-600">
        Visar {filteredArtworks.length} av {artworks.length} konstverk
      </div>

      {isLoading ? (
        <Card>
          <CardContent className="p-6 text-center text-slate-600">
            Laddar konstverk...
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredArtworks.length === 0 && (
            <Card className="sm:col-span-2 lg:col-span-3">
              <CardContent className="p-6 text-sm text-slate-600 space-y-3">
                <p>
                  {artworks.length === 0 
                    ? 'Inga konstverk att visa just nu.' 
                    : 'Inga konstverk matchade din sökning.'}
                </p>
                <div className="flex gap-2">
                  <Button asChild variant="outline" size="sm">
                    <Link href="/artworks/new">Ladda upp första verket</Link>
                  </Button>
                  {searchQuery && (
                    <Button size="sm" onClick={() => { setSearchQuery(''); setSelectedCategory(''); }}>
                      Rensa filter
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
          {filteredArtworks.map((art) => (
            <Link key={art.id} href={`/artworks/${art.id}`} className="group">
              <Card className="overflow-hidden hover:shadow-lg transition-shadow relative">
                {currentUserId && (
                  <button
                    onClick={(e) => toggleFavorite(art.id, e)}
                    className="absolute top-3 right-3 z-10 w-8 h-8 rounded-full bg-white/90 hover:bg-white flex items-center justify-center shadow-md transition-all"
                    title={favoriteIds.has(art.id) ? 'Ta bort från favoriter' : 'Lägg till i favoriter'}
                  >
                    {favoriteIds.has(art.id) ? '❤️' : '🤍'}
                  </button>
                )}
                <div className="aspect-square bg-slate-100 overflow-hidden">
                  <img 
                    src={art.imageUrl} 
                    alt={art.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                    onError={(e) => {
                      (e.currentTarget as HTMLImageElement).src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="400" height="400"%3E%3Crect fill="%23e2e8f0" width="400" height="400"/%3E%3Ctext x="50%25" y="50%25" text-anchor="middle" dy=".3em" fill="%2394a3b8" font-size="16"%3EIngen bild%3C/text%3E%3C/svg%3E';
                    }}
                  />
                </div>
                <CardContent className="p-4">
                  <h3 className="font-semibold mb-1 truncate">{art.title}</h3>
                  {art.description && (
                    <p className="text-xs text-slate-500 mb-2 line-clamp-2">{art.description}</p>
                  )}
                  <div className="flex items-center justify-between">
                    <span className="text-lg font-bold">{art.price} SEK</span>
                    <span className="text-xs text-slate-400 capitalize">{art.category}</span>
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
