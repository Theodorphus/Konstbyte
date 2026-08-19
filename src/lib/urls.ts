const PRODUCTION_URL = 'https://www.konstbyte.se';
const DEV_URL = 'http://localhost:3000';

/**
 * Env values pasted into hosting dashboards routinely pick up a trailing
 * newline or space. `new URL()` strips those, but string interpolation does
 * not — which silently corrupts every URL we build by hand (sitemap entries,
 * Stripe redirect targets, e-mail links). Normalise once, here.
 */
function clean(value: string | undefined): string | null {
  if (!value) return null;
  const trimmed = value.trim().replace(/\/+$/, '');
  return trimmed || null;
}

const fallback = process.env.NODE_ENV === 'production' ? PRODUCTION_URL : DEV_URL;

/** Origin used for server-side redirects: Stripe, Connect onboarding, e-mails. */
export const APP_URL = clean(process.env.NEXTAUTH_URL) ?? fallback;

/** Public origin used for canonical URLs, OG images and JSON-LD. */
export const SITE_URL = clean(process.env.NEXT_PUBLIC_METADATA_BASE) ?? fallback;
