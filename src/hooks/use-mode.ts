'use client';

import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import {
  type Mode,
  DEFAULT_MODE,
  deriveMode,
  readStoredMode,
  writeStoredMode,
} from '@/lib/modes';

/**
 * Reactively tracks the active mode.
 *
 * Priority on every navigation:
 *   1. If the route is explicit (Explore or Create), use that and persist it.
 *   2. If the route is neutral, preserve the user's last persisted choice.
 *   3. Fall back to DEFAULT_MODE.
 */
export function useMode(): { mode: Mode; setMode: (m: Mode) => void } {
  const pathname = usePathname();
  const [mode, setModeState] = useState<Mode>(DEFAULT_MODE);

  useEffect(() => {
    const stored = readStoredMode();
    const derived = deriveMode(pathname, stored);
    setModeState(derived);

    // Only persist when the route is explicit (so neutral pages don't stomp
    // on the user's chosen mode).
    if (derived !== stored) {
      const explicit = deriveMode(pathname, null);
      // deriveMode falls back to DEFAULT_MODE for neutral routes when no
      // stored mode is given. Detect "neutral" by checking both calls return
      // the same answer across differing storedMode values:
      const neutralCheck = deriveMode(pathname, 'create');
      const isNeutral = explicit === DEFAULT_MODE && neutralCheck === 'create';
      if (!isNeutral) writeStoredMode(derived);
    }
  }, [pathname]);

  function setMode(next: Mode) {
    setModeState(next);
    writeStoredMode(next);
  }

  return { mode, setMode };
}
