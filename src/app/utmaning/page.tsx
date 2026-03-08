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

function CountdownUnit({ value, label }: { value: string; label: string }) {
  return (
    <div className="flex flex-col items-center min-w-[3rem]">
      <span className="font-display text-3xl md:text-4xl font-semibold text-white leading-none tabular-nums">
        {value}
      </span>
      <span className="text-[10px] uppercase tracking-[0.15em] text-white/40 mt-1">{label}</span>
    </div>
  );
}

function Countdown({ endsAt }: { endsAt: string }) {
  const [parts, setParts] = useState({ d: '0', h: '00', m: '00', s: '00', ended: false });

  useEffect(() => {
    const tick = () => {
      const diff = new Date(endsAt).getTime() - Date.now();
      if (diff <= 0) {
        setParts({ d: '0', h: '00', m: '00', s: '00', ended: true });
        return;
      }
      const d = String(Math.floor(diff / 86400000));
      const h = String(Math.floor((diff % 86400000) / 3600000)).padStart(2, '0');
      const m = String(Math.floor((diff % 3600000) / 60000)).padStart(2, '0');
      const s = String(Math.floor((diff % 60000) / 1000)).padStart(2, '0');
      setParts({ d, h, m, s, ended: false });
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [endsAt]);

  if (parts.ended) return <span className="text-white/60 text-sm">Avslutad</span>;

  return (
    <div className="flex items-end gap-3">
      <CountdownUnit value={parts.d} label="dagar" />
      <span className="font-display text-2xl text-white/30 mb-1">:</span>
      <CountdownUnit value={parts.h} label="tim" />
      <span className="font-display text-2xl text-white/30 mb-1">:</span>
      <CountdownUnit value={parts.m} label="min" />
      <span className="font-display text-2xl text-white/30 mb-1">:</span>
      <CountdownUnit value={parts.s} label="sek" />
    </div>
  );
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

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto py-24 flex flex-col items-center gap-3">
        <div className="w-8 h-8 rounded-full border-2 border-stone-300 border-t-stone-600 animate-spin" />
        <p className="text-sm text-stone-400">Laddar utmaning…</p>
      </div>
    );
  }

  const { current, hallOfFame, leaderboard } = data ?? { current: null, hallOfFame: [], leaderboard: [] };

  return (
    <div className="max-w-4xl mx-auto space-y-10 pb-16">

      {/* Hero */}
      {current ? (
        <div className={`relative overflow-hidden rounded-2xl text-white ${
          current.isActive
            ? 'bg-gradient-to-br from-violet-950 via-indigo-950 to-slate-900'
            : 'bg-gradient-to-br from-stone-800 to-stone-900'
        }`}>
          {/* Color layers for active state */}
          {current.isActive && (
            <>
              {/* Amber warmth bottom-left */}
              <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_5%_90%,_rgba(251,191,36,0.45),_transparent_50%)]" />
              {/* Rose/fuchsia accent top-right */}
              <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_95%_5%,_rgba(232,72,142,0.35),_transparent_50%)]" />
              {/* Indigo/teal center glow */}
              <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_60%_55%,_rgba(99,102,241,0.22),_transparent_50%)]" />
              {/* Soft left vignette for text legibility */}
              <div className="absolute inset-0 bg-gradient-to-r from-violet-950/40 to-transparent" />
            </>
          )}

          <div className="relative p-8 md:p-10">
            <p className="text-[11px] uppercase tracking-[0.25em] text-white/50 mb-3">
              Vecka {current.weekNumber} · {current.year}
              {!current.isActive && ' · Avslutad'}
            </p>
            <h1 className="font-display text-3xl md:text-4xl text-white leading-tight mb-4">
              {current.title}
            </h1>
            <p className="text-white/65 leading-relaxed max-w-2xl text-sm md:text-base mb-8">
              {current.description}
            </p>

            {current.isActive ? (
              <div className="flex flex-col sm:flex-row sm:items-end gap-8">
                <div>
                  <p className="text-[10px] uppercase tracking-[0.2em] text-white/35 mb-3">Avslutas om</p>
                  <Countdown endsAt={current.endsAt} />
                </div>
                <div className="sm:mb-0.5">
                  {isLoggedIn ? (
                    <button
                      onClick={() => setShowForm(!showForm)}
                      className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-amber-300 text-slate-950 text-sm font-semibold hover:bg-amber-200 transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-amber-400/20"
                    >
                      {showForm ? 'Stäng formulär' : (
                        <>
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          Delta i utmaningen
                        </>
                      )}
                    </button>
                  ) : (
                    <Link
                      href="/auth/signin"
                      className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-white/[0.1] border border-white/[0.18] text-white/85 text-sm font-semibold backdrop-blur-sm hover:bg-white/[0.16] hover:text-white transition-all duration-200"
                    >
                      Logga in för att delta
                    </Link>
                  )}
                </div>
              </div>
            ) : (
              <p className="text-sm text-white/45">Utmaningen är avslutad — se resultaten nedan.</p>
            )}
          </div>
        </div>
      ) : (
        <div className="rounded-2xl border border-stone-200/80 bg-white/80 p-12 text-center shadow-sm">
          <p className="text-xs uppercase tracking-[0.25em] text-stone-400 mb-3">Utmaning</p>
          <h1 className="font-display text-3xl text-slate-900 mb-3">Veckans Konstutmaning</h1>
          <p className="text-slate-500 text-sm">Ingen aktiv utmaning just nu. Se Hall of Fame nedan.</p>
        </div>
      )}

      {/* Submit form */}
      {showForm && current?.isActive && (
        <div className="rounded-2xl border border-stone-200/80 bg-white/90 p-6 shadow-sm">
          <h2 className="font-display text-xl text-slate-900 mb-5">Skicka in ditt bidrag</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-stone-500 uppercase tracking-wide mb-1.5">Titel *</label>
              <input
                required
                value={form.title}
                onChange={e => setForm(p => ({ ...p, title: e.target.value }))}
                className="w-full px-3 py-2.5 border border-stone-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-amber-400/50 focus:border-amber-300 transition-colors"
                placeholder="Titeln på ditt verk"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-stone-500 uppercase tracking-wide mb-1.5">Beskrivning</label>
              <textarea
                value={form.description}
                onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
                className="w-full px-3 py-2.5 border border-stone-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-amber-400/50 focus:border-amber-300 transition-colors"
                rows={3}
                placeholder="Berätta om ditt verk och din tolkning av temat…"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-stone-500 uppercase tracking-wide mb-1.5">Bild *</label>
              <UploadImageButton onUploaded={url => setForm(p => ({ ...p, imageUrl: url }))} />
              {form.imageUrl && (
                <p className="text-xs text-green-700 mt-2 flex items-center gap-1.5">
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Bild uppladdad
                </p>
              )}
            </div>
            <div>
              <label className="block text-xs font-medium text-stone-500 uppercase tracking-wide mb-1.5">Pris (SEK, valfritt)</label>
              <input
                type="number"
                value={form.price}
                onChange={e => setForm(p => ({ ...p, price: e.target.value }))}
                className="w-full px-3 py-2.5 border border-stone-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-amber-400/50 focus:border-amber-300 transition-colors"
                placeholder="Lämna tomt om verket ej är till salu"
              />
            </div>
            <button
              type="submit"
              disabled={submitting || !form.imageUrl}
              className="px-6 py-2.5 rounded-full bg-amber-400 text-slate-950 text-sm font-semibold hover:bg-amber-300 transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed shadow-sm"
            >
              {submitting ? 'Skickar…' : 'Skicka in bidrag'}
            </button>
          </form>
        </div>
      )}

      {/* Submissions grid */}
      {current && current.submissions.length > 0 && (
        <div>
          <div className="mb-4">
            <h2 className="font-display text-2xl text-slate-900">
              {current.isActive ? `Bidrag` : `Resultat`}
            </h2>
            {current.isActive ? (
              <p className="text-sm text-slate-500 mt-1">
                {current.submissions.length} bidrag · Gilla-siffrorna döljs tills utmaningen är slut.
              </p>
            ) : (
              <p className="text-sm text-slate-500 mt-1">{current.submissions.length} bidrag</p>
            )}
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {current.submissions.map((s, i) => (
              <div key={s.id} className="bg-white/90 rounded-2xl overflow-hidden ring-1 ring-slate-200/70 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-md hover:shadow-slate-900/8">
                {!current.isActive && i === 0 && (
                  <div className="bg-amber-400 text-slate-900 text-[11px] font-bold px-3 py-1.5 text-center tracking-[0.15em] uppercase">
                    Vinnare
                  </div>
                )}
                <div className="aspect-square relative bg-slate-100">
                  <SafeImage src={s.imageUrl} alt={s.title} fill className="object-cover" />
                </div>
                <div className="p-4">
                  <h3 className="font-semibold text-sm text-slate-900 truncate leading-snug">{s.title}</h3>
                  <p className="text-xs text-slate-400 mt-0.5 mb-2">{s.artist.name || 'Anonym'}</p>
                  {s.description && (
                    <p className="text-xs text-slate-500 line-clamp-2 mb-3 leading-relaxed">{s.description}</p>
                  )}
                  <div className="flex items-center justify-between gap-2">
                    <button
                      onClick={() => handleLike(s)}
                      className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full border transition-all duration-150 ${
                        s.hasLiked
                          ? 'bg-rose-50 border-rose-200 text-rose-600'
                          : 'border-slate-200 text-slate-500 hover:border-rose-200 hover:text-rose-500 hover:bg-rose-50/50'
                      }`}
                    >
                      {s.hasLiked ? '❤️' : '🤍'}
                      <span className="font-medium">{s.likeCount !== null ? s.likeCount : '—'}</span>
                    </button>
                    {s.price != null && (
                      <span className="font-display text-sm font-semibold text-slate-700">
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
          <h2 className="font-display text-2xl text-slate-900 mb-4">Poängtavla</h2>
          <div className="rounded-2xl border border-stone-200/80 bg-white/90 overflow-hidden shadow-sm divide-y divide-stone-100">
            {leaderboard.map((entry, i) => (
              <div
                key={entry.userId}
                className="flex items-center gap-3 px-5 py-3.5 hover:bg-stone-50/60 transition-colors"
              >
                <span className={`w-6 text-sm font-bold tabular-nums ${
                  i === 0 ? 'text-amber-600' : i === 1 ? 'text-stone-500' : 'text-stone-400'
                }`}>
                  {i + 1}
                </span>
                {entry.user.image && (
                  <img src={entry.user.image} alt="" className="w-8 h-8 rounded-full object-cover flex-shrink-0" />
                )}
                <span className="flex-1 text-sm font-medium text-slate-800 truncate">{entry.user.name || 'Anonym'}</span>
                <span className="font-display text-sm font-semibold text-amber-700">{entry.points} p</span>
              </div>
            ))}
          </div>
          <p className="text-xs text-stone-400 mt-2 pl-1">
            +10 för att delta · +1 per like · +50 för att vinna
          </p>
        </div>
      )}

      {/* Hall of Fame */}
      {hallOfFame.length > 0 && (
        <div>
          <h2 className="font-display text-2xl text-slate-900 mb-4">Hall of Fame</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {hallOfFame.map(entry => (
              <div key={entry.id} className="rounded-2xl border border-stone-200/80 bg-white/90 overflow-hidden shadow-sm flex hover:shadow-md transition-shadow duration-200">
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
                <div className="flex-1 p-4 min-w-0">
                  <p className="text-[10px] uppercase tracking-[0.2em] text-stone-400 mb-1">
                    Vecka {entry.weekNumber} · {entry.year}
                  </p>
                  <p className="font-semibold text-sm text-slate-800 truncate">{entry.title}</p>
                  {entry.topSubmission ? (
                    <div className="mt-2">
                      <p className="text-sm font-medium text-slate-700 truncate">{entry.topSubmission.title}</p>
                      <p className="text-xs text-stone-400 mt-0.5">
                        {entry.topSubmission.artist.name || 'Anonym'} · {entry.topSubmission.likeCount} gillar
                      </p>
                    </div>
                  ) : (
                    <p className="text-xs text-stone-400 mt-2">Inga bidrag</p>
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
