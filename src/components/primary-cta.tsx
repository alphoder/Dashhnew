'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { ArrowRight } from 'lucide-react';

/**
 * Swaps the primary CTA based on whether the visitor has completed onboarding.
 * First-time visitors see "Get Started" → /onboarding.
 * Returning visitors see "Open Dashboard" → /dashboard.
 *
 * Variants:
 *  - "hero"   : full gradient pill button used in the hero
 *  - "ghost"  : subtle header-style button
 *  - "chip"   : small rounded chip for inline use
 */
export function PrimaryCTA({
  variant = 'hero',
  className = '',
}: {
  variant?: 'hero' | 'ghost' | 'chip';
  className?: string;
}) {
  const [onboarded, setOnboarded] = useState(false);
  const [mode, setMode] = useState<'explore' | 'create'>('explore');

  useEffect(() => {
    if (typeof window === 'undefined') return;
    setOnboarded(window.localStorage.getItem('dashh_onboarded') === 'true');
    // Prefer the new `dashh_mode` key, fall back to legacy `dashh_role`
    const storedMode = window.localStorage.getItem('dashh_mode');
    if (storedMode === 'create' || storedMode === 'explore') {
      setMode(storedMode);
      return;
    }
    const role = window.localStorage.getItem('dashh_role');
    if (role === 'brand') setMode('create');
    else if (role === 'creator') setMode('explore');
  }, []);

  const label = onboarded ? 'Open Dashboard' : 'Get Started';
  const href = onboarded
    ? mode === 'create'
      ? '/creatordashboard'
      : '/dashboard'
    : '/onboarding';

  if (variant === 'ghost') {
    return (
      <Link
        href={href}
        className={`hidden sm:inline-flex items-center rounded-md border border-white/10 bg-white/5 px-3 py-2 text-sm text-white/90 hover:bg-white/10 transition ${className}`}
      >
        {label}
      </Link>
    );
  }

  if (variant === 'chip') {
    return (
      <Link
        href={href}
        className={`inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-white hover:bg-white/10 transition ${className}`}
      >
        {label}
        <ArrowRight className="h-3.5 w-3.5" />
      </Link>
    );
  }

  return (
    <Link
      href={href}
      className={`inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-[#9945FF] to-[#14F195] px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-[#9945FF]/30 transition hover:opacity-90 ${className}`}
    >
      {label}
      <ArrowRight className="h-4 w-4" />
    </Link>
  );
}
