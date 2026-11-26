import { requireUser } from '@/lib/require-user';

// After signing in, come back to this conversation (e.g. from a message email).
export default async function ConversationLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ userId: string }>;
}) {
  const { userId } = await params;
  await requireUser(`/messages/${encodeURIComponent(userId)}`);
  return <>{children}</>;
}
