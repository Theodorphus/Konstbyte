import type { Metadata } from 'next';
import { requireUser } from '@/lib/require-user';

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default async function FavoritesLayout({ children }: { children: React.ReactNode }) {
  await requireUser('/favorites');
  return <>{children}</>;
}
