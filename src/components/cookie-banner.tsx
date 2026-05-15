'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Cookie, X } from 'lucide-react';
import { setAnalyticsConsent } from '@/lib/posthog';

const DECISION_KEY = 'dashh_analytics_consent';

/**
 * First-visit cookie banner. Stays hidden after the user makes a choice.
 *
 * The banner is the ONLY thing that grants analytics consent — until the
 * user clicks Accept, PostHog/Sentry init returns null and no events fire.
 * This keeps DASHH compliant with GDPR's opt-in requirement by default.
 */
export function CookieBanner() {
  const [decided, setDecided] = useState<boolean | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const stored = window.localStorage.getItem(DECISION_KEY);
    setDecided(stored !== null);
  }, []);

  // Wait until we know the decision state before rendering. Avoids a
  // hydration mismatch and a brief banner flash for returning users.
  if (decided === null || decided === true) return null;

  function accept() {
    setAnalyticsConsent(true);
    setDecided(true);
  }

  function decline() {
    setAnalyticsConsent(false);
    setDecided(true);
  }

  return (
    <div
      className="fixed bottom-4 right-4 z-[55] max-w-sm rounded-xl border border-white/10 bg-black/95 p-5 shadow-2xl backdrop-blur"
      role="dialog"
      aria-labelledby="cookie-banner-title"
    >
      <div className="flex items-start gap-3">
        <Cookie className="mt-0.5 h-5 w-5 flex-shrink-0 text-[#14F195]" />
        <div className="flex-1">
          <p
            id="cookie-banner-title"
            className="text-sm font-semibold text-white"
          >
            Help us improve DASHH?
          </p>
          <p className="mt-1 text-xs leading-relaxed text-zinc-400">
            We use privacy-preserving analytics to learn what works.
            No personal data — just anonymous events scoped to your
            wallet (already public). Read our{' '}
            <Link
              href="/legal/cookies"
              className="text-[#14F195] underline"
            >
              cookie policy
            </Link>
            .
          </p>
          <div className="mt-3 flex gap-2">
            <button
              type="button"
              onClick={accept}
              className="flex-1 rounded-md bg-gradient-to-r from-[#9945FF] to-[#14F195] px-3 py-1.5 text-xs font-semibold text-black hover:opacity-90"
            >
              Accept
            </button>
            <button
              type="button"
              onClick={decline}
              className="flex-1 rounded-md border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-medium text-zinc-200 hover:bg-white/10"
            >
              Decline
            </button>
          </div>
        </div>
        <button
          type="button"
          onClick={decline}
          aria-label="Close"
          className="rounded p-1 text-zinc-500 hover:bg-white/5 hover:text-white"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}
