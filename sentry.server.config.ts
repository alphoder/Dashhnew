// Server-side Sentry init. Loaded automatically by @sentry/nextjs for
// API routes, server components, and Edge functions.

import * as Sentry from '@sentry/nextjs';

const dsn = process.env.SENTRY_DSN || process.env.NEXT_PUBLIC_SENTRY_DSN;

if (dsn) {
  Sentry.init({
    dsn,
    environment: process.env.VERCEL_ENV || 'development',
    tracesSampleRate:
      process.env.VERCEL_ENV === 'production' ? 0.1 : 1.0,
    // Don't capture noisy expected errors
    ignoreErrors: [
      'AbortError',
      'TypeError: Failed to fetch',
      'NetworkError when attempting to fetch resource',
    ],
  });
}
