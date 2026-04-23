'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { SolanaBlinksCard } from '@/app/blinkcard/SolanaBlinksCard';
import {
  CampaignDetailsModal,
  type FullCampaign,
} from '@/components/campaign-details-modal';
import { PendingViewsBanner } from '@/components/pending-views-banner';
import type { ICreator } from '@/lib/interface/creator';
import { Compass, Coins, Rocket, Sparkles, Search, Inbox } from 'lucide-react';

type Filter = 'all' | 'participated' | 'live';

// Convert a v1 creators-row into the FullCampaign shape the modal expects.
function v1ToFullCampaign(c: ICreator): FullCampaign {
  const blinkUrl = `https://dial.to/?action=solana-action:https://blinks.knowflow.study/api/donate/${c.id}&cluster=devnet`;
  return {
    id: c.id,
    title: c.title,
    description: c.description,
    platform: 'instagram', // v1 schema has no platform — default
    iconUrl: c.icons,
    ctaLabel: c.label ?? 'Participate',
    budget: Number(c.amount) || 0,
    cpv: 0,
    status: new Date(c.end) > new Date() ? 'active' : 'completed',
    startsAt: (c as any).createdAt ?? new Date().toISOString(),
    endsAt:
      typeof c.end === 'string' ? c.end : new Date(c.end).toISOString(),
    brandWallet: c.solAdd,
    paymentModel: 'per_view',
    platformFeeBps: 2000,
    blinkUrl,
  };
}

const Creatorpage = ({ creator }: { creator: ICreator[] }) => {
  const [walletAddress, setWalletAddress] = useState('');
  const [filter, setFilter] = useState<Filter>('all');
  const [query, setQuery] = useState('');
  const [selectedCampaign, setSelectedCampaign] = useState<FullCampaign | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  useEffect(() => {
    const stored =
      typeof window !== 'undefined' ? window.localStorage.getItem('dashh_wallet') : null;
    if (stored) {
      setWalletAddress(stored);
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
        /* silent */
      }
    })();
  }, []);

  const yesterday = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() - 1);
    return d;
  }, []);

  const sorted = useMemo(
    () =>
      [...creator].sort(
        (a, b) => new Date(a.end).getTime() - new Date(b.end).getTime(),
      ),
    [creator],
  );

  const filtered = useMemo(() => {
    let list = sorted;
    if (filter === 'live') {
      list = list.filter((c) => new Date(c.end) >= yesterday);
    } else if (filter === 'participated') {
      list = list.filter((c) => c.users?.includes(walletAddress));
    }
    if (query.trim()) {
      const q = query.toLowerCase();
      list = list.filter(
        (c) =>
          c.title?.toLowerCase().includes(q) ||
          c.description?.toLowerCase().includes(q),
      );
    }
    return list;
  }, [sorted, filter, yesterday, walletAddress, query]);

  const stats = useMemo(() => {
    const live = sorted.filter((c) => new Date(c.end) >= yesterday).length;
    const participating = walletAddress
      ? sorted.filter((c) => c.users?.includes(walletAddress)).length
      : 0;
    const totalPool = sorted.reduce((s, c) => s + (Number(c.amount) || 0), 0);
    return { live, participating, totalPool, total: sorted.length };
  }, [sorted, yesterday, walletAddress]);

  return (
    <div className="w-full">
      {/* Hero banner — purple accent for the User / Explore context */}
      <div className="relative mb-8 overflow-hidden rounded-2xl border border-[#9945FF]/30 bg-gradient-to-br from-[#9945FF]/20 via-black to-black p-6 md:p-8">
        <div className="absolute -left-10 -top-10 h-48 w-48 rounded-full bg-[#9945FF] opacity-20 blur-3xl" />
        <div className="absolute right-0 bottom-0 h-32 w-32 rounded-full bg-[#9945FF] opacity-10 blur-3xl" />
        <div className="relative flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex items-start gap-4">
            <div className="rounded-xl bg-[#9945FF]/20 p-3 ring-1 ring-[#9945FF]/40">
              <Compass className="h-6 w-6 text-[#9945FF]" />
            </div>
            <div>
              <p className="mb-1 text-xs font-semibold uppercase tracking-widest text-[#9945FF]">
                Explore mode
              </p>
              <h1 className="text-3xl font-bold text-white md:text-4xl">
                Find your next{' '}
                <span className="bg-gradient-to-r from-[#9945FF] to-[#14F195] bg-clip-text text-transparent">
                  campaign
                </span>
              </h1>
              <p className="mt-2 max-w-xl text-sm text-zinc-300">
                Browse every campaign running on DASHH. Join one, stack verified
                views, earn SOL.
              </p>
            </div>
          </div>
          <div className="relative w-full md:w-80">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search the feed…"
              className="w-full rounded-lg border border-white/10 bg-black/60 py-2.5 pl-9 pr-3 text-sm text-white placeholder:text-zinc-500 focus:border-[#9945FF] focus:outline-none focus:ring-1 focus:ring-[#9945FF]"
            />
          </div>
        </div>
      </div>

      {/* Pending-verification banner */}
      <div className="mb-6">
        <PendingViewsBanner wallet={walletAddress || null} />
      </div>

      {/* Stats */}
      <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: 'Total campaigns', value: stats.total, icon: Compass, tint: 'text-[#14F195]' },
          { label: 'Live now', value: stats.live, icon: Rocket, tint: 'text-[#14F195]' },
          {
            label: 'Combined pool',
            value: `$${stats.totalPool.toFixed(2)}`,
            icon: Coins,
            tint: 'text-[#14F195]',
          },
          {
            label: 'You joined',
            value: stats.participating,
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

      {/* Filters */}
      <div className="mb-6 inline-flex rounded-lg border border-white/10 bg-black/40 p-1 text-sm">
        {(
          [
            { id: 'all', label: `All (${stats.total})` },
            { id: 'live', label: `Live (${stats.live})` },
            { id: 'participated', label: `Joined (${stats.participating})` },
          ] as { id: Filter; label: string }[]
        ).map((f) => (
          <button
            key={f.id}
            onClick={() => setFilter(f.id)}
            disabled={f.id === 'participated' && !walletAddress}
            className={`rounded-md px-4 py-1.5 transition disabled:cursor-not-allowed disabled:opacity-50 ${
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
      {filtered.length === 0 ? (
        <div className="rounded-xl border border-white/10 bg-black/40 p-12 text-center">
          <Inbox className="mx-auto mb-3 h-10 w-10 text-zinc-600" />
          <p className="text-lg text-white">No campaigns match your filters.</p>
          <p className="mt-1 text-sm text-zinc-400">
            Try switching filters or clearing the search.
          </p>
        </div>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {filtered.map((cat) => (
            <SolanaBlinksCard
              key={cat.id}
              content={cat}
              id={cat.id}
              onView={() => {
                setSelectedCampaign(v1ToFullCampaign(cat));
                setModalOpen(true);
              }}
            />
          ))}
        </div>
      )}

      <CampaignDetailsModal
        preloaded={selectedCampaign}
        open={modalOpen}
        onOpenChange={setModalOpen}
      />
    </div>
  );
};

export default Creatorpage;
