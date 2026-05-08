import type { Metadata } from 'next';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const isSv = locale !== 'en';
  return {
    title: isSv ? 'Vanliga frågor (FAQ)' : 'Frequently asked questions (FAQ)',
    description: isSv
      ? 'Svar på vanliga frågor om Konstbyte — konton, betalningar, frakt, avgifter och mer.'
      : 'Answers to common questions about Konstbyte — accounts, payments, shipping, fees and more.',
    openGraph: { images: ['/og-image.png'] },
  };
}

export default function FaqLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
