import type { Metadata } from 'next';
import { requireUser } from '@/lib/require-user';

// Private or transactional pages: keep them out of search results.
export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default async function NotificationsLayout({ children }: { children: React.ReactNode }) {
  await requireUser('/notifications');
  return <>{children}</>;
}
