"use client";
/* eslint-disable react-hooks/exhaustive-deps */

import Link from 'next/link';
import { Card, CardContent } from '../../components/ui/card';
import Image from 'next/image';
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

  const categories = ['malningar', 'skulpturer', 'fotografi', 'digital'];

  useEffect(() => {
    fetchArtworks();
    fetchFavorites();
  }, []);

  // eslint-disable-next-line react-hooks/exhaustive-deps
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
        const ids = new Set<string>(data.map((fav) => String((fav as { artworkId: string }).artworkId)));
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
      {/* Gradient Header */}
      <div className="-mx-6 -mt-6 mb-8 px-6 py-12 md:py-16 bg-gradient-to-r from-orange-500 via-pink-500 to-purple-600 text-white">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <h1 className="text-4xl md:text-5xl font-bold mb-3">🎨 Marknadsplats</h1>
              <p className="text-lg md:text-xl text-white/90 mb-4">Upptäck och köp unik konst från talangfulla konstnärer</p>
              <div className="flex gap-3 flex-wrap">
                <span className="px-4 py-2 bg-white/20 backdrop-blur-sm rounded-full text-sm font-medium">
                  {artworks.length} konstverk
                </span>
                <span className="px-4 py-2 bg-white/20 backdrop-blur-sm rounded-full text-sm font-medium">
                  {categories.length} kategorier
                </span>
              </div>
            </div>
            <Button asChild className="bg-white text-orange-600 hover:bg-orange-50 shadow-lg">
              <Link href="/artworks/new">Lägg upp konst</Link>
            </Button>
          </div>
        </div>
      </div>

      {/* Filters Section */}
      <div className="bg-white border-2 border-orange-200 rounded-xl p-6 shadow-lg">
        <div className="space-y-6">
          <div className="flex-1">
            <label className="block text-sm font-semibold mb-2 text-slate-700">🔍 Sök konst</label>
            <Input
              placeholder="Sök efter titel, konstnär eller beskrivning..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="border-2 border-slate-200 focus:border-orange-500 transition-colors"
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <label className="block text-sm font-semibold mb-2 text-slate-700">💰 Min pris</label>
              <Input
                type="number"
                placeholder="0 kr"
                value={minPrice}
                onChange={(e) => setMinPrice(e.target.value)}
                className="border-2 border-slate-200 focus:border-orange-500 transition-colors"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold mb-2 text-slate-700">💰 Max pris</label>
              <Input
                type="number"
                placeholder="Obegränsat"
                value={maxPrice}
                onChange={(e) => setMaxPrice(e.target.value)}
                className="border-2 border-slate-200 focus:border-orange-500 transition-colors"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-sm font-semibold mb-2 text-slate-700">🔄 Sortera</label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="w-full px-4 py-2 border-2 border-slate-200 rounded-md focus:border-orange-500 focus:outline-none transition-colors bg-white"
              >
                <option value="newest">Senaste</option>
                <option value="price-asc">Pris: Låg-Hög</option>
                <option value="price-desc">Pris: Hög-Låg</option>
                <option value="name">Namn: A-Ö</option>
              </select>
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-semibold mb-3 text-slate-700">🎨 Kategorier</label>
            <div className="flex items-center gap-2 text-sm flex-wrap">
              <button 
                onClick={() => setSelectedCategory('')}
                className={`px-4 py-2 rounded-lg font-medium transition-all ${!selectedCategory ? 'bg-gradient-to-r from-orange-500 to-pink-500 text-white shadow-md' : 'border-2 border-slate-200 hover:border-orange-500 hover:bg-orange-50'}`}
              >
                Alla
              </button>
              <button 
                onClick={() => setSelectedCategory('malningar')}
                className={`px-4 py-2 rounded-lg font-medium transition-all ${selectedCategory === 'malningar' ? 'bg-gradient-to-r from-orange-500 to-pink-500 text-white shadow-md' : 'border-2 border-slate-200 hover:border-orange-500 hover:bg-orange-50'}`}
              >
                Målningar
              </button>
              <button 
                onClick={() => setSelectedCategory('skulpturer')}
                className={`px-4 py-2 rounded-lg font-medium transition-all ${selectedCategory === 'skulpturer' ? 'bg-gradient-to-r from-orange-500 to-pink-500 text-white shadow-md' : 'border-2 border-slate-200 hover:border-orange-500 hover:bg-orange-50'}`}
              >
                Skulpturer
              </button>
              <button 
                onClick={() => setSelectedCategory('fotografi')}
                className={`px-4 py-2 rounded-lg font-medium transition-all ${selectedCategory === 'fotografi' ? 'bg-gradient-to-r from-orange-500 to-pink-500 text-white shadow-md' : 'border-2 border-slate-200 hover:border-orange-500 hover:bg-orange-50'}`}
              >
                Fotografi
              </button>
              <button 
                onClick={() => setSelectedCategory('digital')}
                className={`px-4 py-2 rounded-lg font-medium transition-all ${selectedCategory === 'digital' ? 'bg-gradient-to-r from-orange-500 to-pink-500 text-white shadow-md' : 'border-2 border-slate-200 hover:border-orange-500 hover:bg-orange-50'}`}
              >
                Digital konst
              </button>
            </div>
          </div>

          {/* Active Filters */}
          {(searchQuery || selectedCategory || minPrice || maxPrice) && (
            <div className="flex flex-wrap gap-2 items-center pt-4 border-t">
              <span className="text-sm font-medium text-slate-600">Aktiva filter:</span>
              {searchQuery && (
                  <span className="px-3 py-1 bg-orange-100 text-orange-700 rounded-full text-sm font-medium">
                  🔍 &quot;{searchQuery}&quot;
                </span>
              )}
              {selectedCategory && (
                <span className="px-3 py-1 bg-pink-100 text-pink-700 rounded-full text-sm font-medium">
                  {selectedCategory}
                </span>
              )}
              {minPrice && (
                <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm font-medium">
                  Min: {minPrice} kr
                </span>
              )}
              {maxPrice && (
                <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm font-medium">
                  Max: {maxPrice} kr
                </span>
              )}
              <button 
                onClick={() => {
                  setSearchQuery('');
                  setSelectedCategory('');
                  setMinPrice('');
                  setMaxPrice('');
                  setSortBy('newest');
                }}
                className="px-3 py-1 bg-red-100 hover:bg-red-200 text-red-700 rounded-full text-sm font-medium transition-colors"
              >
                ✖ Rensa alla
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="flex items-center justify-between text-sm">
        <span className="text-slate-600">
          Visar <strong className="text-slate-900">{filteredArtworks.length}</strong> av <strong className="text-slate-900">{artworks.length}</strong> konstverk
        </span>
        {filteredArtworks.length === 0 && !isLoading && (
          <span className="text-orange-600 font-medium">Inga konstverk matchade dina filter</span>
        )}
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
                <div className="aspect-square bg-slate-100 overflow-hidden relative">
                  <Image
                    src={art.imageUrl}
                    alt={art.title}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform"
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
