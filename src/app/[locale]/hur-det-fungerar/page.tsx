import { alternatesFor } from '@/lib/seo';
import { Link } from '@/i18n/navigation';
import HowItWorksSteps from '@/components/HowItWorksSteps';
import { getTranslations } from 'next-intl/server';
import type { Metadata } from 'next';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const isSv = locale !== 'en';
  return {
    title: isSv ? 'Hur det fungerar' : 'How it works',
    description: isSv
      ? 'Lär dig hur Konstbyte fungerar — skapa konto, ladda upp konst och börja sälja på tre enkla steg.'
      : 'Learn how Konstbyte works — create an account, upload art and start selling in three easy steps.',
    alternates: alternatesFor(locale, '/hur-det-fungerar'),
    openGraph: { images: ['/og-image.png'] },
  };
}

export default async function HowItWorksPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const [t, home] = await Promise.all([
    getTranslations({ locale, namespace: 'how_it_works' }),
    getTranslations({ locale, namespace: 'home' }),
  ]);
  return (
    <div className="space-y-10 pb-16">
      <div className="space-y-3">
        <p className="text-xs uppercase tracking-[0.3em] text-slate-500">{home('how_it_works_label')}</p>
        <h1 className="font-display text-4xl text-slate-900 md:text-5xl">{t('title')}</h1>
      </div>
      <HowItWorksSteps locale={locale} />
      <div className="flex flex-wrap gap-3">
        <Link
          href="/join"
          className="inline-flex items-center justify-center rounded-full bg-slate-900 px-7 py-3 text-sm font-semibold text-white hover:bg-slate-800 transition-colors"
        >
          {home('cta_start')}
        </Link>
        <Link
          href="/avgifter"
          className="inline-flex items-center justify-center rounded-full border border-slate-300 px-7 py-3 text-sm font-semibold text-slate-900 hover:bg-slate-50 transition-colors"
        >
          {home('see_all_fees')}
        </Link>
      </div>
    </div>
  );
}
