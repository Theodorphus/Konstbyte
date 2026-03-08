"use client";
import Link from 'next/link';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { useState, useEffect } from 'react';
import { formatSek } from '../../lib/currency';
import SafeImage from '../../components/SafeImage';
import { PageHeader } from '../../components/PageHeader';

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

function ArtworkCardSkeleton() {
  return (
    <div className="rounded-2xl overflow-hidden bg-white/90 ring-1 ring-slate-200/70 shadow-sm animate-pulse">
      <div className="aspect-[4/3] bg-slate-100" />
      <div className="p-4 space-y-2">
        <div className="h-4 bg-slate-100 rounded-md w-3/4" />
        <div className="h-3 bg-slate-100 rounded-md w-1/2" />
        <div className="h-4 bg-slate-100 rounded-md w-1/3 mt-3" />
      </div>
    </div>
  );
}

function ArtworksGrid({ artworks, favoriteIds, toggleFavorite, currentUserId }: {
  artworks: Artwork[];
  favoriteIds: Set<string>;
  toggleFavorite: (artworkId: string, e: React.MouseEvent) => void;
  currentUserId: string | null;
}) {
  if (artworks.length === 0) {
    return (
      <div className="rounded-2xl border border-slate-200/70 bg-white/80 p-10 text-center">
        <p className="text-slate-700 font-medium">Inga konstverk matchade din sökning.</p>
        <p className="mt-2 text-sm text-slate-500">Prova att ändra filter eller sök på något annat.</p>
        <Button asChild variant="outline" size="sm" className="mt-5">
          <Link href="/artworks/new">Ladda upp ett verk</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {artworks.map((art) => (
        <Link key={art.id} href={`/artworks/${art.id}`} className="group">
          <div className="relative rounded-2xl overflow-hidden bg-white/90 ring-1 ring-slate-200/70 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:shadow-slate-900/10 hover:ring-slate-300/60">
            {currentUserId && (
              <button
                onClick={(e) => toggleFavorite(art.id, e)}
                aria-label={favoriteIds.has(art.id) ? 'Ta bort från favoriter' : 'Lägg till i favoriter'}
                className="absolute top-3 right-3 z-10 w-8 h-8 rounded-full bg-white/90 hover:bg-white flex items-center justify-center shadow-md transition-all hover:scale-110"
              >
                {favoriteIds.has(art.id) ? '❤️' : '🤍'}
              </button>
            )}
            <div className="aspect-[4/3] bg-slate-100 overflow-hidden">
              <SafeImage
                src={art.imageUrl}
                alt={art.title}
                fill
                className="object-cover transition-transform duration-500 ease-out group-hover:scale-[1.05]"
              />
            </div>
            <div className="p-4">
              <h3 className="font-semibold text-slate-900 truncate leading-snug">{art.title}</h3>
              {art.description && (
                <p className="mt-1 text-xs text-slate-500 line-clamp-2 leading-relaxed">{art.description}</p>
              )}
              <div className="mt-3 flex items-center justify-between gap-2">
                <span className="font-display text-base font-semibold text-slate-900">{formatSek(art.price)}</span>
                <span className="text-xs text-slate-400 capitalize bg-stone-50 px-2.5 py-0.5 rounded-full ring-1 ring-stone-200/80 flex-shrink-0">
                  {art.category}
                </span>
              </div>
            </div>
          </div>
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
      {/* Header */}
      <div className="-mx-6 -mt-6 mb-6 px-6 py-10 md:py-14 bg-gradient-to-br from-[#f6f2ea] via-amber-50/60 to-stone-100 border-b border-stone-200/80">
        <div className="max-w-7xl mx-auto">
          <PageHeader
            title="Marknadsplats"
            description="Upptäck och köp unik konst från talangfulla konstnärer"
            className="mb-4"
          >
            <div className="flex gap-2 flex-wrap mb-4">
              <span className="px-3 py-1.5 bg-white/70 text-stone-600 rounded-full text-sm ring-1 ring-stone-200/80">
                {total} konstverk
              </span>
              <span className="px-3 py-1.5 bg-white/70 text-stone-600 rounded-full text-sm ring-1 ring-stone-200/80">
                {categories.length} kategorier
              </span>
            </div>
            <Button asChild className="bg-amber-400 text-slate-950 hover:bg-amber-300 shadow-sm border-0">
              <Link href="/artworks/new">Lägg upp konst</Link>
            </Button>
          </PageHeader>
        </div>
      </div>

      {/* Filters Section */}
      <div className="bg-white border border-stone-200/80 rounded-2xl p-5 shadow-sm">
        <div className="space-y-5">
          <Input
            placeholder="Sök efter titel, konstnär eller beskrivning..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="rounded-xl"
          />

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <label className="block text-xs font-medium mb-1.5 text-stone-500">Minsta pris</label>
              <Input
                type="number"
                placeholder="0 kr"
                value={minPrice}
                onChange={(e) => setMinPrice(e.target.value)}
                className="rounded-xl"
              />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1.5 text-stone-500">Högsta pris</label>
              <Input
                type="number"
                placeholder="Obegränsat"
                value={maxPrice}
                onChange={(e) => setMaxPrice(e.target.value)}
                className="rounded-xl"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs font-medium mb-1.5 text-stone-500">Sortera</label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="w-full px-3 py-2 border border-stone-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-stone-400 bg-white text-sm text-slate-700"
              >
                <option value="newest">Senaste</option>
                <option value="price-asc">Pris: låg–hög</option>
                <option value="price-desc">Pris: hög–låg</option>
                <option value="name">Namn: A-Ö</option>
              </select>
            </div>
          </div>

          <div className="flex items-center gap-2 text-sm flex-wrap">
            <button
              onClick={() => setSelectedCategory('')}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${!selectedCategory ? 'bg-stone-900 text-white' : 'border border-stone-200 text-stone-600 hover:border-stone-400 hover:bg-stone-50'}`}
            >
              Alla
            </button>
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${selectedCategory === cat ? 'bg-stone-900 text-white' : 'border border-stone-200 text-stone-600 hover:border-stone-400 hover:bg-stone-50'}`}
              >
                {cat.charAt(0).toUpperCase() + cat.slice(1)}
              </button>
            ))}
          </div>

          {/* Active Filters */}
          {(searchQuery || selectedCategory || minPrice || maxPrice) && (
            <div className="flex flex-wrap gap-2 items-center pt-4 border-t border-stone-100">
              <span className="text-xs text-stone-500">Aktiva filter:</span>
              {searchQuery && (
                <span className="px-3 py-1 bg-stone-100 text-stone-700 rounded-full text-xs">
                  &quot;{searchQuery}&quot;
                </span>
              )}
              {selectedCategory && (
                <span className="px-3 py-1 bg-stone-100 text-stone-700 rounded-full text-xs">
                  {selectedCategory}
                </span>
              )}
              {minPrice && (
                <span className="px-3 py-1 bg-stone-100 text-stone-700 rounded-full text-xs">
                  Min: {formatSek(Number(minPrice))}
                </span>
              )}
              {maxPrice && (
                <span className="px-3 py-1 bg-stone-100 text-stone-700 rounded-full text-xs">
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
                className="px-3 py-1 bg-stone-100 hover:bg-stone-200 text-stone-600 rounded-full text-xs transition-colors"
              >
                Rensa
              </button>
            </div>
          )}
        </div>
      </div>

      {error && (
        <div className="rounded-2xl border border-red-100 bg-red-50/80 p-5 text-sm text-red-700 font-medium">
          {error}
        </div>
      )}
      {isLoading ? (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <ArtworkCardSkeleton key={i} />
          ))}
        </div>
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
          className="px-4 py-1.5 rounded-full border border-stone-200 text-sm text-stone-600 hover:bg-stone-50 disabled:opacity-40 transition-colors"
        >
          ← Föregående
        </button>
        <span className="text-sm text-stone-500">Sida {page} av {Math.max(1, Math.ceil(total / pageSize))}</span>
        <button
          onClick={() => setPage((p) => p + 1)}
          disabled={page >= Math.ceil(total / pageSize)}
          aria-label="Nästa sida"
          className="px-4 py-1.5 rounded-full border border-stone-200 text-sm text-stone-600 hover:bg-stone-50 disabled:opacity-40 transition-colors"
        >
          Nästa →
        </button>
      </div>
    </div>
  );
}

