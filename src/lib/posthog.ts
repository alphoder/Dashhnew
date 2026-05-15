// PostHog analytics — client-side instrumentation.
//
// Privacy-first: only fires if NEXT_PUBLIC_POSTHOG_KEY is set AND the user
// has accepted analytics in the cookie banner. We never capture form
// inputs, just navigation + key conversion events scoped to the wallet
// (which is already public).

'use client';

import posthog from 'posthog-js';

const ANALYTICS_CONSENT_KEY = 'dashh_analytics_consent';

let initialised = false;

/**
 * Initialise PostHog. Idempotent — safe to call from multiple components.
 * Returns the posthog instance only if init succeeded.
 */
export function initAnalytics(): typeof posthog | null {
  if (initialised) return posthog;
  if (typeof window === 'undefined') return null;

  const apiKey = process.env.NEXT_PUBLIC_POSTHOG_KEY;
  const apiHost =
    process.env.NEXT_PUBLIC_POSTHOG_HOST || 'https://us.i.posthog.com';
  if (!apiKey) return null;

  // Respect the user's analytics-consent flag — DO NOT init until they opt in.
  const consent = window.localStorage.getItem(ANALYTICS_CONSENT_KEY);
  if (consent !== 'granted') return null;

  posthog.init(apiKey, {
    api_host: apiHost,
    // Manual capture only — page views fired explicitly so we control naming
    capture_pageview: false,
    capture_pageleave: true,
    autocapture: false,
    // Wallet address is the natural distinct_id — only fire identify() after
    // we know which wallet is connected.
    person_profiles: 'identified_only',
    // Strip out any session-replay heatmaps unless explicitly enabled
    disable_session_recording: true,
  });
  initialised = true;
  return posthog;
}

/** Set the wallet address as the distinct_id for downstream events. */
export function identifyWallet(wallet: string): void {
  const ph = initAnalytics();
  if (!ph) return;
  ph.identify(wallet);
}

/** Track an event. No-op if PostHog isn't configured / consented. */
export function track(
  event: string,
  properties?: Record<string, any>,
): void {
  const ph = initAnalytics();
  if (!ph) return;
  ph.capture(event, properties);
}

/** Manually track a page view (call from a route-aware effect). */
export function trackPageView(path: string): void {
  const ph = initAnalytics();
  if (!ph) return;
  ph.capture('$pageview', { $current_url: path });
}

/** Check if the user has granted analytics consent. */
export function hasAnalyticsConsent(): boolean {
  if (typeof window === 'undefined') return false;
  return window.localStorage.getItem(ANALYTICS_CONSENT_KEY) === 'granted';
}

/** Persist user's analytics consent decision. */
export function setAnalyticsConsent(granted: boolean): void {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(
    ANALYTICS_CONSENT_KEY,
    granted ? 'granted' : 'denied',
  );
  if (granted) {
    initAnalytics();
  } else if (initialised) {
    // Tear down so no more events fire
    posthog.opt_out_capturing();
  }
}
