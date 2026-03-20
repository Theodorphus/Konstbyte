import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Community — Konstnärer diskuterar och inspireras',
  description: 'Delta i diskussioner, dela dina verk och följ andra konstnärer i Konstbytes community.',
  openGraph: {
    title: 'Community | Konstbyte',
    description: 'Hitta inspiration, ge feedback och väx tillsammans med andra konstnärer.',
    images: ['/og-image.png'],
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Community | Konstbyte',
    description: 'Delta i diskussioner och inspireras av andra konstnärer på Konstbyte.',
  },
};

export default function CommunityLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
