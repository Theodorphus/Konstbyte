// Image hosts that next/image is configured to load (keep in sync with
// images.remotePatterns in next.config.ts). next/image throws while rendering
// on any other host, so an unknown URL saved by one user would crash every page
// that shows it — and fetching arbitrary URLs server-side would allow SSRF.
const ALLOWED_HOSTS: ((host: string) => boolean)[] = [
  (h) => h === 'utfs.io',
  (h) => h.endsWith('.ufs.sh'),
  (h) => h === 'images.unsplash.com',
  (h) => /^[a-z0-9-]+\.googleusercontent\.com$/.test(h),
];

/** True if the value is an https URL on a host next/image is allowed to load. */
export function isAllowedImageUrl(value: unknown): value is string {
  if (typeof value !== 'string' || value.length > 2048) return false;
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    return false;
  }
  if (url.protocol !== 'https:' || url.username || url.password || url.port) return false;
  const host = url.hostname.toLowerCase();
  return ALLOWED_HOSTS.some((allowed) => allowed(host));
}
