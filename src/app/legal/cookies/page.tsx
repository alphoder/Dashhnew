import type { Metadata } from 'next';
import { LegalLayout } from '../_components/legal-layout';

export const metadata: Metadata = {
  title: 'Cookie Policy',
  description:
    'What cookies and local-storage keys DASHH sets, and how to control them.',
  alternates: { canonical: '/legal/cookies' },
};

export default function CookiePolicy() {
  return (
    <LegalLayout title="Cookie Policy" effectiveDate="15 May 2026">
      <p>
        DASHH uses the minimum number of cookies and browser-storage keys
        needed to make the app work. This page lists every one.
      </p>

      <h2>1. Strictly necessary</h2>
      <p>
        These are required for the platform to function. You cannot turn
        them off &mdash; without them, the app can&apos;t log you in or remember
        what page you were on.
      </p>
      <ul>
        <li>
          <code>dashh_session</code> &mdash; HMAC-signed cookie storing your
          authenticated wallet address (only after you complete SIWS). 30
          days. HttpOnly.
        </li>
        <li>
          <code>dashh_wallet</code> (localStorage) &mdash; mirrors the
          connected wallet address client-side so we don&apos;t re-prompt on
          every page.
        </li>
        <li>
          <code>dashh_mode</code> (localStorage) &mdash; whether you&apos;re in
          Explore (creator) or Create (brand) mode.
        </li>
      </ul>

      <h2>2. Functional</h2>
      <ul>
        <li>
          <code>dashh_onboarded</code> (localStorage) &mdash; flag set to{' '}
          <code>true</code> after you complete the onboarding wizard, so we
          don&apos;t show it again.
        </li>
        <li>
          <code>dashh_demo_mode</code> (sessionStorage) &mdash; only set when
          you click &ldquo;Try the live demo&rdquo;. Cleared when you exit demo
          mode.
        </li>
      </ul>

      <h2>3. Analytics (opt-in)</h2>
      <p>
        Disabled by default. If you accept analytics in the cookie banner,
        we initialise PostHog to track aggregate page views and feature
        usage. No personal information is captured &mdash; just anonymous
        events scoped to your wallet address (which is already public).
      </p>
      <ul>
        <li>
          <code>ph_*</code> &mdash; PostHog session and distinct-id cookies.
        </li>
      </ul>

      <h2>4. Error monitoring (opt-in)</h2>
      <p>
        Disabled by default. If you accept, runtime errors are captured by
        Sentry. Stack traces may include a truncated wallet address (for
        debugging) but never private keys, signatures, or content you
        haven&apos;t already submitted to the platform.
      </p>

      <h2>5. Controlling cookies</h2>
      <p>You can:</p>
      <ul>
        <li>
          Clear all DASHH storage via your browser&apos;s site-data settings.
        </li>
        <li>
          Disable analytics + error tracking via the cookie banner that
          appears on first visit.
        </li>
        <li>
          Block all third-party cookies in your browser &mdash; the
          strictly-necessary cookies above are first-party and will keep
          working.
        </li>
      </ul>

      <h2>6. Updates</h2>
      <p>
        When we add or remove cookies, we&apos;ll update the table above and
        bump the &ldquo;Last updated&rdquo; date at the top of this page.
      </p>
    </LegalLayout>
  );
}
