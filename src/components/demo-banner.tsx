'use client';

import { useEffect, useState } from 'react';
import { Sparkles, X } from 'lucide-react';
import {
  DEMO_WALLET,
  exitDemoMode,
  isDemoMode,
  syncDemoFlagFromUrl,
} from '@/lib/demo-mode';

/**
 * A sticky top banner that's only visible when the user is in demo mode.
 * Rendered globally from the root layout. Hidden on first render
 * (server-side) to avoid hydration mismatch — pops in client-side when the
 * sessionStorage flag is set.
 */
export function DemoBanner() {
  const [mounted, setMounted] = useState(false);
  const [active, setActive] = useState(false);

  useEffect(() => {
    // Promote ?demo=1 from the URL into the persisted flag, then read it.
    syncDemoFlagFromUrl();
    setMounted(true);
    setActive(isDemoMode());

    // React to other tabs flipping the flag (rare but cheap).
    const onStorage = () => setActive(isDemoMode());
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  if (!mounted || !active) return null;

  return (
    <div className="sticky top-0 z-[60] w-full bg-gradient-to-r from-[#9945FF] to-[#14F195] text-black">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-2 px-4 py-1.5 text-xs font-medium">
        <div className="flex items-center gap-2">
          <Sparkles className="h-3.5 w-3.5" />
          <span>
            Demo mode is on — no real transactions occur. Wallet:{' '}
            <code className="rounded bg-black/15 px-1 py-0.5 font-mono">
              {DEMO_WALLET.slice(0, 8)}…
            </code>
          </span>
        </div>
        <button
          type="button"
          onClick={exitDemoMode}
          className="inline-flex items-center gap-1 rounded bg-black/15 px-2 py-0.5 hover:bg-black/25"
          aria-label="Exit demo mode"
        >
          <X className="h-3 w-3" />
          Exit
        </button>
      </div>
    </div>
  );
}
