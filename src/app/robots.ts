import { SITE_URL } from '@/lib/urls';
import type { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  const baseUrl = SITE_URL;

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
