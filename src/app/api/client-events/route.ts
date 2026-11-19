import * as Sentry from '@sentry/nextjs';

// Sentry tunnel: the browser posts its error reports here and the server
// forwards them to Sentry (only for our own DSN, without cookies). Ad blockers
// let requests to our own domain through.
export function POST(request: Request) {
  return Sentry.handleTunnelRequest(request);
}
