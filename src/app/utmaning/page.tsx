'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import SafeImage from '../../components/SafeImage';
import UploadImageButton from '../../components/UploadImageButton';

type Artist = { id: string; name: string | null; image: string | null };

type Submission = {
  id: string;
  title: string;
  description: string | null;
  imageUrl: string;
  price: number | null;
  artist: Artist;
  likeCount: number | null;
  hasLiked: boolean;
};

type Challenge = {
  id: string;
  title: string;
  description: string;
  themePrompt: string;
  weekNumber: number;
  year: number;
  startsAt: string;
  endsAt: string;
  isActive: boolean;
  submissions: Submission[];
};

type HallEntry = {
  id: string;
  title: string;
  weekNumber: number;
  year: number;
  endsAt: string;
  topSubmission: { id: string; title: string; imageUrl: string; artist: Artist; likeCount: number } | null;
};

type LeaderboardEntry = { userId: string; points: number; user: Artist };

function Countdown({ endsAt }: { endsAt: string }) {
  const [label, setLabel] = useState('');
  useEffect(() => {
    const tick = () => {
      const diff = new Date(endsAt).getTime() - Date.now();
      if (diff <= 0) { setLabel('Avslutad'); return; }
      const d = Math.floor(diff / 86400000);
      const h = Math.floor((diff % 86400000) / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      setLabel(`${d}d ${h}t ${m}m ${s}s`);
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [endsAt]);
  return <span className="text-2xl font-mono font-bold">{label}</span>;
}

export default function UtmaningPage() {
  const { data: session } = useSession();
  const isLoggedIn = !!session;

  const [data, setData] = useState<{
    current: Challenge | null;
    hallOfFame: HallEntry[];
    leaderboard: LeaderboardEntry[];
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({ title: '', description: '', imageUrl: '', price: '' });

  useEffect(() => {
    fetch('/api/challenges')
      .then(r => r.json())
      .then(setData)
      .finally(() => setLoading(false));
  }, []);

  function patchSub(id: string, patch: Partial<Submission>) {
    setData(prev => prev?.current ? {
      ...prev,
      current: {
        ...prev.current,
        submissions: prev.current.submissions.map(s => s.id === id ? { ...s, ...patch } : s),
      },
    } : prev);
  }

  async function handleLike(s: Submission) {
    if (!isLoggedIn) { alert('Du måste vara inloggad för att gilla'); return; }
    const res = await fetch(`/api/challenges/submissions/${s.id}/like`, { method: 'POST' });
    if (res.ok) {
      const { liked } = await res.json();
      patchSub(s.id, { hasLiked: liked });
    } else {
      const d = await res.json();
      alert(d.error || 'Något gick fel');
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!data?.current || !form.imageUrl) return;
    setSubmitting(true);
    try {
      const res = await fetch(`/api/challenges/${data.current.id}/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const sub = await res.json();
      if (res.ok) {
        setData(prev => prev?.current ? {
          ...prev,
          current: { ...prev.current, submissions: [sub, ...prev.current.submissions] },
        } : prev);
        setShowForm(false);
        setForm({ title: '', description: '', imageUrl: '', price: '' });
      } else {
        alert(sub.error || 'Fel vid inskickning');
      }
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) return <div className="text-center py-20 text-slate-500">Laddar...</div>;

  const { current, hallOfFame, leaderboard } = data ?? { current: null, hallOfFame: [], leaderboard: [] };

  return (
    <div className="max-w-4xl mx-auto space-y-10 pb-16">

      {/* Hero */}
      {current ? (
        <div className={`rounded-2xl p-8 text-white ${current.isActive
          ? 'bg-gradient-to-r from-purple-600 via-pink-500 to-orange-400'
          : 'bg-gradient-to-r from-slate-700 to-slate-900'}`}
        >
          <p className="text-sm opacity-75 mb-1">
            Vecka {current.weekNumber} · {current.year}
            {!current.isActive && ' · Avslutad'}
          </p>
          <h1 className="text-3xl font-bold mb-3">{current.title}</h1>
          <p className="opacity-90 mb-6 max-w-2xl">{current.description}</p>
          {current.isActive ? (
            <div className="flex items-center gap-8 flex-wrap">
              <div>
                <p className="text-xs opacity-70 mb-1">Avslutas om</p>
                <Countdown endsAt={current.endsAt} />
              </div>
              {isLoggedIn ? (
                <button
                  onClick={() => setShowForm(!showForm)}
                  className="px-6 py-2.5 bg-white text-purple-700 font-semibold rounded-lg hover:bg-purple-50 transition"
                >
                  {showForm ? 'Stäng formulär' : '🎨 Delta i utmaningen'}
                </button>
              ) : (
                <Link
                  href="/auth/signin"
                  className="px-6 py-2.5 bg-white text-purple-700 font-semibold rounded-lg hover:bg-purple-50 transition"
                >
                  Logga in för att delta
                </Link>
              )}
            </div>
          ) : (
            <p className="text-sm opacity-75">Utmaningen är avslutad — se resultaten nedan.</p>
          )}
        </div>
      ) : (
        <div className="text-center py-16">
          <h1 className="text-3xl font-bold mb-3">Veckans Konstutmaning</h1>
          <p className="text-slate-500">Ingen aktiv utmaning just nu. Se Hall of Fame nedan!</p>
        </div>
      )}

      {/* Submit form */}
      {showForm && current?.isActive && (
        <div className="bg-white border rounded-xl p-6 shadow-sm">
          <h2 className="text-lg font-semibold mb-4">Skicka in ditt bidrag</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Titel *</label>
              <input
                required
                value={form.title}
                onChange={e => setForm(p => ({ ...p, title: e.target.value }))}
                className="w-full px-3 py-2 border rounded text-sm"
                placeholder="Titeln på ditt verk"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Beskrivning</label>
              <textarea
                value={form.description}
                onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
                className="w-full px-3 py-2 border rounded text-sm"
                rows={3}
                placeholder="Berätta om ditt verk..."
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Bild *</label>
              <UploadImageButton onUploaded={url => setForm(p => ({ ...p, imageUrl: url }))} />
              {form.imageUrl && <p className="text-xs text-green-600 mt-1">✓ Bild uppladdad</p>}
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Pris (SEK, valfritt)</label>
              <input
                type="number"
                value={form.price}
                onChange={e => setForm(p => ({ ...p, price: e.target.value }))}
                className="w-full px-3 py-2 border rounded text-sm"
                placeholder="Lämna tomt om verket ej är till salu"
              />
            </div>
            <button
              type="submit"
              disabled={submitting || !form.imageUrl}
              className="px-4 py-2 rounded-md bg-blue-600 text-white font-medium hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              {submitting ? 'Skickar...' : 'Skicka in bidrag'}
            </button>
          </form>
        </div>
      )}

      {/* Submissions grid */}
      {current && current.submissions.length > 0 && (
        <div>
          <h2 className="text-xl font-semibold mb-2">
            {current.isActive ? `Bidrag (${current.submissions.length})` : `Resultat — ${current.submissions.length} bidrag`}
          </h2>
          {current.isActive && (
            <p className="text-sm text-slate-500 mb-4">
              Bidragen visas i slumpmässig ordning. Gilla-siffrorna döljs tills utmaningen är slut.
            </p>
          )}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {current.submissions.map((s, i) => (
              <div key={s.id} className="bg-white border rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                {!current.isActive && i === 0 && (
                  <div className="bg-yellow-400 text-yellow-900 text-xs font-bold px-3 py-1 text-center tracking-wide">
                    🏆 Vinnare
                  </div>
                )}
                <div className="aspect-square relative bg-slate-100">
                  <SafeImage src={s.imageUrl} alt={s.title} fill className="object-cover" />
                </div>
                <div className="p-3">
                  <h3 className="font-semibold text-sm truncate">{s.title}</h3>
                  <p className="text-xs text-slate-500 mb-2">{s.artist.name || 'Anonym'}</p>
                  {s.description && (
                    <p className="text-xs text-slate-600 line-clamp-2 mb-2">{s.description}</p>
                  )}
                  <div className="flex items-center justify-between">
                    <button
                      onClick={() => handleLike(s)}
                      className={`flex items-center gap-1.5 text-sm px-3 py-1 rounded-full border transition ${
                        s.hasLiked
                          ? 'bg-pink-50 border-pink-300 text-pink-600'
                          : 'border-slate-200 hover:border-pink-300 hover:text-pink-600'
                      }`}
                    >
                      {s.hasLiked ? '❤️' : '🤍'}
                      <span>{s.likeCount !== null ? s.likeCount : '—'}</span>
                    </button>
                    {s.price != null && (
                      <span className="text-xs font-semibold text-slate-700">
                        {s.price.toLocaleString('sv-SE')} kr
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Points leaderboard */}
      {leaderboard.length > 0 && (
        <div>
          <h2 className="text-xl font-semibold mb-4">🥇 Poängtavla</h2>
          <div className="bg-white border rounded-xl overflow-hidden">
            {leaderboard.map((entry, i) => (
              <div
                key={entry.userId}
                className={`flex items-center gap-3 px-4 py-3 ${i < leaderboard.length - 1 ? 'border-b' : ''}`}
              >
                <span className="w-6 text-sm font-bold text-slate-400">{i + 1}</span>
                {entry.user.image && (
                  <img src={entry.user.image} alt="" className="w-8 h-8 rounded-full" />
                )}
                <span className="flex-1 text-sm font-medium">{entry.user.name || 'Anonym'}</span>
                <span className="text-sm font-bold text-purple-600">{entry.points} p</span>
              </div>
            ))}
          </div>
          <p className="text-xs text-slate-400 mt-2">
            Poäng: +10 för att delta · +1 per like du får · +50 för att vinna
          </p>
        </div>
      )}

      {/* Hall of Fame */}
      {hallOfFame.length > 0 && (
        <div>
          <h2 className="text-xl font-semibold mb-4">🏛️ Hall of Fame</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {hallOfFame.map(entry => (
              <div key={entry.id} className="bg-white border rounded-xl overflow-hidden shadow-sm flex">
                {entry.topSubmission && (
                  <div className="w-28 flex-shrink-0 relative bg-slate-100">
                    <SafeImage
                      src={entry.topSubmission.imageUrl}
                      alt={entry.topSubmission.title}
                      fill
                      className="object-cover"
                    />
                  </div>
                )}
                <div className="flex-1 p-3 min-w-0">
                  <p className="text-xs text-slate-400">Vecka {entry.weekNumber} · {entry.year}</p>
                  <p className="font-semibold text-sm truncate">{entry.title}</p>
                  {entry.topSubmission ? (
                    <>
                      <p className="text-sm mt-1 truncate font-medium">🥇 {entry.topSubmission.title}</p>
                      <p className="text-xs text-slate-500">
                        {entry.topSubmission.artist.name || 'Anonym'} · {entry.topSubmission.likeCount} ❤️
                      </p>
                    </>
                  ) : (
                    <p className="text-xs text-slate-400 mt-1">Inga bidrag</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
