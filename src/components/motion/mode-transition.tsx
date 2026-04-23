'use client';

import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { usePathname } from 'next/navigation';
import { useRef } from 'react';
import { deriveMode, readStoredMode, type Mode } from '@/lib/modes';

/**
 * Page-level slide transition that responds to Explore ⇄ Create mode flips.
 *
 *   Explore → Create  : new page slides in FROM THE RIGHT (direction +1)
 *   Create  → Explore : new page slides in FROM THE LEFT  (direction -1)
 *   Same-mode nav     : quiet fade only (no horizontal travel)
 *
 * Keyed on `pathname` so Next.js App Router swaps between them via
 * <AnimatePresence mode="wait">. Durations are short (0.35 s) and eased so
 * the transition feels confident rather than cinematic.
 */
export function ModeTransition({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const reduced = useReducedMotion();
  const prevMode = useRef<Mode | null>(null);

  // Compute current mode. Use the stored preference for neutral routes so
  // /notifications inherits whichever side you were just in.
  const storedMode = readStoredMode();
  const currentMode = deriveMode(pathname, storedMode);

  // Direction is non-zero ONLY when mode actually flipped.
  let direction = 0;
  if (prevMode.current && prevMode.current !== currentMode) {
    direction = currentMode === 'create' ? 1 : -1;
  }
  prevMode.current = currentMode;

  const distance = reduced ? 0 : 48;

  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div
        key={pathname}
        initial={{ x: direction * distance, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        exit={{ x: direction * -distance * 0.6, opacity: 0 }}
        transition={{
          duration: reduced ? 0 : 0.35,
          ease: [0.16, 1, 0.3, 1],
        }}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}
