import * as Sentry from '@sentry/nextjs';
import { sentryShared } from './lib/sentry-options';

Sentry.init({
  ...sentryShared,
  integrations: [Sentry.consoleLoggingIntegration({ levels: ['warn', 'error'] })],
});
