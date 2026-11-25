import { NextConfig } from 'next';
import createNextIntlPlugin from 'next-intl/plugin';
import { withSentryConfig } from '@sentry/nextjs/config';

const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts');

const securityHeaders = [
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'X-Frame-Options', value: 'DENY' },
{ key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
  {
    key: 'Strict-Transport-Security',
    value: 'max-age=63072000; includeSubDomains; preload',
  },
  {
    key: 'Content-Security-Policy',
    value: [
      "default-src 'self'",
      // eval is only needed by the dev server's hot reloading.
      `script-src 'self' 'unsafe-inline'${process.env.NODE_ENV === 'development' ? " 'unsafe-eval'" : ''} https://js.stripe.com`,
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: blob: https://utfs.io https://*.ufs.sh https://images.unsplash.com https://*.googleusercontent.com",
      "font-src 'self'",
      "connect-src 'self' https://api.stripe.com https://uploadthing.com https://*.uploadthing.com https://*.ufs.sh https://*.ingest.sentry.io",
      "frame-src https://js.stripe.com https://hooks.stripe.com",
      // Sentry Session Replay compresses recordings in a worker.
      "worker-src 'self' blob:",
      "object-src 'none'",
      "base-uri 'self'",
      "form-action 'self'",
    ].join('; '),
  },
];

const nextConfig: NextConfig = {
  typescript: {
    ignoreBuildErrors: false
  },
  async redirects() {
    // The business-website service moved to its own site.
    const hemsidor = ['/hemsidor', '/sv/hemsidor', '/en/hemsidor'].map((source) => ({
      source,
      destination: 'https://www.webbdev.se/',
      permanent: true,
    }));
    // Old duplicate terms and privacy pages: one page per topic, so they can't
    // contradict each other.
    const merged: Record<string, string> = {
      '/villkor': '/policies/terms',
      '/anvandarvillkor': '/policies/terms',
      '/ansvar': '/policies/terms',
      '/integritet': '/policies/privacy',
      '/cookies': '/policies/privacy',
    };
    const policies = Object.entries(merged).flatMap(([from, to]) => [
      { source: from, destination: to, permanent: true },
      { source: `/sv${from}`, destination: to, permanent: true },
      { source: `/en${from}`, destination: `/en${to}`, permanent: true },
    ]);
    return [...hemsidor, ...policies];
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: securityHeaders,
      },
    ];
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'utfs.io'
      },
      {
        protocol: 'https',
        hostname: '**.ufs.sh'
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com'
      },
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com'
      },
      {
        protocol: 'https',
        hostname: '*.googleusercontent.com'
      }
    ]
  }
};

export default withSentryConfig(withNextIntl(nextConfig), {
  org: 'konstbyte',
  project: 'konstbyte',
  // Uploads source maps so production stack traces are readable. Without the
  // token the build still works, just with minified traces.
  authToken: process.env.SENTRY_AUTH_TOKEN,
  widenClientFileUpload: true,
  // Only print upload logs in CI.
  silent: !process.env.CI,
  // Check-ins for the Vercel cron jobs in vercel.json (daily payout release).
  _experimental: { vercelCronsMonitoring: true },
});
