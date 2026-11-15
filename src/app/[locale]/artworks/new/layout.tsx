import type { Metadata } from 'next';
import { getCurrentUser } from '@/lib/auth';
import ConnectStripeBanner from '@/components/ConnectStripeBanner';

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default async function NewArtworkLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  return (
    <>
      <div className="max-w-4xl mx-auto px-4 pt-6">
        <ConnectStripeBanner user={user} />
      </div>
      {children}
    </>
  );
}
