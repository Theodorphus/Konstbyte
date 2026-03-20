'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import SafeImage from '@/components/SafeImage';
import UploadImageButton from '@/components/UploadImageButton';
import { useTranslations } from 'next-intl';

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
  imageUrl: string | null;
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
  const t = useTranslations('challenge');
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

  if (parts.ended) return <span className="text-white/60 text-sm">{t('ended')}</span>;

  return (
    <div className="flex items-end gap-3">
      <CountdownUnit value={parts.d} label={t('days')} />
      <span className="font-display text-2xl text-white/30 mb-1">:</span>
      <CountdownUnit value={parts.h} label={t('hours')} />
      <span className="font-display text-2xl text-white/30 mb-1">:</span>
      <CountdownUnit value={parts.m} label={t('minutes')} />
      <span className="font-display text-2xl text-white/30 mb-1">:</span>
      <CountdownUnit value={parts.s} label={t('seconds')} />
    </div>
  );
}

export default function UtmaningPage() {
  const { data: session } = useSession();
  const isLoggedIn = !!session;
  const t = useTranslations('challenge');

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

  function removeSub(id: string) {
    setData(prev => prev?.current ? {
      ...prev,
      current: {
        ...prev.current,
        submissions: prev.current.submissions.filter(s => s.id !== id),
      },
    } : prev);
  }

  async function handleDelete(s: Submission) {
    if (!confirm(t('delete_confirm'))) return;
    const res = await fetch(`/api/challenges/submissions/${s.id}`, { method: 'DELETE' });
    if (res.ok) {
      removeSub(s.id);
    } else {
      const d = await res.json();
      alert(d.error || t('error_generic'));
    }
  }

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
    if (!isLoggedIn) { alert(t('login_like')); return; }
    const res = await fetch(`/api/challenges/submissions/${s.id}/like`, { method: 'POST' });
    if (res.ok) {
      const { liked } = await res.json();
      patchSub(s.id, { hasLiked: liked });
    } else {
      const d = await res.json();
      alert(d.error || t('error_generic'));
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
        alert(sub.error || t('submit_error'));
      }
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto py-24 flex flex-col items-center gap-3">
        <div className="w-8 h-8 rounded-full border-2 border-stone-300 border-t-stone-600 animate-spin" />
        <p className="text-sm text-stone-400">{t('loading')}</p>
      </div>
    );
  }

  const { current, hallOfFame, leaderboard } = data ?? { current: null, hallOfFame: [], leaderboard: [] };

  return (
    <div className="max-w-4xl mx-auto space-y-10 pb-16">

      {/* Challenge image banner */}
      {current?.imageUrl && (
        <div className="relative w-full aspect-[16/7] overflow-hidden rounded-2xl bg-slate-100 shadow-md">
          <SafeImage
            src={current.imageUrl}
            alt={current.title}
            fill
            className="object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
        </div>
      )}

      {/* Hero */}
      {current ? (
        <div className={`relative overflow-hidden rounded-2xl text-white ${
          current.isActive
            ? 'bg-gradient-to-br from-violet-950 via-indigo-950 to-slate-900'
            : 'bg-gradient-to-br from-stone-800 to-stone-900'
        }`}>
          {current.isActive && (
            <>
              <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_5%_90%,_rgba(251,191,36,0.45),_transparent_50%)]" />
              <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_95%_5%,_rgba(232,72,142,0.35),_transparent_50%)]" />
              <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_60%_55%,_rgba(99,102,241,0.22),_transparent_50%)]" />
              <div className="absolute inset-0 bg-gradient-to-r from-violet-950/40 to-transparent" />
            </>
          )}

          <div className="relative p-8 md:p-10">
            <p className="text-[11px] uppercase tracking-[0.25em] text-white/50 mb-3">
              {t('week')} {current.weekNumber} · {current.year}
              {!current.isActive && ` ${t('active_ended')}`}
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
                  <p className="text-[10px] uppercase tracking-[0.2em] text-white/35 mb-3">{t('ends_in')}</p>
                  <Countdown endsAt={current.endsAt} />
                </div>
                <div className="sm:mb-0.5">
                  {isLoggedIn ? (
                    <button
                      onClick={() => setShowForm(!showForm)}
                      className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-amber-300 text-slate-950 text-sm font-semibold hover:bg-amber-200 transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-amber-400/20"
                    >
                      {showForm ? t('close_form') : (
                        <>
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          {t('join')}
                        </>
                      )}
                    </button>
                  ) : (
                    <Link
                      href="/auth/signin"
                      className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-white/[0.1] border border-white/[0.18] text-white/85 text-sm font-semibold backdrop-blur-sm hover:bg-white/[0.16] hover:text-white transition-all duration-200"
                    >
                      {t('sign_in_to_join')}
                    </Link>
                  )}
                </div>
              </div>
            ) : (
              <p className="text-sm text-white/45">{t('ended_text')}</p>
            )}
          </div>
        </div>
      ) : (
        <div className="rounded-2xl border border-stone-200/80 bg-white/80 p-12 text-center shadow-sm">
          <p className="text-xs uppercase tracking-[0.25em] text-stone-400 mb-3">{t('title')}</p>
          <h1 className="font-display text-3xl text-slate-900 mb-3">{t('no_challenge_title')}</h1>
          <p className="text-slate-500 text-sm">{t('no_challenge')}</p>
        </div>
      )}

      {/* About the challenge */}
      <div className="rounded-2xl border border-stone-200/80 bg-white/90 p-7 md:p-9 shadow-sm space-y-6">
        <div>
          <p className="text-[11px] uppercase tracking-[0.25em] text-stone-400 mb-2">{t('about_title')}</p>
          <p className="text-slate-700 leading-relaxed">
            {t('about_description')}
          </p>
          <p className="text-slate-600 leading-relaxed mt-3">
            {t('about_description2')}
          </p>
        </div>

        <div className="grid gap-5 sm:grid-cols-3">
          <div className="rounded-xl bg-amber-50 border border-amber-100 p-5">
            <p className="text-lg mb-2">🏆</p>
            <h3 className="font-semibold text-sm text-slate-900 mb-2">{t('prizes_title')}</h3>
            <ul className="text-xs text-slate-600 space-y-1.5 leading-snug">
              {(t.raw('prizes') as string[]).map((prize: string) => (
                <li key={prize}>{prize}</li>
              ))}
            </ul>
          </div>

          <div className="rounded-xl bg-violet-50 border border-violet-100 p-5">
            <p className="text-lg mb-2">💡</p>
            <h3 className="font-semibold text-sm text-slate-900 mb-2">{t('who_title')}</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              {t('who_text')}
            </p>
          </div>

          <div className="rounded-xl bg-sky-50 border border-sky-100 p-5">
            <p className="text-lg mb-2">🎯</p>
            <h3 className="font-semibold text-sm text-slate-900 mb-2">{t('how_title')}</h3>
            <ol className="text-xs text-slate-600 space-y-1.5 leading-snug list-decimal list-inside">
              {(t.raw('how_steps') as string[]).map((step: string) => (
                <li key={step}>{step}</li>
              ))}
            </ol>
          </div>
        </div>
      </div>

      {/* Submit form */}
      {showForm && current?.isActive && (
        <div className="rounded-2xl border border-stone-200/80 bg-white/90 p-6 shadow-sm">
          <h2 className="font-display text-xl text-slate-900 mb-5">{t('submit_title')}</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-stone-500 uppercase tracking-wide mb-1.5">{t('title_label')}</label>
              <input
                required
                value={form.title}
                onChange={e => setForm(p => ({ ...p, title: e.target.value }))}
                className="w-full px-3 py-2.5 border border-stone-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-amber-400/50 focus:border-amber-300 transition-colors"
                placeholder={t('title_placeholder')}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-stone-500 uppercase tracking-wide mb-1.5">{t('description_label')}</label>
              <textarea
                value={form.description}
                onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
                className="w-full px-3 py-2.5 border border-stone-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-amber-400/50 focus:border-amber-300 transition-colors"
                rows={3}
                placeholder={t('description_placeholder')}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-stone-500 uppercase tracking-wide mb-1.5">{t('image_label')}</label>
              <UploadImageButton onUploaded={url => setForm(p => ({ ...p, imageUrl: url }))} />
              {form.imageUrl && (
                <p className="text-xs text-green-700 mt-2 flex items-center gap-1.5">
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  {t('image_uploaded')}
                </p>
              )}
            </div>
            <div>
              <label className="block text-xs font-medium text-stone-500 uppercase tracking-wide mb-1.5">{t('price_label')}</label>
              <input
                type="number"
                value={form.price}
                onChange={e => setForm(p => ({ ...p, price: e.target.value }))}
                className="w-full px-3 py-2.5 border border-stone-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-amber-400/50 focus:border-amber-300 transition-colors"
                placeholder={t('price_placeholder')}
              />
            </div>
            <button
              type="submit"
              disabled={submitting || !form.imageUrl}
              className="px-6 py-2.5 rounded-full bg-amber-400 text-slate-950 text-sm font-semibold hover:bg-amber-300 transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed shadow-sm"
            >
              {submitting ? t('submitting') : t('submit_button')}
            </button>
          </form>
        </div>
      )}

      {/* Submissions grid */}
      {current && current.submissions.length > 0 && (
        <div>
          <div className="mb-4">
            <h2 className="font-display text-2xl text-slate-900">
              {current.isActive ? t('submissions_active') : t('submissions_ended')}
            </h2>
            {current.isActive ? (
              <p className="text-sm text-slate-500 mt-1">
                {t('submissions_count_active', { count: current.submissions.length })}
              </p>
            ) : (
              <p className="text-sm text-slate-500 mt-1">{t('submissions_count', { count: current.submissions.length })}</p>
            )}
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {current.submissions.map((s, i) => (
              <div key={s.id} className="bg-white/90 rounded-2xl overflow-hidden ring-1 ring-slate-200/70 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-md hover:shadow-slate-900/8">
                {!current.isActive && i === 0 && (
                  <div className="bg-amber-400 text-slate-900 text-[11px] font-bold px-3 py-1.5 text-center tracking-[0.15em] uppercase">
                    {t('winner')}
                  </div>
                )}
                <div className="aspect-square relative bg-slate-100">
                  <SafeImage src={s.imageUrl} alt={s.title} fill className="object-cover" />
                </div>
                <div className="p-4">
                  <h3 className="font-semibold text-sm text-slate-900 truncate leading-snug">{s.title}</h3>
                  <p className="text-xs text-slate-400 mt-0.5 mb-2">{s.artist.name || t('anonymous')}</p>
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
                    <div className="flex items-center gap-2">
                      {s.price != null && (
                        <span className="font-display text-sm font-semibold text-slate-700">
                          {s.price.toLocaleString('sv-SE')} kr
                        </span>
                      )}
                      {current.isActive && session?.user && s.artist.id === session.user.id && (
                        <button
                          onClick={() => handleDelete(s)}
                          title={t('delete_submission')}
                          className="flex items-center justify-center w-7 h-7 rounded-full border border-red-200 text-red-400 hover:bg-red-50 hover:border-red-300 hover:text-red-600 transition-all duration-150"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      )}
                    </div>
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
          <h2 className="font-display text-2xl text-slate-900 mb-4">{t('leaderboard')}</h2>
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
                <span className="flex-1 text-sm font-medium text-slate-800 truncate">{entry.user.name || t('anonymous')}</span>
                <span className="font-display text-sm font-semibold text-amber-700">{entry.points} {t('points')}</span>
              </div>
            ))}
          </div>
          <p className="text-xs text-stone-400 mt-2 pl-1">
            {t('points_info')}
          </p>
        </div>
      )}

      {/* Hall of Fame */}
      {hallOfFame.length > 0 && (
        <div>
          <h2 className="font-display text-2xl text-slate-900 mb-4">{t('hall_of_fame')}</h2>
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
                    {t('week')} {entry.weekNumber} · {entry.year}
                  </p>
                  <p className="font-semibold text-sm text-slate-800 truncate">{entry.title}</p>
                  {entry.topSubmission ? (
                    <div className="mt-2">
                      <p className="text-sm font-medium text-slate-700 truncate">{entry.topSubmission.title}</p>
                      <p className="text-xs text-stone-400 mt-0.5">
                        {entry.topSubmission.artist.name || t('anonymous')} · {entry.topSubmission.likeCount} {t('likes')}
                      </p>
                    </div>
                  ) : (
                    <p className="text-xs text-stone-400 mt-2">{t('no_submissions')}</p>
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
