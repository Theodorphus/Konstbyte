import type { MetadataRoute } from 'next';
import prisma from '@/lib/prisma';

const baseUrl = process.env.NEXTAUTH_URL || 'https://www.konstbyte.se';

const staticRoutes = [
  '',
  '/artworks',
  '/community',
  '/utmaning',
  '/users',
  '/hur-det-fungerar',
  '/avgifter',
  '/om-oss',
  '/kontakt',
  '/join',
  '/ai',
  '/ai/value-art',
  '/ai/inspiration',
  '/hemsidor',
  '/policies/faq',
  '/policies/privacy',
  '/policies/terms',
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticEntries: MetadataRoute.Sitemap = staticRoutes.flatMap((path) => [
    { url: `${baseUrl}${path}`, lastModified: new Date(), changeFrequency: 'weekly', priority: path === '' ? 1 : 0.7 },
    { url: `${baseUrl}/en${path}`, lastModified: new Date(), changeFrequency: 'weekly', priority: path === '' ? 1 : 0.7 },
  ]);

  let artworkEntries: MetadataRoute.Sitemap = [];
  let userEntries: MetadataRoute.Sitemap = [];

  try {
    const [artworks, users] = await Promise.all([
      prisma.artwork.findMany({
        where: { isPublished: true, isSold: false },
        select: { id: true, updatedAt: true },
        orderBy: { createdAt: 'desc' },
        take: 1000,
      }),
      prisma.user.findMany({
        select: { id: true },
        take: 500,
      }),
    ]);

    artworkEntries = artworks.flatMap((a) => [
      { url: `${baseUrl}/artworks/${a.id}`, lastModified: a.updatedAt, changeFrequency: 'weekly' as const, priority: 0.8 },
      { url: `${baseUrl}/en/artworks/${a.id}`, lastModified: a.updatedAt, changeFrequency: 'weekly' as const, priority: 0.8 },
    ]);

    userEntries = users.flatMap((u) => [
      { url: `${baseUrl}/users/${u.id}`, lastModified: new Date(), changeFrequency: 'monthly' as const, priority: 0.5 },
      { url: `${baseUrl}/en/users/${u.id}`, lastModified: new Date(), changeFrequency: 'monthly' as const, priority: 0.5 },
    ]);
  } catch {
    // If DB is unavailable during build, skip dynamic routes
  }

  return [...staticEntries, ...artworkEntries, ...userEntries];
}
