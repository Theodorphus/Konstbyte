import type { Metadata } from 'next';
import { requireUser } from '@/lib/require-user';

// A personal feed (people you follow): nothing for search engines.
export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default async function FeedLayout({ children }: { children: React.ReactNode }) {
  await requireUser('/feed');
  return <>{children}</>;
}
