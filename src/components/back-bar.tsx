'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, ChevronRight } from 'lucide-react';

interface BackBarProps {
  /** Breadcrumbs for the current page. The last crumb renders as plain text (the current page). */
  crumbs?: { label: string; href?: string }[];
  /** Where the "Back" arrow should go. Defaults to router.back(); if it fails, to /. */
  backHref?: string;
}

export function BackBar({ crumbs = [], backHref }: BackBarProps) {
  const router = useRouter();

  function handleBack() {
    if (backHref) {
      router.push(backHref);
      return;
    }
    if (typeof window !== 'undefined' && window.history.length > 1) {
      router.back();
    } else {
      router.push('/');
    }
  }

  return (
    <div className="mb-6 flex flex-wrap items-center gap-3">
      <button
        type="button"
        onClick={handleBack}
        className="inline-flex items-center gap-2 rounded-md border border-white/10 bg-black/40 px-3 py-1.5 text-sm text-zinc-300 transition hover:bg-white/5 hover:text-white"
      >
        <ArrowLeft className="h-4 w-4" />
        Back
      </button>

      {crumbs.length > 0 && (
        <nav className="flex items-center gap-1.5 text-sm text-zinc-400">
          {crumbs.map((c, i) => (
            <span key={i} className="inline-flex items-center gap-1.5">
              {i > 0 && <ChevronRight className="h-3.5 w-3.5 text-zinc-600" />}
              {c.href && i < crumbs.length - 1 ? (
                <Link href={c.href} className="hover:text-white transition-colors">
                  {c.label}
                </Link>
              ) : (
                <span className="text-white">{c.label}</span>
              )}
            </span>
          ))}
        </nav>
      )}
    </div>
  );
}
