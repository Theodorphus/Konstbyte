import type { Metadata } from 'next';
import { requireAdmin } from '@/lib/require-user';

// Private or transactional pages: keep them out of search results.
export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

// Non-admins never see the admin pages (the admin APIs refuse them as well).
export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  await requireAdmin();
  return <>{children}</>;
}
