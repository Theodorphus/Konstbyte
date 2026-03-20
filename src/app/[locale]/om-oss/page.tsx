import Link from 'next/link';
import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'about' });
  return {
    title: t('title'),
  };
}

export default async function AboutPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'about' });
  const pillars = t.raw('pillars') as Array<{ icon: string; text: string }>;

  return (
    <div className="max-w-2xl mx-auto space-y-10">

      {/* Back link */}
      <Link
        href="/"
        className="inline-flex items-center gap-1.5 text-sm text-slate-400 hover:text-slate-700 transition-colors"
      >
        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" />
        </svg>
        {t('back')}
      </Link>

      {/* Hero */}
      <div className="space-y-3">
        <p className="text-xs font-semibold uppercase tracking-widest text-slate-400">{t('meta_label')}</p>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900 leading-snug">
          {t('heading')}
        </h1>
        <p className="text-base text-slate-600 leading-relaxed">{t('intro')}</p>
      </div>

      {/* Divider */}
      <div className="h-px bg-slate-100" />

      {/* Community paragraph */}
      <p className="text-sm text-slate-600 leading-relaxed">{t('community_text')}</p>

      {/* Pillars */}
      <div className="space-y-4">
        <p className="text-sm font-semibold text-slate-800">{t('pillars_label')}</p>
        <ul className="space-y-3">
          {pillars.map(({ icon, text }) => (
            <li key={text} className="flex items-start gap-3">
              <span className="text-lg leading-none mt-0.5">{icon}</span>
              <span className="text-sm text-slate-600 leading-relaxed">{text}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Closing */}
      <div className="rounded-2xl bg-stone-50 border border-stone-200 p-6 space-y-3">
        <p className="text-sm text-slate-700 leading-relaxed">{t('closing_1')}</p>
        <p className="text-sm font-medium text-slate-900">{t('closing_2')}</p>
        <div className="pt-1">
          <Link
            href="/artworks"
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-amber-600 hover:text-amber-700 transition-colors"
          >
            {t('explore_link')}
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
            </svg>
          </Link>
        </div>
      </div>

    </div>
  );
}
