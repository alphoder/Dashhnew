'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { SolanaBlinksCard } from '@/app/blinkcard/SolanaBlinksCard';
import { PendingViewsBanner } from '@/components/pending-views-banner';
import type { ICreator } from '@/lib/interface/creator';
import { Plus, Sparkles, Coins, Rocket, Clock, Inbox } from 'lucide-react';

type Filter = 'live' | 'closed' | 'all';

const Creatorpage = ({ creator }: { creator: ICreator[] }) => {
  const [walletAddress, setWalletAddress] = useState('');
  const [filter, setFilter] = useState<Filter>('live');
  const [isConnecting, setIsConnecting] = useState(true);

  useEffect(() => {
    const search = new URLSearchParams(window.location.search);
    const id = search.get('id');
    if (id) {
      setWalletAddress(id);
      setIsConnecting(false);
      return;
    }
    const stored = window.localStorage.getItem('dashh_wallet');
    if (stored) {
      setWalletAddress(stored);
      setIsConnecting(false);
      return;
    }
    (async () => {
      try {
        const { solana }: any = window;
        if (solana?.isPhantom || solana?.isMobile) {
          const resp = await solana.connect({ onlyIfTrusted: true });
          setWalletAddress(resp.publicKey.toString());
        }
      } catch {
        /* user not yet authorised — we'll show the empty state */
      } finally {
        setIsConnecting(false);
      }
    })();
  }, []);

  // Only the current user's campaigns
  const mine = useMemo(
    () => creator.filter((c) => c.solAdd === walletAddress),
    [creator, walletAddress],
  );

  const yesterday = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() - 1);
    return d;
  }, []);

  const filtered = useMemo(() => {
    if (filter === 'all') return mine;
    if (filter === 'closed') return mine.filter((c) => new Date(c.end) < yesterday);
    return mine.filter((c) => new Date(c.end) >= yesterday);
  }, [mine, filter, yesterday]);

  const stats = useMemo(() => {
    const live = mine.filter((c) => new Date(c.end) >= yesterday).length;
    const closed = mine.length - live;
    const totalBudget = mine.reduce((s, c) => s + (Number(c.amount) || 0), 0);
    const participants = mine.reduce((s, c) => s + (c.users?.length ?? 0), 0);
    return { live, closed, totalBudget, participants };
  }, [mine, yesterday]);

  return (
    <div className="w-full">
      {/* Hero banner — mint accent for the Creator / Studio context */}
      <div className="relative mb-8 overflow-hidden rounded-2xl border border-[#14F195]/30 bg-gradient-to-br from-[#14F195]/15 via-black to-black p-6 md:p-8">
        <div className="absolute -right-10 -top-10 h-48 w-48 rounded-full bg-[#14F195] opacity-20 blur-3xl" />
        <div className="absolute left-0 bottom-0 h-32 w-32 rounded-full bg-[#14F195] opacity-10 blur-3xl" />
        <div className="relative flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex items-start gap-4">
            <div className="rounded-xl bg-[#14F195]/20 p-3 ring-1 ring-[#14F195]/40">
              <Rocket className="h-6 w-6 text-[#14F195]" />
            </div>
            <div>
              <p className="mb-1 text-xs font-semibold uppercase tracking-widest text-[#14F195]">
                Create mode
              </p>
              <h1 className="text-3xl font-bold text-white md:text-4xl">
                Your{' '}
                <span className="bg-gradient-to-r from-[#14F195] to-[#9945FF] bg-clip-text text-transparent">
                  Blinks
                </span>
              </h1>
              <p className="mt-2 max-w-xl text-sm text-zinc-300">
                Launch campaigns, share Blink links, watch verified engagement
                roll in — payouts land the moment proofs verify.
              </p>
            </div>
          </div>
          <Link
            href="/form"
            className="inline-flex items-center justify-center gap-2 self-start rounded-full bg-gradient-to-r from-[#14F195] to-[#9945FF] px-6 py-3 text-sm font-semibold text-black shadow-lg shadow-[#14F195]/30 transition hover:opacity-90 md:self-auto"
          >
            <Plus className="h-4 w-4" />
            New campaign
          </Link>
        </div>
      </div>

      {/* Pending-verification banner (auto-synced from platform public APIs) */}
      <div className="mb-6">
        <PendingViewsBanner wallet={walletAddress || null} />
      </div>

      {/* Stats */}
      <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: 'Live', value: stats.live, icon: Rocket, tint: 'text-[#14F195]' },
          { label: 'Closed', value: stats.closed, icon: Clock, tint: 'text-zinc-400' },
          {
            label: 'Total budget',
            value: `$${stats.totalBudget.toFixed(2)}`,
            icon: Coins,
            tint: 'text-[#14F195]',
          },
          {
            label: 'Participants',
            value: stats.participants,
            icon: Sparkles,
            tint: 'text-[#14F195]',
          },
        ].map((s) => {
          const Icon = s.icon;
          return (
            <div
              key={s.label}
              className="rounded-xl border border-white/10 bg-gradient-to-br from-black/60 to-zinc-900/60 p-4 backdrop-blur-sm"
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-[11px] uppercase tracking-[0.14em] text-zinc-500 font-semibold">
                    {s.label}
                  </p>
                  <p className="mt-2 text-2xl md:text-3xl font-bold tracking-tight text-white">{s.value}</p>
                </div>
                <div className="rounded-lg bg-gradient-to-br from-[#9945FF]/20 to-[#14F195]/20 p-2">
                  <Icon className={`h-4 w-4 ${s.tint}`} />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Filter chips */}
      <div className="mb-6 inline-flex rounded-lg border border-white/10 bg-black/40 p-1 text-sm">
        {(
          [
            { id: 'live', label: `Live (${stats.live})` },
            { id: 'closed', label: `Closed (${stats.closed})` },
            { id: 'all', label: `All (${mine.length})` },
          ] as { id: Filter; label: string }[]
        ).map((f) => (
          <button
            key={f.id}
            onClick={() => setFilter(f.id)}
            className={`rounded-md px-4 py-1.5 transition ${
              filter === f.id
                ? 'bg-gradient-to-r from-[#9945FF] to-[#14F195] text-white'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Grid */}
      {isConnecting ? (
        <div className="rounded-xl border border-white/10 bg-black/40 p-12 text-center text-zinc-400">
          Connecting to your wallet…
        </div>
      ) : !walletAddress ? (
        <div className="rounded-xl border border-white/10 bg-black/40 p-12 text-center">
          <Inbox className="mx-auto mb-3 h-10 w-10 text-zinc-600" />
          <p className="text-lg text-white">Connect your wallet</p>
          <p className="mt-1 text-sm text-zinc-400">
            Head to{' '}
            <Link href="/onboarding" className="text-[#14F195] underline">
              onboarding
            </Link>{' '}
            to link Phantom and see your campaigns here.
          </p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-xl border border-white/10 bg-black/40 p-12 text-center">
          <Inbox className="mx-auto mb-3 h-10 w-10 text-zinc-600" />
          <p className="text-lg text-white">
            {mine.length === 0
              ? "You haven't launched any campaigns yet."
              : `No ${filter} campaigns.`}
          </p>
          <p className="mt-1 text-sm text-zinc-400">
            Create one and watch verified engagement flow in.
          </p>
          <Link
            href="/form"
            className="mt-5 inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-[#9945FF] to-[#14F195] px-5 py-2 text-sm font-medium text-white hover:opacity-90"
          >
            <Plus className="h-4 w-4" /> Launch a campaign
          </Link>
        </div>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {filtered.map((cat) => (
            <SolanaBlinksCard key={cat.id} content={cat} id={cat.id} />
          ))}
        </div>
      )}
    </div>
  );
};

export default Creatorpage;
