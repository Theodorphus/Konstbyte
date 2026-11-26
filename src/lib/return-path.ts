/**
 * A callbackUrl from the query string, only if it stays on this site. A full URL
 * on the same origin (NextAuth sends those) is turned into its path.
 */
export function safeReturnPath(value: string | null | undefined, origin?: string): string {
  if (!value) return '/';
  if (origin && /^https?:\/\//i.test(value)) {
    try {
      const url = new URL(value);
      if (url.origin === origin) return safeReturnPath(url.pathname + url.search + url.hash);
    } catch {
      // not a URL: fall through
    }
    return '/';
  }
  if (!value.startsWith('/') || value.startsWith('//') || value.startsWith('/\\')) return '/';
  return value;
}
