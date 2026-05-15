'use client';

// Creator-side dashboard ("/dashboard" — EXPLORE mode).
//
// This is the wallet-scoped earnings view: campaigns the creator has joined,
// their lifetime earnings, action items (e.g. "submit final proof in 2 days"),
// and on-chain payout signatures.
//
// Brand-side surface for campaigns they CREATED lives at /creatordashboard.

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { StatCard } from '@/components/stat-card';
import { Skeleton } from '@/components/ui/skeleton';
import { ErrorState } from '@/components/ui/error-state';
import { EmptyState } from '@/components/ui/empty-state';
import { truncateAddress } from '@/lib/utils';
import {
  Coins,
  Eye,
  Activity,
  CheckCircle2,
  AlertTriangle,
  ShieldAlert,
  Zap,
  Clock,
  Trophy,
  Compass,
  ExternalLink,
} from 'lucide-react';

type Bucket =
  | 'action_needed'
  | 'awaiting_join'
  | 'in_progress'
  | 'settled'
  | 'forfeited'
  | 'disqualified';

interface CreatorMe {
  wallet: string;
  profile: {
    banned: boolean;
    banReason: string | null;
    disqualificationCount: number | null;
  } | null;
  tier: { name: string; next: string | null; toNext: number };
  totals: {
    lifetimeEarnedSol: number;
    activeCampaigns: number;
    pendingPayouts: number;
    lifetimeVerifiedViews: number;
    settlementsCount: number;
  };
  participations: Array<{
    participationId: string;
    campaignId: string;
    campaignTitle: string;
    platform: 'instagram' | 'youtube' | 'twitter' | 'tiktok';
    iconUrl?: string;
    endsAt?: string;
    settlementWindowDays: number;
    settlementStatus: string;
    bucket: Bucket;
    joinedAt?: string;
    joinViews: number | null;
    finalViews: number | null;
    earnedOnThis: number;
    disqualificationReason: string | null;
    payouts: { amount: number | null; status: string; txSig: string | null }[];
  }>;
}

const BUCKET_META: Record<
  Bucket,
  {
    label: string;
    accent: string;
    Icon: React.ComponentType<{ className?: string }>;
  }
> = {
  action_needed: {
    label: 'Action needed',
    accent: 'border-red-500/30 bg-red-500/5',
    Icon: AlertTriangle,
  },
  awaiting_join: {
    label: 'Awaiting your join proof',
    accent: 'border-amber-500/30 bg-amber-500/5',
    Icon: Clock,
  },
  in_progress: {
    label: 'In progress',
    accent: 'border-white/10 bg-black/40',
    Icon: Activity,
  },
  settled: {
    label: 'Settled',
    accent: 'border-[#14F195]/20 bg-[#14F195]/5',
    Icon: CheckCircle2,
  },
  disqualified: {
    label: 'Disqualified',
    accent: 'border-red-500/40 bg-red-500/10',
    Icon: ShieldAlert,
  },
  forfeited: {
    label: 'Forfeited (window missed)',
    accent: 'border-zinc-700 bg-zinc-900/40',
    Icon: AlertTriangle,
  },
};

