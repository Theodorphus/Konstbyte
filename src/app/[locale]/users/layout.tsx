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
    title: isSv ? 'Hitta konstnärer' : 'Find artists',
    description: isSv
      ? 'Utforska och följ svenska konstnärer på Konstbyte. Bläddra bland profiler och upptäck nya talanger.'
      : 'Explore and follow Swedish artists on Konstbyte. Browse profiles and discover new talents.',
    alternates: alternatesFor(locale, '/users'),
    openGraph: { images: ['/og-image.png'] },
  };
}

export default function UsersLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
