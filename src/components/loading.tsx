// Top-level route loading state.
//
// Used by Next.js convention `loading.tsx` files at every route boundary.
// Renders a centered gradient-ring spinner that matches the brand palette
// so navigations don't flash blank.

import { Loader2 } from 'lucide-react';

export default function SolanaLoadingComponent() {
  return (
    <div className="flex h-[60vh] items-center justify-center text-zinc-400">
      <div className="flex flex-col items-center gap-3">
        <div className="relative">
          <Loader2 className="h-8 w-8 animate-spin text-[#14F195]" />
          <div className="absolute inset-0 animate-ping rounded-full bg-[#9945FF]/20" />
        </div>
        <p className="text-xs uppercase tracking-widest text-zinc-500">
          Loading…
        </p>
      </div>
    </div>
  );
}
