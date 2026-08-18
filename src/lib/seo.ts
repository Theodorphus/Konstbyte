import { SITE_URL } from './urls';

/**
 * Canonical + hreflang for a single page.
 *
 * Metadata `alternates` declared in a layout is inherited verbatim by every
 * page beneath it, so a canonical set once in the locale layout made the whole
 * site claim the homepage as its canonical URL. Each page declares its own.
 *
 * @param path route below the locale segment, e.g. `/artworks`. Empty = home.
 */
export function alternatesFor(locale: string, path = '') {
  const sv = `${SITE_URL}${path}`;
  const en = `${SITE_URL}/en${path}`;
  return {
    canonical: locale === 'en' ? en : sv,
    languages: {
      sv,
      en,
      'x-default': sv,
    },
  };
}

/** Absolute URL for a page, for use as `openGraph.url`. */
export function canonicalUrl(locale: string, path = '') {
  return locale === 'en' ? `${SITE_URL}/en${path}` : `${SITE_URL}${path}`;
}
