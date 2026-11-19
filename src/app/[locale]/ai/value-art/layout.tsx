import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { alternatesFor, canonicalUrl } from '@/lib/seo';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'ai' });
  return {
    title: t('value_art_title'),
    description: t('value_art_desc'),
    alternates: alternatesFor(locale, '/ai/value-art'),
    openGraph: { title: t('value_art_title'), description: t('value_art_desc'), url: canonicalUrl(locale, '/ai/value-art'), images: ['/images/ai.webp'] },
  };
}

export default function AiToolLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
