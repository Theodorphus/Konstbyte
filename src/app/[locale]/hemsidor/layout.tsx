import { alternatesFor } from '@/lib/seo';
import { getTranslations } from 'next-intl/server';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'hemsidor' });

  return {
    title: t('hero_title'),
    description: t('hero_description'),
    alternates: alternatesFor(locale, '/hemsidor'),
    openGraph: {
      title: t('hero_title'),
      description: t('hero_description'),
      locale: locale === 'en' ? 'en_US' : 'sv_SE',
    },
  };
}

export default function HemsidorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
