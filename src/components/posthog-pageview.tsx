'use client';

import { useEffect } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import { trackPageView } from '@/lib/posthog';

/**
 * Fires a $pageview event on every route change. Mounted once in the root
 * layout. No-op if PostHog isn't configured or the user hasn't consented.
 */
export function PostHogPageView() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (!pathname) return;
    const url =
      searchParams && searchParams.toString()
        ? `${pathname}?${searchParams.toString()}`
        : pathname;
    trackPageView(url);
  }, [pathname, searchParams]);

  return null;
}
