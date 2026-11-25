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

// Common reasons. The artist sees the chosen reason (plus any details) in the
// notice and email they get.
const REASONS = [
  'Bryter mot våra innehållsregler',
  'Upphovsrätt: verket verkar inte vara ditt eget',
  'Vilseledande annons (bild, pris eller beskrivning stämmer inte)',
  'Spam eller dubblett av ett annat verk',
];
const OTHER = 'other';

export default function ArtworksAdmin({ initial }: { initial: ArtworkItem[] }) {
  const [artworks, setArtworks] = useState(initial);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  // The artwork whose removal form is open, and what has been filled in.
  const [removing, setRemoving] = useState<string | null>(null);
  const [choice, setChoice] = useState(REASONS[0]);
  const [details, setDetails] = useState('');

  const openRemoval = (id: string) => {
    setRemoving(id);
    setChoice(REASONS[0]);
    setDetails('');
    setError(null);
  };

  const reasonText = () => {
    const extra = details.trim();
    if (choice === OTHER) return extra;
    return extra ? `${choice}. ${extra}` : choice;
  };

  const handleDelete = async (id: string) => {
    const reason = reasonText();
    if (reason.length < 3) {
      setError('Skriv varför verket tas bort. Konstnären får se skälet.');
      return;
    }

    setBusy(id);
    setError(null);

    try {
      const response = await fetch(`/api/admin/artworks/${id}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason }),
      });

      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data.error || 'Kunde inte ta bort konstverket');
      }

      // Artworks with orders are hidden (kept for the order history), not deleted.
      setArtworks((prev) =>
        data.unpublished
          ? prev.map((art) => (art.id === id ? { ...art, removedByAdmin: true } : art))
          : prev.filter((art) => art.id !== id),
      );
      setRemoving(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setBusy(null);
    }
  };

  const handleRestore = async (id: string) => {
    setBusy(id);
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
      setBusy(null);
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
            <div key={art.id} className="p-3 border border-slate-100 rounded hover:bg-slate-50">
              <div className="flex items-center justify-between">
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
                    disabled={busy === art.id}
                    className="ml-3 px-3 py-1 text-sm font-medium text-emerald-700 hover:bg-emerald-50 rounded border border-emerald-200 disabled:opacity-50 whitespace-nowrap"
                  >
                    {busy === art.id ? 'Återställer...' : 'Återställ'}
                  </button>
                ) : removing !== art.id ? (
                  <button
                    onClick={() => openRemoval(art.id)}
                    className="ml-3 px-3 py-1 text-sm font-medium text-red-600 hover:bg-red-50 rounded border border-red-200 whitespace-nowrap"
                  >
                    Ta bort
                  </button>
                ) : null}
              </div>

              {removing === art.id && (
                <form
                  className="mt-3 space-y-2 rounded border border-red-100 bg-red-50/50 p-3"
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleDelete(art.id);
                  }}
                >
                  <label className="block text-xs font-medium text-slate-700" htmlFor={`reason-${art.id}`}>
                    Skäl (konstnären får se det i en notis och ett mejl)
                  </label>
                  <select
                    id={`reason-${art.id}`}
                    value={choice}
                    onChange={(e) => setChoice(e.target.value)}
                    className="w-full rounded border border-slate-200 bg-white px-2 py-1.5 text-sm"
                  >
                    {REASONS.map((r) => (
                      <option key={r} value={r}>{r}</option>
                    ))}
                    <option value={OTHER}>Annat (skriv nedan)</option>
                  </select>
                  <textarea
                    value={details}
                    onChange={(e) => setDetails(e.target.value)}
                    maxLength={800}
                    rows={2}
                    aria-label="Mer om skälet"
                    placeholder={choice === OTHER ? 'Skriv skälet' : 'Mer om skälet (valfritt)'}
                    className="w-full rounded border border-slate-200 bg-white px-2 py-1.5 text-sm"
                  />
                  <div className="flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setRemoving(null)}
                      className="px-3 py-1 text-sm text-slate-600 hover:bg-slate-100 rounded"
                    >
                      Avbryt
                    </button>
                    <button
                      type="submit"
                      disabled={busy === art.id}
                      className="px-3 py-1 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded disabled:opacity-50 whitespace-nowrap"
                    >
                      {busy === art.id ? 'Tar bort...' : 'Ta bort och meddela konstnären'}
                    </button>
                  </div>
                </form>
              )}
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
