import { requireUser } from '@/lib/require-user';

export default async function InboxLayout({ children }: { children: React.ReactNode }) {
  await requireUser('/messages');
  return <>{children}</>;
}
