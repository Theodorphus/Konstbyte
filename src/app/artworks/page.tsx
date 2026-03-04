"use client";
import Link from 'next/link';
import { Card, CardContent } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { useState, useEffect } from 'react';
import { formatSek } from '../../lib/currency';
import SafeImage from '../../components/SafeImage';
import { PageHeader } from '../../components/PageHeader';
import { Skeleton } from '../../components/ui/Skeleton';

// --- TYPING ---
type Artwork = {
  id: string;
  title: string;
  description: string | null;
  price: number;
  imageUrl: string;
  category: string;
};
type ArtworksResponse = {
  items: Artwork[];
  total: number;
};

const categories = ['malningar', 'skulpturer', 'fotografi', 'digital'];

function ArtworksGrid({ artworks, favoriteIds, toggleFavorite, currentUserId }: {
  artworks: Artwork[];
  favoriteIds: Set<string>;
  toggleFavorite: (artworkId: string, e: React.MouseEvent) => void;
  currentUserId: string | null;
}) {
  return (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {artworks.length === 0 && (
            <Card className="sm:col-span-2 lg:col-span-3">
              <CardContent className="p-6 text-sm text-slate-600 space-y-3">
            <p>Inga konstverk matchade din sökning.</p>
                <div className="flex gap-2">
                  <Button asChild variant="outline" size="sm">
                    <Link href="/artworks/new">Ladda upp första verket</Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
      {artworks.map((art) => (
            <Link key={art.id} href={`/artworks/${art.id}`} className="group">
              <Card className="relative overflow-hidden transition-all duration-200 ease-out motion-reduce:transition-none hover:-translate-y-0.5 hover:shadow-lg">
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
                  <SafeImage
                    src={art.imageUrl}
                    alt={art.title}
                    fill
                    className="object-cover transition-transform duration-300 ease-out motion-reduce:transition-none group-hover:scale-105"
                  />
                </div>
                <CardContent className="p-4">
                  <h3 className="font-semibold mb-1 truncate">{art.title}</h3>
                  {art.description && (
                    <p className="text-xs text-slate-500 mb-2 line-clamp-2">{art.description}</p>
                  )}
                  <div className="flex items-center justify-between">
                    <span className="text-lg font-bold">{formatSek(art.price)}</span>
                    <span className="text-xs text-slate-400 capitalize">{art.category}</span>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
  );
}

export default function ArtworksPage() {
  const [artworks, setArtworks] = useState<Artwork[]>([]);
  const [total, setTotal] = useState<number>(0);
  const [page, setPage] = useState<number>(1);
  const pageSize = 12;
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [sortBy, setSortBy] = useState<string>('newest');
  const [minPrice, setMinPrice] = useState<string>('');
  const [maxPrice, setMaxPrice] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [favoriteIds, setFavoriteIds] = useState<Set<string>>(new Set());
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isCurrent = true;
    setIsLoading(true);
    setError(null);
    const fetchData = async () => {
      try {
        const qs = buildQuery(page);
        const response = await fetch(`/api/artworks?${qs}`);
        if (response.ok) {
          const data: ArtworksResponse = await response.json();
          if (isCurrent) {
            setArtworks(data.items || []);
            setTotal(data.total || 0);
          }
        } else {
          if (isCurrent) setError('Kunde inte hämta konstverk just nu.');
        }
      } catch {
        if (isCurrent) setError('Nätverksfel vid hämtning av konstverk.');
      } finally {
        if (isCurrent) setIsLoading(false);
      }
    };
    fetchData();
    return () => { isCurrent = false; };
  }, [page, searchQuery, selectedCategory, sortBy, minPrice, maxPrice]);

  useEffect(() => {
    fetchFavorites();
  }, []);

  const buildQuery = (pageNumber = 1) => {
    const params = new URLSearchParams();
    params.set('page', String(pageNumber));
    params.set('take', String(pageSize));
    if (selectedCategory) params.set('category', selectedCategory);
    if (searchQuery) params.set('search', searchQuery);
    if (minPrice) params.set('minPrice', minPrice);
    if (maxPrice) params.set('maxPrice', maxPrice);
    if (sortBy) params.set('sortBy', sortBy);
    return params.toString();
  };

  const fetchFavorites = async () => {
    try {
      const response = await fetch('/api/favorites');
      if (response.ok) {
        const data = await response.json();
        const favs = data as Array<{ artworkId: string }>;
        const ids = new Set<string>(favs.map((fav) => String(fav.artworkId)));
        setFavoriteIds(ids);
      }
      const meResponse = await fetch('/api/me');
      if (meResponse.ok) {
        const userData = await meResponse.json();
        setCurrentUserId(userData?.user?.id || null);
      }
    } catch (error) {
      // still ignore here
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
        const response = await fetch(`/api/favorites`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ artworkId }),
        });
        if (response.ok) {
          setFavoriteIds(prev => new Set(prev).add(artworkId));
        }
      }
    } catch (error) {
      // still ignore here
    }
  };

  // Huvudreturn för komponenten
  return (
    <div className="space-y-6">
      {/* Gradient Header */}
      <div className="-mx-6 -mt-6 mb-8 px-6 py-12 md:py-16 bg-gradient-to-r from-orange-500 via-pink-500 to-purple-600 text-white">
        <div className="max-w-7xl mx-auto">
          <PageHeader
            title="🎨 Marknadsplats"
            description="Upptäck och köp unik konst från talangfulla konstnärer"
            className="mb-4 text-white"
          >
            <div className="flex gap-3 flex-wrap mb-4">
              <span className="px-4 py-2 bg-white/20 backdrop-blur-sm rounded-full text-sm font-medium">
                {total} konstverk
              </span>
              <span className="px-4 py-2 bg-white/20 backdrop-blur-sm rounded-full text-sm font-medium">
                {categories.length} kategorier
              </span>
            </div>
            <Button asChild className="bg-white text-orange-600 hover:bg-orange-50 shadow-lg">
              <Link href="/artworks/new">Lägg upp konst</Link>
            </Button>
          </PageHeader>
        </div>
      </div>

      {/* Filters Section */}
      <div className="bg-white border-2 border-orange-200 rounded-xl p-6 shadow-lg transition-all duration-200 ease-out motion-reduce:transition-none hover:shadow-xl hover:border-orange-300">
        <div className="space-y-6">
          <div className="flex-1">
            <label className="block text-sm font-semibold mb-2 text-slate-700">🔍 Sök konst</label>
            <Input
              placeholder="Sök efter titel, konstnär eller beskrivning..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="border-2 border-slate-200 focus:border-orange-500 transition-colors duration-200"
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <label className="block text-sm font-semibold mb-2 text-slate-700">💰 Minsta pris</label>
              <Input
                type="number"
                placeholder="0 kr"
                value={minPrice}
                onChange={(e) => setMinPrice(e.target.value)}
                className="border-2 border-slate-200 focus:border-orange-500 transition-colors duration-200"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold mb-2 text-slate-700">💰 Högsta pris</label>
              <Input
                type="number"
                placeholder="Obegränsat"
                value={maxPrice}
                onChange={(e) => setMaxPrice(e.target.value)}
                className="border-2 border-slate-200 focus:border-orange-500 transition-colors duration-200"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-sm font-semibold mb-2 text-slate-700">🔄 Sortera</label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="w-full px-4 py-2 border-2 border-slate-200 rounded-md focus:border-orange-500 focus:outline-none transition-colors duration-200 bg-white"
              >
                <option value="newest">Senaste</option>
                <option value="price-asc">Pris: låg–hög</option>
                <option value="price-desc">Pris: hög–låg</option>
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
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-4 py-2 rounded-lg font-medium transition-all ${selectedCategory === cat ? 'bg-gradient-to-r from-orange-500 to-pink-500 text-white shadow-md' : 'border-2 border-slate-200 hover:border-orange-500 hover:bg-orange-50'}`}
                >
                  {cat.charAt(0).toUpperCase() + cat.slice(1)}
                </button>
              ))}
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
                  Min: {formatSek(Number(minPrice))}
                </span>
              )}
              {maxPrice && (
                <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm font-medium">
                  Max: {formatSek(Number(maxPrice))}
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
      {error && (
        <Card><CardContent className="text-red-500">{error}</CardContent></Card>
      )}
      {isLoading ? (
        <Card>
          <CardContent className="p-6 text-center text-slate-600">
            Laddar konstverk...
          </CardContent>
        </Card>
      ) : (
        <ArtworksGrid
          artworks={artworks}
          favoriteIds={favoriteIds}
          toggleFavorite={toggleFavorite}
          currentUserId={currentUserId}
        />
      )}
      {/* Pagination controls */}
      <div className="flex items-center justify-center gap-4 mt-6">
        <button
          onClick={() => setPage((p) => Math.max(1, p - 1))}
          disabled={page === 1}
          aria-label="Föregående sida"
          className="px-3 py-1 rounded bg-white border hover:bg-slate-50 disabled:opacity-50 focus:outline-2 focus:outline-orange-500"
        >
          Föregående
        </button>
        <div className="text-sm text-slate-600">Sida {page} av {Math.max(1, Math.ceil(total / pageSize))}</div>
        <button
          onClick={() => setPage((p) => p + 1)}
          disabled={page >= Math.ceil(total / pageSize)}
          aria-label="Nästa sida"
          className="px-3 py-1 rounded bg-white border hover:bg-slate-50 disabled:opacity-50 focus:outline-2 focus:outline-orange-500"
        >
          Nästa
        </button>
      </div>
    </div>

  );
}

