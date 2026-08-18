import { alternatesFor } from '@/lib/seo';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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

export default async function HowItWorksPage() {
  const t = await getTranslations('how_it_works');
  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('title')}</CardTitle>
      </CardHeader>
      <CardContent className="text-sm text-slate-600 space-y-2">
        <p>1. {t('step_1')}</p>
        <p>2. {t('step_2')}</p>
        <p>3. {t('step_3')}</p>
      </CardContent>
    </Card>
  );
}
