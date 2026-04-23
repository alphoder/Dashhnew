'use client';

import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Card } from '@/components/ui/card';
import { Loader2, Trophy, Crown, Sparkles, Flame } from 'lucide-react';
import { truncateAddress, formatAmount, cn } from '@/lib/utils';
import { tierForViews, nextTier, badgesFor } from '@/lib/tiers';
import { FadeIn, Stagger, StaggerItem } from '@/components/motion/fade-in';
import { HoverLift } from '@/components/motion/hover-lift';

interface LeaderRow {
  wallet: string;
  views: number;
  proofs: number;
  earned: number;
}

export default function LeaderboardPage() {
  const [rows, setRows] = useState<LeaderRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [myWallet, setMyWallet] = useState<string | null>(null);

  useEffect(() => {
    setMyWallet(
      typeof window !== 'undefined'
        ? window.localStorage.getItem('dashh_wallet')
        : null,
    );
    fetch('/api/v2/leaderboard', { cache: 'no-store' })
      .then((r) => r.json())
      .then((data) => setRows(data.leaderboard ?? []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const top3 = rows.slice(0, 3);
  const rest = rows.slice(3);

  const myRow = useMemo(() => {
    if (!myWallet) return null;
    const idx = rows.findIndex((r) => r.wallet === myWallet);
    if (idx < 0) return null;
    return { row: rows[idx], rank: idx };
  }, [rows, myWallet]);

  const topViews = rows[0]?.views ?? 1;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24 text-zinc-400">
        <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Loading…
      </div>
    );
  }

  if (rows.length === 0) {
    return (
      <Card className="border-white/10 bg-black/40 p-10 text-center text-zinc-400">
        <Trophy className="mx-auto mb-3 h-8 w-8 text-zinc-600" />
        <p className="text-white">No verified engagement yet.</p>
        <p className="mt-1 text-sm">
          Once creators submit proofs, they'll appear here.
        </p>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Hero */}
      <FadeIn className="relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-[#9945FF]/10 via-black to-[#14F195]/10 p-6 md:p-8">
        <div className="absolute -right-10 -top-10 h-48 w-48 rounded-full bg-[#14F195] opacity-20 blur-3xl" />
        <div className="absolute -left-10 -bottom-10 h-40 w-40 rounded-full bg-[#9945FF] opacity-20 blur-3xl" />
        <div className="relative flex items-start gap-4">
          <div className="rounded-xl bg-gradient-to-br from-yellow-400 to-amber-600 p-3 ring-1 ring-yellow-400/40 shadow-lg shadow-yellow-400/30">
            <Trophy className="h-6 w-6 text-black" />
          </div>
          <div>
            <p className="mb-1 text-[11px] font-semibold uppercase tracking-[0.15em] text-yellow-400">
              Hall of fame
            </p>
            <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-white">
              The verified few
            </h1>
            <p className="mt-2 max-w-xl text-sm text-zinc-300">
              Creators ranked by cryptographically-verified views across every
              DASHH campaign. Rise through the tiers — every proof counts.
            </p>
          </div>
        </div>
      </FadeIn>

      {myRow && (
        <FadeIn delay={0.1}>
          <YourRankCard row={myRow.row} rank={myRow.rank} topViews={topViews} />
        </FadeIn>
      )}

      {top3.length > 0 && (
        <Stagger className="grid gap-4 sm:grid-cols-3" stagger={0.12} delay={0.15}>
          <PodiumCard row={top3[1]} rank={1} isSelf={myWallet === top3[1]?.wallet} />
          <PodiumCard row={top3[0]} rank={0} isSelf={myWallet === top3[0]?.wallet} />
          <PodiumCard row={top3[2]} rank={2} isSelf={myWallet === top3[2]?.wallet} />
        </Stagger>
      )}

      <Card className="border-white/10 bg-black/60 p-0 overflow-hidden">
        <div className="flex items-center justify-between px-5 py-3 border-b border-white/10">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-[#14F195]" />
            <p className="text-[11px] font-semibold uppercase tracking-[0.15em] text-[#14F195]">
              Full ladder
            </p>
          </div>
          <span className="text-[11px] text-zinc-500">
            {rows.length} {rows.length === 1 ? 'creator' : 'creators'}
          </span>
        </div>
        <div className="divide-y divide-white/5">
          {rest.length === 0 && (
            <div className="p-6 text-center text-sm text-zinc-500">
              Only the podium is occupied so far.
            </div>
          )}
          {rest.map((r, idx) => (
            <LadderRow
              key={r.wallet}
              row={r}
              rank={idx + 3}
              topViews={topViews}
              isSelf={myWallet === r.wallet}
            />
          ))}
        </div>
      </Card>
    </div>
  );
}

function YourRankCard({
  row,
  rank,
  topViews,
}: {
  row: LeaderRow;
  rank: number;
  topViews: number;
}) {
  const tier = tierForViews(row.views);
  const progress = nextTier(row.views);
  const viewsPct = Math.max(2, Math.round((row.views / topViews) * 100));

  return (
    <Card
      className="border bg-gradient-to-br from-[#9945FF]/15 via-black to-[#14F195]/15 p-5"
      style={{ borderColor: `${tier.accent}66` }}
    >
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-4">
          <div
            className={cn(
              'flex h-12 w-12 items-center justify-center rounded-xl text-xl shadow-lg',
              `bg-gradient-to-br ${tier.gradient}`,
              tier.glow,
            )}
          >
            {tier.emoji}
          </div>
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.15em] text-zinc-400">
              You are rank #{rank + 1} · {tier.name}
            </p>
            <p className="mt-1 font-mono text-sm text-white">
              {truncateAddress(row.wallet)}
            </p>
            <div className="mt-1 flex gap-3 text-xs text-zinc-400">
              <span>{row.views.toLocaleString()} views</span>
              <span>·</span>
              <span>{row.proofs} proofs</span>
              <span>·</span>
              <span className="text-[#14F195]">
                {formatAmount(row.earned, 3)} SOL
              </span>
            </div>
          </div>
        </div>
        <div className="w-full md:w-80">
          {progress ? (
            <>
              <div className="mb-1 flex items-center justify-between text-xs">
                <span className="text-zinc-500">
                  Next: {progress.next.emoji} {progress.next.name}
                </span>
                <span className="text-zinc-300">
                  {progress.remaining.toLocaleString()} views to go
                </span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-white/10">
                <div
                  className={cn(
                    'h-full rounded-full bg-gradient-to-r',
                    progress.next.gradient,
                  )}
                  style={{ width: `${progress.progress * 100}%` }}
                />
              </div>
            </>
          ) : (
            <div className="flex items-center gap-2 text-sm text-[#14F195]">
              <Crown className="h-4 w-4" /> Max tier reached — untouchable.
            </div>
          )}
          <div className="mt-2 h-1 w-full overflow-hidden rounded-full bg-white/5">
            <div
              className="h-full bg-gradient-to-r from-[#9945FF] to-[#14F195]"
              style={{ width: `${viewsPct}%` }}
            />
          </div>
          <p className="mt-1 text-[10px] text-zinc-500">
            {viewsPct}% of the #1 spot
          </p>
        </div>
      </div>
    </Card>
  );
}

function PodiumCard({
  row,
  rank,
  isSelf,
}: {
  row?: LeaderRow;
  rank: 0 | 1 | 2;
  isSelf?: boolean;
}) {
  if (!row) {
    return (
      <div className="rounded-xl border border-dashed border-white/10 bg-black/20 p-6 text-center">
        <p className="text-sm text-zinc-600">Vacant</p>
      </div>
    );
  }
  const tier = tierForViews(row.views);
  const isGold = rank === 0;

  const orderClass = isGold
    ? 'md:order-2 md:scale-110'
    : rank === 1
      ? 'md:order-1'
      : 'md:order-3';
  const ringClass = isGold
    ? 'ring-yellow-400/60 shadow-lg shadow-yellow-400/30'
    : rank === 1
      ? 'ring-zinc-300/40'
      : 'ring-amber-600/40';

  return (
    <StaggerItem y={40} className={orderClass}>
    <HoverLift scale={isGold ? 1.03 : 1.015}>
    <div
      className={cn(
        'relative h-full rounded-xl border border-white/10 bg-gradient-to-b from-black/60 to-zinc-900/60 p-5 text-center ring-2 transition-transform',
        ringClass,
        isGold ? 'md:scale-110' : '',
      )}
    >
      {isSelf && (
        <span className="absolute right-3 top-3 rounded-full bg-[#14F195]/20 px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wider text-[#14F195]">
          You
        </span>
      )}
      <div className="flex justify-center">
        <motion.div
          initial={{ rotate: -10, scale: 0.6, opacity: 0 }}
          whileInView={{ rotate: 0, scale: 1, opacity: 1 }}
          viewport={{ once: true }}
          transition={{
            type: 'spring',
            stiffness: 200,
            damping: 14,
            delay: isGold ? 0.25 : 0.1,
          }}
          className={cn(
            'flex h-14 w-14 items-center justify-center rounded-2xl text-2xl shadow-lg',
            `bg-gradient-to-br ${tier.gradient}`,
            tier.glow,
          )}
        >
          {rank === 0 ? '👑' : tier.emoji}
        </motion.div>
      </div>
      <p className="mt-3 text-[11px] font-semibold uppercase tracking-[0.15em] text-zinc-400">
        #{rank + 1} · {tier.name}
      </p>
      <p className="mt-0.5 font-mono text-sm text-white">
        {truncateAddress(row.wallet)}
      </p>
      <div className="mt-3 grid grid-cols-2 gap-2 text-[11px]">
        <div className="rounded-md bg-white/5 py-1.5">
          <p className="text-zinc-500">Views</p>
          <p className="font-semibold text-white">
            {row.views.toLocaleString()}
          </p>
        </div>
        <div className="rounded-md bg-white/5 py-1.5">
          <p className="text-zinc-500">Earned</p>
          <p className="font-semibold text-[#14F195]">
            {formatAmount(row.earned, 2)}
          </p>
        </div>
      </div>
    </div>
    </HoverLift>
    </StaggerItem>
  );
}

function LadderRow({
  row,
  rank,
  topViews,
  isSelf,
}: {
  row: LeaderRow;
  rank: number;
  topViews: number;
  isSelf?: boolean;
}) {
  const tier = tierForViews(row.views);
  const badges = badgesFor(row, rank);
  const pct = Math.max(2, Math.round((row.views / topViews) * 100));

  return (
    <div
      className={cn(
        'grid grid-cols-12 gap-3 items-center px-5 py-3 transition-colors',
        isSelf ? 'bg-[#14F195]/10' : 'hover:bg-white/5',
      )}
    >
      <div className="col-span-1 text-zinc-400 text-sm font-medium">
        {rank + 1}
      </div>
      <div className="col-span-1">
        <div
          className={cn(
            'flex h-7 w-7 items-center justify-center rounded-lg text-sm',
            `bg-gradient-to-br ${tier.gradient}`,
          )}
          title={tier.name}
        >
          {tier.emoji}
        </div>
      </div>
      <div className="col-span-4 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-mono text-sm text-white truncate">
            {truncateAddress(row.wallet)}
          </span>
          {isSelf && (
            <span className="rounded-full bg-[#14F195]/20 px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wider text-[#14F195]">
              You
            </span>
          )}
        </div>
        {badges.length > 0 && (
          <div className="mt-0.5 flex flex-wrap gap-1">
            {badges.slice(0, 3).map((b) => (
              <span
                key={b.key}
                title={b.label}
                className="text-[11px] text-zinc-400"
              >
                {b.emoji}
              </span>
            ))}
          </div>
        )}
      </div>
      <div className="col-span-3">
        <div className="flex items-center gap-2">
          <div className="flex-1 h-1.5 overflow-hidden rounded-full bg-white/5">
            <div
              className={cn('h-full bg-gradient-to-r', tier.gradient)}
              style={{ width: `${pct}%` }}
            />
          </div>
          <span className="text-[11px] text-zinc-300 tabular-nums">
            {row.views.toLocaleString()}
          </span>
        </div>
      </div>
      <div className="col-span-1 text-right text-xs text-zinc-400 tabular-nums">
        {row.proofs}
      </div>
      <div className="col-span-2 text-right text-xs text-[#14F195] tabular-nums flex items-center justify-end gap-1">
        {row.earned >= 10 && <Flame className="h-3 w-3" />}
        {formatAmount(row.earned, 3)}
      </div>
    </div>
  );
}
