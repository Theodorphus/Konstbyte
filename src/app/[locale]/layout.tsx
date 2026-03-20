import React from 'react';
import Link from 'next/link';
import { NextIntlClientProvider, hasLocale } from 'next-intl';
import { getMessages, getTranslations } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { routing } from '../../i18n/routing';
import ClientLayout from '../ClientLayout';

const currentYear = new Date().getFullYear();

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'meta' });
  return {
    title: {
      default: t('site_title'),
      template: `%s | Konstbyte`,
    },
    description: t('site_description'),
    metadataBase: new URL(process.env.NEXT_PUBLIC_METADATA_BASE || 'https://konstbyte.se'),
    openGraph: {
      title: t('site_title'),
      description: t('site_description'),
      url: process.env.NEXT_PUBLIC_METADATA_BASE || 'https://konstbyte.se',
      siteName: 'Konstbyte',
      images: [{ url: '/og-image.png', width: 1200, height: 630, alt: t('site_title') }],
      locale: locale === 'en' ? 'en_US' : 'sv_SE',
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: t('site_title'),
      description: t('site_description_short'),
      images: ['/og-image.png'],
    },
  };
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();

  const messages = await getMessages();
  const t = await getTranslations({ locale, namespace: 'nav' });

  return (
    <NextIntlClientProvider messages={messages}>
      <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 bg-white text-slate-900 px-3 py-2 rounded">
        {t('skip_to_content')}
      </a>
      <div className="min-h-screen flex flex-col">
        <ClientLayout>
          <main id="main" role="main" className="flex-1 max-w-7xl mx-auto w-full p-6">
            {children}
          </main>
        </ClientLayout>
        <footer role="contentinfo" className="border-t border-slate-200/70 bg-gradient-to-b from-white via-[#f7f3ec] to-[#efe7da] text-slate-700">
          <FooterContent locale={locale} currentYear={currentYear} />
        </footer>
      </div>
    </NextIntlClientProvider>
  );
}

async function FooterContent({ locale, currentYear }: { locale: string; currentYear: number }) {
  const t = await getTranslations({ locale, namespace: 'footer' });
  return (
    <div className="max-w-7xl mx-auto px-6 pt-16 pb-10">
      <div className="grid gap-10 md:grid-cols-[1.5fr_1fr_1fr_1fr] text-sm mb-12">
        {/* Brand */}
        <div className="space-y-4">
          <div className="font-display text-xl font-semibold tracking-wide flex items-center gap-2 text-slate-900">
            🎨 Konstbyte
          </div>
          <p className="text-slate-600 leading-relaxed max-w-xs">
            {t('brand_tagline')}
          </p>
          <div className="space-y-1 text-slate-500 text-xs">
            <p>📧 konstbyte@gmail.com</p>
            <p>📍 {t('location')}</p>
          </div>
        </div>

        {/* Marknadsplats */}
        <div className="space-y-4">
          <div className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400">{t('marketplace')}</div>
          <ul className="space-y-2.5 text-slate-600">
            <li><Link href="/artworks" className="hover:text-slate-900 transition-colors">{t('all_artworks')}</Link></li>
            <li><Link href="/artworks?category=Målning" className="hover:text-slate-900 transition-colors">{t('paintings')}</Link></li>
            <li><Link href="/artworks?category=Skulptur" className="hover:text-slate-900 transition-colors">{t('sculptures')}</Link></li>
            <li><Link href="/join" className="font-semibold text-amber-700 hover:text-amber-800 transition-colors">{t('become_artist')} →</Link></li>
            <li><Link href="/ai/value-art" className="hover:text-slate-900 transition-colors">{t('ai_valuation')}</Link></li>
          </ul>
        </div>

        {/* Community */}
        <div className="space-y-4">
          <div className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400">{t('community')}</div>
          <ul className="space-y-2.5 text-slate-600">
            <li><Link href="/community" className="hover:text-slate-900 transition-colors">{t('discussions')}</Link></li>
            <li><Link href="/feed" className="hover:text-slate-900 transition-colors">{t('feed')}</Link></li>
            <li><Link href="/users" className="hover:text-slate-900 transition-colors">{t('find_artists')}</Link></li>
            <li><Link href="/utmaning" className="hover:text-slate-900 transition-colors">{t('challenges')}</Link></li>
          </ul>
        </div>

        {/* Information */}
        <div className="space-y-4">
          <div className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400">{t('information')}</div>
          <ul className="space-y-2.5 text-slate-600">
            <li><Link href="/om-oss" className="hover:text-slate-900 transition-colors">{t('about')}</Link></li>
            <li><Link href="/hur-det-fungerar" className="hover:text-slate-900 transition-colors">{t('how_it_works')}</Link></li>
            <li><Link href="/avgifter" className="hover:text-slate-900 transition-colors">{t('fees')}</Link></li>
            <li><Link href="/policies/faq" className="hover:text-slate-900 transition-colors">{t('faq')}</Link></li>
            <li><Link href="/policies/terms" className="hover:text-slate-900 transition-colors">{t('terms')}</Link></li>
            <li><Link href="/policies/privacy" className="hover:text-slate-900 transition-colors">{t('privacy')}</Link></li>
          </ul>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-slate-200/70 pt-6 flex flex-col sm:flex-row justify-between items-center gap-3 text-xs text-slate-400">
        <span>© {currentYear} Konstbyte.se. {t('all_rights_reserved')}</span>
        <span className="font-medium text-slate-500">{t('fee_tagline')}</span>
      </div>
    </div>
  );
}
