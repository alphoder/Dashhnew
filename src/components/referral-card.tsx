'use client';

import { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import { Copy, Share2, Link as LinkIcon } from 'lucide-react';

/**
 * Personal referral-link card. Each creator gets a shareable URL that
 * tags their wallet — when anyone joins a campaign through that link,
 * attribution is recorded against the referrer.
 */
export function ReferralCard({ origin = '' }: { origin?: string }) {
  const [wallet, setWallet] = useState<string | null>(null);
  const [base, setBase] = useState(origin);

  useEffect(() => {
    setBase(window.location.origin);
    setWallet(window.localStorage.getItem('dashh_wallet'));
  }, []);

  if (!wallet) {
    return (
      <div className="rounded-xl border border-white/10 bg-black/40 p-5 text-sm text-zinc-400">
        Connect your wallet in{' '}
        <a href="/onboarding" className="text-[#14F195] underline">
          onboarding
        </a>{' '}
        to get your personal referral link.
      </div>
    );
  }

  const link = `${base}/discover?ref=${encodeURIComponent(wallet)}`;

  async function copy() {
    await navigator.clipboard.writeText(link);
    toast.success('Referral link copied');
  }

  async function share() {
    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({
          title: 'Join DASHH',
          text: 'Sign up on DASHH and we both earn more on verified engagement.',
          url: link,
        });
      } catch {
        /* user cancelled */
      }
    } else {
      copy();
    }
  }

  return (
    <div className="rounded-xl border border-white/10 bg-gradient-to-br from-[#9945FF]/10 via-black to-[#14F195]/10 p-5">
      <div className="flex items-start gap-3">
        <div className="rounded-lg bg-gradient-to-br from-[#9945FF]/30 to-[#14F195]/30 p-2">
          <LinkIcon className="h-4 w-4 text-[#14F195]" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#14F195]">
            Your referral link
          </p>
          <p className="mt-1 truncate font-mono text-sm text-zinc-200">{link}</p>
          <div className="mt-3 flex flex-wrap gap-2">
            <button
              onClick={copy}
              className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-medium text-white hover:bg-white/10 transition"
            >
              <Copy className="h-3 w-3" /> Copy
            </button>
            <button
              onClick={share}
              className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-[#9945FF] to-[#14F195] px-3 py-1.5 text-xs font-medium text-white hover:opacity-90 transition"
            >
              <Share2 className="h-3 w-3" /> Share
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
