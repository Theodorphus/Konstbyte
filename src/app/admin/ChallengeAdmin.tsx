'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

type Challenge = {
  id: string;
  title: string;
  weekNumber: number;
  year: number;
  startsAt: string;
  endsAt: string;
  submissionCount: number;
};

function statusLabel(startsAt: string, endsAt: string) {
  const now = Date.now();
  const start = new Date(startsAt).getTime();
  const end = new Date(endsAt).getTime();
  if (now < start) return { label: 'Kommande', cls: 'bg-blue-100 text-blue-700' };
  if (now <= end) return { label: 'Aktiv', cls: 'bg-green-100 text-green-700' };
  return { label: 'Avslutad', cls: 'bg-slate-100 text-slate-500' };
}

function fmt(iso: string) {
  return new Date(iso).toLocaleDateString('sv-SE', { day: 'numeric', month: 'short', year: 'numeric' });
}

// ISO week number helper
function isoWeek(date: Date) {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
}

function nextMonday(from = new Date()) {
  const d = new Date(from);
  const day = d.getDay();
  const daysUntilMonday = day === 0 ? 1 : 8 - day;
  d.setDate(d.getDate() + daysUntilMonday);
  d.setHours(0, 0, 0, 0);
  return d;
}

function toDatetimeLocal(d: Date) {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export default function ChallengeAdmin({ initial }: { initial: Challenge[] }) {
  const router = useRouter();
  const [challenges, setChallenges] = useState<Challenge[]>(initial);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const nextMon = nextMonday();
  const nextSun = new Date(nextMon);
  nextSun.setDate(nextSun.getDate() + 6);
  nextSun.setHours(23, 59, 59, 0);

  const [form, setForm] = useState({
    title: '',
    description: '',
    themePrompt: '',
    weekNumber: String(isoWeek(nextMon)),
    year: String(nextMon.getFullYear()),
    startsAt: toDatetimeLocal(nextMon),
    endsAt: toDatetimeLocal(nextSun),
  });

  function set(key: string, value: string) {
    setForm(p => ({ ...p, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      const res = await fetch('/api/challenges', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          weekNumber: Number(form.weekNumber),
          year: Number(form.year),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Något gick fel');
        return;
      }
      setChallenges(prev => [{ ...data, submissionCount: 0 }, ...prev]);
      setShowForm(false);
      setForm({
        title: '',
        description: '',
        themePrompt: '',
        weekNumber: String(isoWeek(nextMon)),
        year: String(nextMon.getFullYear()),
        startsAt: toDatetimeLocal(nextMon),
        endsAt: toDatetimeLocal(nextSun),
      });
      router.refresh();
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Radera utmaningen? Detta tar även bort alla bidrag.')) return;
    const res = await fetch(`/api/challenges/${id}`, { method: 'DELETE' });
    if (res.ok) {
      setChallenges(prev => prev.filter(c => c.id !== id));
      router.refresh();
    } else {
      const d = await res.json();
      alert(d.error || 'Kunde inte radera');
    }
  }

  return (
    <section className="rounded-md border border-slate-200 p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-medium">Utmaningar</h2>
        <button
          onClick={() => setShowForm(!showForm)}
          className="px-3 py-1.5 text-sm rounded-md bg-slate-900 text-white hover:bg-slate-700 transition-colors"
        >
          {showForm ? 'Avbryt' : '+ Ny utmaning'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-slate-50 rounded-lg p-4 space-y-3 border border-slate-200">
          <h3 className="font-medium text-sm text-slate-700">Skapa ny utmaning</h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="sm:col-span-2">
              <label className="block text-xs font-medium text-slate-600 mb-1">Titel *</label>
              <input
                required
                value={form.title}
                onChange={e => set('title', e.target.value)}
                className="w-full px-3 py-1.5 text-sm border rounded-md"
                placeholder="Veckans utmaning: ..."
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs font-medium text-slate-600 mb-1">Beskrivning</label>
              <textarea
                value={form.description}
                onChange={e => set('description', e.target.value)}
                className="w-full px-3 py-1.5 text-sm border rounded-md"
                rows={2}
                placeholder="Beskriv temat för deltagarna..."
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs font-medium text-slate-600 mb-1">Temaprompt (för AI)</label>
              <input
                value={form.themePrompt}
                onChange={e => set('themePrompt', e.target.value)}
                className="w-full px-3 py-1.5 text-sm border rounded-md"
                placeholder="nyckelord, stil, humör..."
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Veckonummer *</label>
              <input
                required
                type="number"
                min={1}
                max={53}
                value={form.weekNumber}
                onChange={e => set('weekNumber', e.target.value)}
                className="w-full px-3 py-1.5 text-sm border rounded-md"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">År *</label>
              <input
                required
                type="number"
                value={form.year}
                onChange={e => set('year', e.target.value)}
                className="w-full px-3 py-1.5 text-sm border rounded-md"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Starttid *</label>
              <input
                required
                type="datetime-local"
                value={form.startsAt}
                onChange={e => set('startsAt', e.target.value)}
                className="w-full px-3 py-1.5 text-sm border rounded-md"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Sluttid *</label>
              <input
                required
                type="datetime-local"
                value={form.endsAt}
                onChange={e => set('endsAt', e.target.value)}
                className="w-full px-3 py-1.5 text-sm border rounded-md"
              />
            </div>
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <button
            type="submit"
            disabled={saving}
            className="px-4 py-2 text-sm rounded-md bg-blue-600 text-white font-medium hover:bg-blue-700 transition-colors disabled:opacity-50"
          >
            {saving ? 'Skapar...' : 'Skapa utmaning'}
          </button>
        </form>
      )}

      {challenges.length === 0 ? (
        <p className="text-sm text-slate-500">Inga utmaningar ännu.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-slate-400 border-b">
                <th className="pb-2 font-medium">Titel</th>
                <th className="pb-2 font-medium">Vecka</th>
                <th className="pb-2 font-medium">Period</th>
                <th className="pb-2 font-medium">Bidrag</th>
                <th className="pb-2 font-medium">Status</th>
                <th className="pb-2"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {challenges.map(c => {
                const { label, cls } = statusLabel(c.startsAt, c.endsAt);
                return (
                  <tr key={c.id}>
                    <td className="py-2.5 pr-4 font-medium max-w-xs truncate">{c.title}</td>
                    <td className="py-2.5 pr-4 text-slate-500">v.{c.weekNumber} {c.year}</td>
                    <td className="py-2.5 pr-4 text-slate-500 whitespace-nowrap">{fmt(c.startsAt)} – {fmt(c.endsAt)}</td>
                    <td className="py-2.5 pr-4 text-slate-500">{c.submissionCount}</td>
                    <td className="py-2.5 pr-4">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${cls}`}>{label}</span>
                    </td>
                    <td className="py-2.5">
                      <button
                        onClick={() => handleDelete(c.id)}
                        className="text-xs text-red-500 hover:text-red-700 transition-colors"
                      >
                        Radera
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
