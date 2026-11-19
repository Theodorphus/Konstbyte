'use client';

import { useState } from 'react';
import { formatSek } from '@/lib/currency';

interface ArtworkItem {
  id: string;
  title: string;
  price: number;
  owner: {
    name: string | null;
    email: string;
  };
  imageUrl: string | null;
  removedByAdmin: boolean;
}

export default function ArtworksAdmin({ initial }: { initial: ArtworkItem[] }) {
  const [artworks, setArtworks] = useState(initial);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleDelete = async (id: string) => {
    if (!confirm('Är du säker på att du vill ta bort detta konstverk?')) {
      return;
    }

    setDeleting(id);
    setError(null);

    try {
      const response = await fetch(`/api/admin/artworks/${id}`, {
        method: 'DELETE',
      });

      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data.error || 'Failed to delete artwork');
      }

      // Artworks with orders are hidden (kept for the order history), not deleted.
      setArtworks((prev) =>
        data.unpublished
          ? prev.map((art) => (art.id === id ? { ...art, removedByAdmin: true } : art))
          : prev.filter((art) => art.id !== id),
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setDeleting(null);
    }
  };

  const handleRestore = async (id: string) => {
    setDeleting(id);
    setError(null);
    try {
      const response = await fetch(`/api/admin/artworks/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'restore' }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || 'Kunde inte återställa');
      setArtworks((prev) => prev.map((art) => (art.id === id ? { ...art, removedByAdmin: false } : art)));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setDeleting(null);
    }
  };

  return (
    <section className="rounded-md border border-slate-200 p-4">
      <h2 className="text-lg font-medium mb-4">Konstverk (moderering)</h2>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded text-red-800 text-sm">
          Fel: {error}
        </div>
      )}

      {artworks.length === 0 ? (
        <p className="text-sm text-slate-600">Inga konstverk</p>
      ) : (
        <div className="space-y-2">
          {artworks.map((art) => (
            <div
              key={art.id}
              className="flex items-center justify-between p-3 border border-slate-100 rounded hover:bg-slate-50"
            >
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{art.title}</p>
                <p className="text-xs text-slate-600">
                  {art.owner.name || art.owner.email} · {formatSek(art.price)}
                  {art.removedByAdmin && <span className="ml-2 font-medium text-red-600">Borttaget av admin</span>}
                </p>
              </div>
              {art.removedByAdmin ? (
                <button
                  onClick={() => handleRestore(art.id)}
                  disabled={deleting === art.id}
                  className="ml-3 px-3 py-1 text-sm font-medium text-emerald-700 hover:bg-emerald-50 rounded border border-emerald-200 disabled:opacity-50 whitespace-nowrap"
                >
                  {deleting === art.id ? 'Återställer...' : 'Återställ'}
                </button>
              ) : (
              <button
                onClick={() => handleDelete(art.id)}
                disabled={deleting === art.id}
                className="ml-3 px-3 py-1 text-sm font-medium text-red-600 hover:bg-red-50 rounded border border-red-200 disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
              >
                {deleting === art.id ? 'Tar bort...' : 'Ta bort'}
              </button>
              )}
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
