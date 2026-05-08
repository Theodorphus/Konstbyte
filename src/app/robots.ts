import type { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  const baseUrl = 'https://www.konstbyte.se';

  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/api/', '/admin/', '/en/admin/'],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
