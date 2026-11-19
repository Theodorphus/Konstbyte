/**
 * Settings shared by every Sentry.init (browser, server and edge).
 *
 * Konstbyte handles names, addresses and messages, so Sentry gets the error and
 * where it happened — not who it happened to. No IPs, emails, request bodies,
 * database values or local variables are sent.
 */

/** Browser events go through our own origin so ad blockers don't drop them. */
export const SENTRY_TUNNEL_PATH = '/api/client-events';

// "production" / "preview" on Vercel; a local `next start` is "local", not production.
export const sentryEnvironment =
  process.env.NEXT_PUBLIC_VERCEL_ENV ||
  process.env.VERCEL_ENV ||
  (process.env.NODE_ENV === 'production' ? 'local' : 'development');

export const sentryShared = {
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  environment: sentryEnvironment,
  // SENTRY_DEBUG=1 prints what the SDK sends (server only).
  debug: process.env.SENTRY_DEBUG === '1',
  // Every trace locally, 10% in production (adjust to the traffic).
  tracesSampleRate: sentryEnvironment === 'production' ? 0.1 : 1.0,
  dataCollection: {
    userInfo: false,
    cookies: false,
    httpBodies: [],
    // Header names stay; values that identify a visitor are filtered.
    httpHeaders: { deny: ['forwarded', '-ip', 'remote-', 'via', '-user', 'cf-connecting'] },
    urlQueryParams: { deny: ['email', 'orderId'] },
    databaseQueryData: false,
    stackFrameVariables: false,
    genAI: { inputs: false, outputs: false },
  },
};
