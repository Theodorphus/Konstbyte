'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Link } from '@/i18n/navigation';
import { useTranslations } from 'next-intl';

export default function InspirationPage() {
  const t = useTranslations('ai');
  const [prompt, setPrompt] = useState('');
  const [result, setResult] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const examplePrompts = t.raw('example_prompts') as string[];

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError('');
    setResult('');

    try {
      const res = await fetch('/api/ai/inspiration', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: prompt || 'Generera kreativa idéer för målning' }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (res.status === 503) {
          setError(t('error_not_configured'));
        } else {
          setError(data.error || t('error_generic'));
        }
      } else {
        setResult(data.inspiration || t('no_inspiration'));
      }
    } catch (error) {
      console.error(error);
      setError(t('error_network'));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-8">

      {/* Header */}
      <div className="space-y-4">
        <Link
          href="/ai"
          className="inline-flex items-center gap-1.5 text-sm text-slate-400 hover:text-slate-700 transition-colors"
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" />
          </svg>
          {t('back')}
        </Link>

        <div className="rounded-2xl bg-gradient-to-br from-violet-500 to-purple-600 p-6 text-white space-y-2 shadow-sm">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09ZM18.259 8.715 18 9.75l-.259-1.035a3.375 3.375 0 0 0-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 0 0 2.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 0 0 2.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 0 0-2.456 2.456Z" />
              </svg>
            </div>
            <span className="text-xs font-semibold tracking-widest uppercase text-violet-200">Konstbyte AI</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight">{t('inspiration_title')}</h1>
          <p className="text-sm text-violet-100 leading-relaxed">
            {t('inspiration_subtitle')}
          </p>
        </div>
      </div>

      {/* Form card */}
      <div className="rounded-2xl border border-violet-100 bg-white p-6 shadow-sm space-y-5">
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-2">
            <label className="block text-sm font-semibold text-slate-800">
              {t('describe_idea')}
              <span className="ml-1.5 text-slate-400 font-normal">{t('optional')}</span>
            </label>
            <Input
              placeholder={t('placeholder_inspiration')}
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              className="bg-violet-50 border-violet-200 focus:border-violet-400 focus:ring-violet-100 rounded-xl h-11 placeholder:text-slate-400"
            />
            <p className="text-xs text-slate-400">
              {t('leave_empty')}
            </p>
          </div>

          {error && (
            <div className="flex items-start gap-2.5 p-3.5 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600">
              <svg className="w-4 h-4 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z" />
              </svg>
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-violet-500 text-white text-sm font-semibold hover:bg-violet-600 active:bg-violet-700 transition-colors duration-150 disabled:opacity-50 shadow-sm shadow-violet-100"
          >
            {loading ? (
              <>
                <svg className="animate-spin h-4 w-4 opacity-80" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                {t('generating_inspiration')}
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09Z" />
                </svg>
                {t('create_ideas')}
              </>
            )}
          </button>
        </form>
      </div>

      {/* Example prompts */}
      {!result && !loading && (
        <div className="space-y-3">
          <p className="text-xs font-semibold tracking-widest uppercase text-slate-500">
            {t('try_example')}
          </p>
          <div className="flex flex-wrap gap-2">
            {examplePrompts.map((example, i) => (
              <button
                key={i}
                onClick={() => setPrompt(example)}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full border border-stone-200 bg-stone-50 text-sm text-slate-600 font-medium hover:bg-stone-100 hover:border-stone-300 transition-all duration-150"
              >
                <svg className="w-3 h-3 text-stone-400" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09Z" />
                </svg>
                {example}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Result */}
      {result && (
        <div className="rounded-2xl border border-amber-300 bg-gradient-to-br from-amber-50 to-orange-50 p-6 space-y-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-amber-400 flex items-center justify-center">
                <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09Z" />
                </svg>
              </div>
              <span className="text-sm font-bold text-amber-900">{t('your_ideas')}</span>
            </div>
            <Button
              size="sm"
              variant="outline"
              onClick={() => { setResult(''); setPrompt(''); }}
              className="text-xs border-amber-300 text-amber-700 hover:bg-amber-100"
            >
              {t('new_search')}
            </Button>
          </div>
          <div className="h-px bg-amber-200" />
          <p className="text-sm text-slate-800 leading-relaxed whitespace-pre-wrap">
            {result}
          </p>
        </div>
      )}
    </div>
  );
}
