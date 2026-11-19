import * as Sentry from '@sentry/nextjs';
import { sentryShared, SENTRY_TUNNEL_PATH } from './lib/sentry-options';

Sentry.init({
  ...sentryShared,
  tunnel: SENTRY_TUNNEL_PATH,
  integrations: [
    // Records what led up to an error. Text, form fields and images are hidden.
    Sentry.replayIntegration({ maskAllText: true, maskAllInputs: true, blockAllMedia: true }),
  ],
  // Only sessions that hit an error are kept.
  replaysSessionSampleRate: 0,
  replaysOnErrorSampleRate: 1.0,
});

export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
