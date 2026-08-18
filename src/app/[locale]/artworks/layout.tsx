import { alternatesFor } from '@/lib/seo';
import type { Metadata } from 'next';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const isSv = locale !== 'en';
  return {
    title: isSv ? 'Köp konst online — alla konstverk' : 'Buy art online — all artworks',
    description: isSv
      ? 'Bläddra bland konstverk från svenska konstnärer. Köp målningar, skulpturer, fotografi och digital konst direkt från konstnären.'
      : 'Browse artworks from independent Swedish artists. Buy paintings, sculptures, photography and digital art directly from the artist.',
    alternates: alternatesFor(locale, '/artworks'),
    openGraph: {
      title: isSv ? 'Köp konst online | Konstbyte' : 'Buy art online | Konstbyte',
      description: isSv
        ? 'Bläddra och köp unik konst från svenska konstnärer.'
        : 'Browse and buy unique art from Swedish artists.',
      images: ['/og-image.png'],
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      images: ['/og-image.png'],
    },
  };
}

export default function ArtworksLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