export default function CreatorDashboardPage() {
  const [data, setData] = useState<CreatorMe | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [wallet, setWallet] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    setWallet(window.localStorage.getItem('dashh_wallet'));
  }, []);

  useEffect(() => {
    let active = true;
    if (!wallet) {
      setLoading(false);
      return;
    }
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/v2/creators/me?wallet=${wallet}`, {
          cache: 'no-store',
        });
        if (!res.ok) throw new Error(`Server returned ${res.status}`);
        const json = await res.json();
        if (active) setData(json);
      } catch (err: any) {
        if (active) setError(err?.message ?? 'Could not load dashboard');
      } finally {
        if (active) setLoading(false);
      }
    }
    load();
    return () => {
      active = false;
    };
  }, [wallet, reloadKey]);

  const grouped = data
    ? data.participations.reduce(
        (acc, p) => {
          if (!acc[p.bucket]) acc[p.bucket] = [];
          acc[p.bucket].push(p);
          return acc;
        },
        {} as Record<Bucket, CreatorMe['participations']>,
      )
    : null;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-3xl font-bold">Creator dashboard</h1>
          <p className="text-zinc-400">
            Your joined campaigns, verified earnings, and next-action prompts.
          </p>
        </div>
        {wallet && (
          <span className="font-mono text-xs text-zinc-500">
            {truncateAddress(wallet)}
          </span>
        )}
      </div>

      {!wallet ? (
        <EmptyState
          icon={Compass}
          title="Connect your wallet to see your dashboard"
          description="DASHH uses Sign-In With Solana — your wallet is your identity. Connect Phantom from the header, then come back."
          action={
            <Link
              href="/onboarding"
              className="inline-flex items-center gap-2 rounded-md bg-gradient-to-r from-[#9945FF] to-[#14F195] px-4 py-2 text-sm font-semibold text-black hover:opacity-90"
            >
              Onboarding flow
            </Link>
          }
        />
      ) : loading ? (
        <div className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-28" />
            ))}
          </div>
          <Skeleton className="h-48" />
        </div>
      ) : error ? (
        <ErrorState
          title="Couldn't load your dashboard"
          description="Your data is safe — this is usually a transient blip."
          detail={error}
          onRetry={() => setReloadKey((k) => k + 1)}
        />
      ) : !data ? null : (
        <>
          {data.profile?.banned && (
            <div className="rounded-xl border border-red-500/40 bg-red-500/10 p-5">
              <div className="flex items-start gap-3">
                <ShieldAlert className="mt-0.5 h-5 w-5 flex-shrink-0 text-red-400" />
                <div>
                  <p className="text-sm font-semibold uppercase tracking-wider text-red-400">
                    Your wallet is banned
                  </p>
                  <p className="mt-1 text-sm text-zinc-300">
                    {data.profile.banReason ??
                      'You reached the 3-strike limit. Bans last 90 days.'}
                  </p>
                </div>
              </div>
            </div>
          )}

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <StatCard
              label="Lifetime SOL earned"
              value={data.totals.lifetimeEarnedSol.toFixed(4)}
              icon={Coins}
            />
            <StatCard
              label="Active campaigns"
              value={data.totals.activeCampaigns}
              icon={Activity}
            />
            <StatCard
              label="Verified views"
              value={data.totals.lifetimeVerifiedViews.toLocaleString()}
              icon={Eye}
            />
            <StatCard
              label="Pending payouts (SOL)"
              value={data.totals.pendingPayouts.toFixed(4)}
              icon={Clock}
            />
          </div>

          <div className="rounded-xl border border-[#9945FF]/30 bg-gradient-to-r from-[#9945FF]/10 to-black p-5">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-3">
                <div className="rounded-full bg-gradient-to-br from-[#9945FF] to-[#14F195] p-3">
                  <Trophy className="h-6 w-6 text-black" />
                </div>
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-[#9945FF]">
                    Tier
                  </p>
                  <p className="text-2xl font-bold text-white">
                    {data.tier.name}
                  </p>
                  {data.tier.next && (
                    <p className="text-xs text-zinc-400">
                      {data.tier.toNext.toFixed(2)} SOL to {data.tier.next}
                    </p>
                  )}
                </div>
              </div>
              <div className="flex gap-6 text-right">
                <div>
                  <p className="text-[11px] uppercase tracking-wider text-zinc-500">
                    Settled
                  </p>
                  <p className="text-xl font-bold text-white">
                    {data.totals.settlementsCount}
                  </p>
                </div>
                <div>
                  <p className="text-[11px] uppercase tracking-wider text-zinc-500">
                    Strikes
                  </p>
                  <p
                    className={`text-xl font-bold ${
                      (data.profile?.disqualificationCount ?? 0) > 0
                        ? 'text-amber-400'
                        : 'text-[#14F195]'
                    }`}
                  >
                    {data.profile?.disqualificationCount ?? 0}{' '}
                    <span className="text-xs font-normal text-zinc-500">
                      / 3
                    </span>
                  </p>
                </div>
              </div>
            </div>
          </div>

          {data.participations.length === 0 ? (
            <EmptyState
              icon={Compass}
              title="You haven't joined any campaigns yet"
              description="Head to Discover to find campaigns matching your platform and audience."
              action={
                <Link
                  href="/discover"
                  className="inline-flex items-center gap-2 rounded-md bg-gradient-to-r from-[#9945FF] to-[#14F195] px-4 py-2 text-sm font-semibold text-black hover:opacity-90"
                >
                  Browse Discover
                </Link>
              }
            />
          ) : (
            (Object.keys(BUCKET_META) as Bucket[])
              .filter((b) => grouped && grouped[b]?.length)
              .map((bucket) => {
                const meta = BUCKET_META[bucket];
                const Icon = meta.Icon;
                const rows = grouped![bucket];
                return (
                  <div
                    key={bucket}
                    className={`rounded-xl border p-5 ${meta.accent}`}
                  >
                    <div className="mb-3 flex items-center gap-2">
                      <Icon className="h-4 w-4 text-zinc-300" />
                      <p className="text-[11px] font-semibold uppercase tracking-wider text-zinc-300">
                        {meta.label}
                      </p>
                      <span className="text-xs text-zinc-500">
                        ({rows.length})
                      </span>
                    </div>
                    <div className="space-y-2">
                      {rows.map((row) => (
                        <ParticipationRow key={row.participationId} row={row} />
                      ))}
                    </div>
                  </div>
                );
              })
          )}
        </>
      )}
    </div>
  );
}

function ParticipationRow({
  row,
}: {
  row: CreatorMe['participations'][number];
}) {
  const daysLeftToFinal = row.endsAt
    ? Math.ceil(
        (new Date(row.endsAt).getTime() +
          row.settlementWindowDays * 86_400_000 -
          Date.now()) /
          86_400_000,
      )
    : null;

  return (
    <div className="flex flex-col gap-3 rounded-lg border border-white/5 bg-black/40 p-3 sm:flex-row sm:items-center">
      <div className="flex-1">
        <p className="text-sm font-semibold text-white">{row.campaignTitle}</p>
        <p className="mt-0.5 text-xs text-zinc-500">
          {row.platform} · joined{' '}
          {row.joinedAt
            ? new Date(row.joinedAt).toLocaleDateString()
            : '—'}
          {row.endsAt && (
            <> · ends {new Date(row.endsAt).toLocaleDateString()}</>
          )}
        </p>
        {row.disqualificationReason && (
          <p className="mt-1 text-[11px] text-red-400">
            Reason: {row.disqualificationReason}
          </p>
        )}
      </div>

      <div className="flex flex-col items-end gap-1 text-right">
        {row.earnedOnThis > 0 && (
          <span className="font-mono text-sm font-semibold text-[#14F195]">
            +{row.earnedOnThis.toFixed(4)} SOL
          </span>
        )}
        {row.joinViews !== null && (
          <span className="text-[11px] text-zinc-400">
            Join: {row.joinViews.toLocaleString()} views
          </span>
        )}
        {row.finalViews !== null && (
          <span className="text-[11px] text-zinc-400">
            Final: {row.finalViews.toLocaleString()} views
          </span>
        )}

        {row.bucket === 'action_needed' && (
          <Link
            href={`/verifyClaim/${row.participationId}?platform=${row.platform}&campaignId=${row.campaignId}`}
            className="mt-1 inline-flex items-center gap-1 rounded bg-gradient-to-r from-[#14F195] to-[#9945FF] px-2.5 py-1 text-xs font-semibold text-black hover:opacity-90"
          >
            <Zap className="h-3 w-3" />
            Submit final proof
            {daysLeftToFinal !== null && daysLeftToFinal > 0 && (
              <span className="opacity-70">({daysLeftToFinal}d left)</span>
            )}
          </Link>
        )}
        {row.bucket === 'awaiting_join' && (
          <Link
            href={`/verifyClaim/${row.participationId}?platform=${row.platform}&campaignId=${row.campaignId}`}
            className="mt-1 inline-flex items-center gap-1 rounded border border-amber-500/30 bg-amber-500/10 px-2.5 py-1 text-xs font-medium text-amber-200 hover:bg-amber-500/20"
          >
            <Zap className="h-3 w-3" />
            Submit join proof
          </Link>
        )}
        {row.bucket === 'in_progress' && (
          <Link
            href={`/verifyClaim/${row.participationId}?platform=${row.platform}&campaignId=${row.campaignId}`}
            className="mt-1 inline-flex items-center gap-1 rounded border border-white/10 bg-white/5 px-2.5 py-1 text-xs text-zinc-300 hover:bg-white/10"
          >
            Submit interim proof
          </Link>
        )}
        {row.bucket === 'settled' && row.payouts[0]?.txSig && (
          <a
            href={`https://explorer.solana.com/tx/${row.payouts[0].txSig}?cluster=devnet`}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-1 inline-flex items-center gap-1 text-[11px] text-[#14F195] hover:underline"
          >
            On-chain tx
            <ExternalLink className="h-3 w-3" />
          </a>
        )}
      </div>
    </div>
  );
}
