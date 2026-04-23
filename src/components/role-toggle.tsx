'use client';

import { useRouter } from 'next/navigation';
import { Compass, Rocket } from 'lucide-react';
import { useMode } from '@/hooks/use-mode';
import { homeForMode, type Mode } from '@/lib/modes';

/**
 * Header mode switch. Reads from useMode() so the pill always reflects the
 * route/stored-preference the rest of the app has already agreed on.
 */
export function RoleToggle() {
  const router = useRouter();
  const { mode, setMode } = useMode();

  function pick(next: Mode) {
    setMode(next);
    router.push(homeForMode(next));
  }

  return (
    <div
      role="radiogroup"
      aria-label="Choose mode"
      className="relative inline-flex items-center rounded-full border border-white/10 bg-black/60 p-1 backdrop-blur-sm"
    >
      <button
        type="button"
        role="radio"
        aria-checked={mode === 'explore'}
        onClick={() => pick('explore')}
        className={`relative z-10 inline-flex items-center gap-1.5 rounded-full px-4 py-1.5 text-sm font-medium transition ${
          mode === 'explore'
            ? 'bg-gradient-to-r from-[#9945FF] to-[#14F195] text-white shadow-lg shadow-[#9945FF]/30'
            : 'text-zinc-300 hover:text-white'
        }`}
      >
        <Compass className="h-3.5 w-3.5" />
        Explore
      </button>
      <button
        type="button"
        role="radio"
        aria-checked={mode === 'create'}
        onClick={() => pick('create')}
        className={`relative z-10 inline-flex items-center gap-1.5 rounded-full px-4 py-1.5 text-sm font-medium transition ${
          mode === 'create'
            ? 'bg-gradient-to-r from-[#14F195] to-[#9945FF] text-black shadow-lg shadow-[#14F195]/30'
            : 'text-zinc-300 hover:text-white'
        }`}
      >
        <Rocket className="h-3.5 w-3.5" />
        Create
      </button>
    </div>
  );
}
