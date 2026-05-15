// Client-side Sentry init. Loaded automatically by @sentry/nextjs.
//
// Activates ONLY when NEXT_PUBLIC_SENTRY_DSN is set — keeps the bundle
// smaller in local dev and avoids spurious errors when env vars are
// missing.

import * as Sentry from '@sentry/nextjs';

const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN;

if (dsn) {
  Sentry.init({
    dsn,
    environment: process.env.NEXT_PUBLIC_VERCEL_ENV || 'development',
    // Sample 10% of transactions in production, 100% in preview/dev so we
    // see issues during testing without blowing the free-tier quota.
    tracesSampleRate:
      process.env.NEXT_PUBLIC_VERCEL_ENV === 'production' ? 0.1 : 1.0,
    // Replay sampling — capture full session replay on errors only.
    replaysOnErrorSampleRate: 1.0,
    replaysSessionSampleRate: 0,
    // Strip PII that has no diagnostic value
    beforeSend(event) {
      if (event.request?.headers) {
        delete event.request.headers['Authorization'];
        delete event.request.headers['Cookie'];
      }
      return event;
    },
  });
}
