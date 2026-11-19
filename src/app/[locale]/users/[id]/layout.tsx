import type { Metadata } from 'next';
import prisma from '@/lib/prisma';
import { alternatesFor, canonicalUrl } from '@/lib/seo';

// The profile page is a client component, so its title, description and
// canonical URL come from here. Without it every profile inherited the
// /users listing's metadata and search engines saw them as duplicates.
export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}): Promise<Metadata> {
  const { locale, id } = await params;
  const isSv = locale !== 'en';
  const user = await prisma.user.findUnique({
    where: { id },
    select: {
      name: true,
      email: true,
      bio: true,
      image: true,
      _count: { select: { artworks: { where: { isPublished: true } } } },
    },
  });
  // Deleted accounts (no email left) and unknown ids are not indexed.
  if (!user || !user.email) return { title: isSv ? 'Profil' : 'Profile', robots: { index: false } };

  const name = user.name || (isSv ? 'Konstnär' : 'Artist');
  const description =
    user.bio?.slice(0, 160) ||
    (isSv
      ? `${name} på Konstbyte – ${user._count.artworks} konstverk till salu. Följ och köp konst direkt från konstnären.`
      : `${name} on Konstbyte – ${user._count.artworks} artworks for sale. Follow and buy art directly from the artist.`);

  return {
    title: name,
    description,
    alternates: alternatesFor(locale, `/users/${id}`),
    openGraph: {
      title: `${name} — Konstbyte`,
      description,
      url: canonicalUrl(locale, `/users/${id}`),
      images: [user.image || '/og-image.png'],
    },
    // Profiles without any published art are thin pages; keep them out of search.
    ...(user._count.artworks === 0 ? { robots: { index: false, follow: true } } : {}),
  };
}

export default function UserProfileLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
