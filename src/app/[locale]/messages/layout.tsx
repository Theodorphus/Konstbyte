import type { Metadata } from 'next';

// Private or transactional pages: keep them out of search results.
// Sign-in is required by the inbox and conversation layouts below, so each can
// bring the visitor back to the right page afterwards.
export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default function NoIndexLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
