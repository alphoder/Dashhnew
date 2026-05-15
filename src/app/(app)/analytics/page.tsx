'use client';

import { useEffect, useState } from 'react';
import { StatCard } from '@/components/stat-card';
import { BarChart } from '@/components/bar-chart';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton, SkeletonRowList } from '@/components/ui/skeleton';
import { ErrorState } from '@/components/ui/error-state';
import { EmptyState } from '@/components/ui/empty-state';
import { truncateAddress } from '@/lib/utils';
import {
  BarChart3,
  CheckCircle2,
  Coins,
  Layers,
  Users,
  Wallet,
  AlertTriangle,
  Eye,
  Trophy,
} from 'lucide-react';

interface Summary {
  totals: {
    campaigns: number;
    activeCampaigns: number;
    verifiedViews: number;
    payouts: number;
    budget: number;
    creators: number;
    cpvActual: number;
    rejectedProofs: number;
  };
  verifiedPerDay: { label: string; value: number }[];
  viewsPerDay: { label: string; value: number }[];
  campaignsByPlatform: { label: string; value: number }[];
  topCreators: {
    wallet: string;
    verifiedViews: number;
    earned: number;
    proofs: number;
  }[];
  disqualificationByReason: { label: string; value: number }[];
}

export default function AnalyticsPage() {
  const [data, setData] = useState<Summary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [scope, setScope] = useState<'global' | 'mine'>('global');
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let active = true;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const wallet =
          typeof window !== 'undefined'
            ? window.localStorage.getItem('dashh_wallet')
            : null;
        const params = new URLSearchParams();
        if (scope === 'mine' && wallet) params.set('wallet', wallet);
        const res = await fetch(`/api/v2/analytics/summary?${params}`, {
          cache: 'no-store',
        });
        if (!res.ok) throw new Error(`Server returned ${res.status}`);
        const json = await res.json();
        if (active) setData(json);
      } catch (err: any) {
        if (active) setError(err?.message ?? 'Could not load analytics');
      } finally {
        if (active) setLoading(false);
      }
    }
    load();
    return () => {
      active = false;
    };
  }, [scope, reloadKey]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-3xl font-bold">Analytics</h1>
          <p className="text-zinc-400">
            Verified engagement and payouts at a glance.
          </p>
        </div>
        <div className="inline-flex rounded-md border border-white/10 bg-black/40 p-1 text-sm">
          {(['global', 'mine'] as const).map((s) => (
            <button
              key={s}
              onClick={() => setScope(s)}
              className={`rounded px-3 py-1.5 transition ${
                scope === s
                  ? 'bg-gradient-to-r from-[#9945FF] to-[#14F195] text-white'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              {s === 'global' ? 'Global' : 'My campaigns'}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-28 w-full" />
            ))}
          </div>
          <div className="grid gap-4 lg:grid-cols-2">
            <Skeleton className="h-64 w-full" />
            <Skeleton className="h-64 w-full" />
          </div>
        </div>
      ) : error ? (
        <ErrorState
          title="Couldn't load analytics"
          description="The aggregator endpoint is temporarily unavailable. Your campaign data is safe — this only affects the dashboard view."
          detail={error}
          onRetry={() => setReloadKey((k) => k + 1)}
        />
      ) : !data ? (
        <EmptyState
          icon={BarChart3}
          title="Nothing to analyse yet"
          description="Once you have campaigns running, this page will fill up with verified views, payouts, and creator rankings."
        />
      ) : (
        <>
          {/* Top stat cards */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
            <StatCard
              label="Campaigns"
              value={data.totals.campaigns}
              icon={Layers}
            />
            <StatCard
              label="Verified views"
              value={data.totals.verifiedViews.toLocaleString()}
              icon={CheckCircle2}
            />
            <StatCard
              label="SOL escrowed"
              value={data.totals.budget.toFixed(2)}
              icon={Wallet}
            />
            <StatCard
              label="SOL paid out"
              value={data.totals.payouts.toFixed(4)}
              icon={Coins}
            />
            <StatCard
              label="Creators"
              value={data.totals.creators}
              icon={Users}
            />
          </div>

          {/* CPV banner */}
          <div className="rounded-xl border border-[#14F195]/20 bg-gradient-to-r from-[#14F195]/5 to-transparent p-5">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-[#14F195]/20 p-2">
                  <Eye className="h-5 w-5 text-[#14F195]" />
                </div>
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-[#14F195]">
                    Actual cost per verified view
                  </p>
                  <p className="mt-1 text-2xl font-bold text-white">
                    {data.totals.cpvActual === 0
                      ? '—'
                      : `${data.totals.cpvActual.toFixed(6)} SOL`}
                  </p>
                </div>
              </div>
              <p className="max-w-md text-xs text-zinc-400">
                Total paid out ÷ total verified views. Industry baseline:
                Instagram CPM ≈ $20 (≈ 0.02 SOL / view, ~10× higher).
              </p>
            </div>
          </div>

          {/* Charts grid */}
          <div className="grid gap-4 lg:grid-cols-2">
            <Card className="border-white/10 bg-black/60 text-white">
              <CardHeader>
                <CardTitle className="text-lg">
                  Verified proofs — last 14 days
                </CardTitle>
              </CardHeader>
              <CardContent>
                <BarChart data={data.verifiedPerDay} height={220} />
              </CardContent>
            </Card>
            <Card className="border-white/10 bg-black/60 text-white">
              <CardHeader>
                <CardTitle className="text-lg">
                  Verified views — last 14 days
                </CardTitle>
              </CardHeader>
              <CardContent>
                <BarChart
                  data={data.viewsPerDay}
                  height={220}
                  accentGradient="from-[#14F195] via-[#9945FF] to-[#14F195]"
                />
              </CardContent>
            </Card>
          </div>

          {/* Top creators table */}
          <Card className="border-white/10 bg-black/60 text-white">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Trophy className="h-5 w-5 text-[#14F195]" />
                Top creators
                <span className="ml-2 text-xs font-normal text-zinc-500">
                  ({scope === 'mine'
                    ? 'across your campaigns'
                    : 'platform-wide'})
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {data.topCreators.length === 0 ? (
                <EmptyState
                  icon={Users}
                  title="No creators have joined yet"
                  description="Once creators submit verified proofs, the top performers show up here."
                  className="border-0 bg-transparent"
                />
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-white/10 text-left text-[10px] uppercase tracking-wider text-zinc-500">
                        <th className="py-2 pr-4">#</th>
                        <th className="py-2 pr-4">Creator wallet</th>
                        <th className="py-2 pr-4 text-right">Max verified views</th>
                        <th className="py-2 pr-4 text-right">Proofs</th>
                        <th className="py-2 pr-4 text-right">Earned (SOL)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {data.topCreators.map((c, i) => (
                        <tr key={c.wallet} className="hover:bg-white/[0.02]">
                          <td className="py-3 pr-4">
                            {i < 3 ? (
                              <span
                                className={`inline-flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-semibold text-black ${
                                  i === 0
                                    ? 'bg-gradient-to-r from-yellow-400 to-yellow-600'
                                    : i === 1
                                      ? 'bg-gradient-to-r from-zinc-300 to-zinc-500'
                                      : 'bg-gradient-to-r from-amber-600 to-amber-800'
                                }`}
                              >
                                {i + 1}
                              </span>
                            ) : (
                              <span className="text-zinc-500">{i + 1}</span>
                            )}
                          </td>
                          <td className="py-3 pr-4 font-mono text-xs text-zinc-200">
                            {truncateAddress(c.wallet)}
                          </td>
                          <td className="py-3 pr-4 text-right font-medium text-white tabular-nums">
                            {c.verifiedViews.toLocaleString()}
                          </td>
                          <td className="py-3 pr-4 text-right text-zinc-400 tabular-nums">
                            {c.proofs}
                          </td>
                          <td className="py-3 pr-4 text-right font-medium text-[#14F195] tabular-nums">
                            {c.earned.toFixed(4)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Disqualification breakdown */}
          <Card className="border-white/10 bg-black/60 text-white">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <AlertTriangle className="h-5 w-5 text-red-400" />
                Disqualifications by reason
                <span className="ml-2 text-xs font-normal text-zinc-500">
                  ({data.totals.rejectedProofs} total)
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {data.disqualificationByReason.length === 0 ? (
                <EmptyState
                  icon={CheckCircle2}
                  title="Zero disqualifications"
                  description="Every submitted proof has passed the 13-rule pipeline. That's the goal."
                  className="border-0 bg-transparent"
                />
              ) : (
                <div className="space-y-2">
                  {data.disqualificationByReason.map((row) => {
                    const max = Math.max(
                      ...data.disqualificationByReason.map((r) => r.value),
                    );
                    const pct = Math.max(2, Math.round((row.value / max) * 100));
                    return (
                      <div
                        key={row.label}
                        className="flex items-center gap-3 rounded-lg bg-white/[0.02] p-3"
                      >
                        <div className="flex-1">
                          <p className="text-xs text-zinc-300">{row.label}</p>
                          <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-white/5">
                            <div
                              className="h-full rounded-full bg-gradient-to-r from-red-500 to-amber-500"
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                        </div>
                        <span className="font-mono text-sm text-white tabular-nums">
                          {row.value}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
