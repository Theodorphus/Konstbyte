import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Veckans Konstutmaning — Tävla och vinn',
  description: 'Delta i veckans konstutmaning, samla likes, klättra i topplistan och vinn en plats i Hall of Fame. Nytt tema varje vecka.',
  openGraph: {
    title: 'Veckans Konstutmaning | Konstbyte',
    description: 'Skapa en målning baserad på veckans tema och tävla om att bli veckans vinnare på Konstbyte.',
    images: ['/weinstock-brush-96240.jpg'],
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Veckans Konstutmaning | Konstbyte',
    description: 'Delta, samla likes och vinn publicitet på Konstbytes framsida.',
  },
};

export default function UtmaningLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
