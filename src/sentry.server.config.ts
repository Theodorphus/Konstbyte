import * as Sentry from '@sentry/nextjs';
import { sentryShared, SENTRY_TUNNEL_PATH } from './lib/sentry-options';

Sentry.init({
  ...sentryShared,
  integrations: [
    // Our own route (src/app/api/client-events) forwards the browser's events.
    Sentry.serveTunnelIntegration({ intercept: false, path: SENTRY_TUNNEL_PATH }),
    // The catch blocks log with console.error/warn — send those as Sentry logs.
    Sentry.consoleLoggingIntegration({ levels: ['warn', 'error'] }),
  ],
});
