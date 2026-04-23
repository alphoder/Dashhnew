'use client';

import { useEffect, useState } from 'react';
import { StatCard } from '@/components/stat-card';
import { BarChart } from '@/components/bar-chart';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  BarChart3,
  CheckCircle2,
  Coins,
  Layers,
  Loader2,
  Wallet,
} from 'lucide-react';

interface Summary {
  totals: {
    campaigns: number;
    activeCampaigns: number;
    verifiedViews: number;
    payouts: number;
    budget: number;
  };
  verifiedPerDay: { label: string; value: number }[];
  campaignsByPlatform: { label: string; value: number }[];
}

export default function AnalyticsPage() {
  const [data, setData] = useState<Summary | null>(null);
  const [loading, setLoading] = useState(true);
  const [scope, setScope] = useState<'global' | 'mine'>('global');

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const wallet =
          typeof window !== 'undefined' ? window.localStorage.getItem('dashh_wallet') : null;
        const params = new URLSearchParams();
        if (scope === 'mine' && wallet) params.set('wallet', wallet);
        const res = await fetch(`/api/v2/analytics/summary?${params}`, { cache: 'no-store' });
        const json = await res.json();
        setData(json);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [scope]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-3xl font-bold">Analytics</h1>
          <p className="text-zinc-400">Verified engagement and payouts at a glance.</p>
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
        <div className="flex items-center justify-center py-24 text-zinc-400">
          <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Loading…
        </div>
      ) : !data ? (
        <p className="text-zinc-400">No data.</p>
      ) : (
        <>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
            <StatCard label="Campaigns" value={data.totals.campaigns} icon={Layers} />
            <StatCard label="Active" value={data.totals.activeCampaigns} icon={BarChart3} />
            <StatCard
              label="Verified views"
              value={data.totals.verifiedViews.toLocaleString()}
              icon={CheckCircle2}
            />
            <StatCard
              label="Budget (SOL)"
              value={data.totals.budget.toFixed(2)}
              icon={Wallet}
            />
            <StatCard
              label="Payouts (SOL)"
              value={data.totals.payouts.toFixed(4)}
              icon={Coins}
            />
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <Card className="border-white/10 bg-black/60 text-white">
              <CardHeader>
                <CardTitle className="text-lg">Verified proofs — last 14 days</CardTitle>
              </CardHeader>
              <CardContent>
                <BarChart data={data.verifiedPerDay} height={220} />
              </CardContent>
            </Card>
            <Card className="border-white/10 bg-black/60 text-white">
              <CardHeader>
                <CardTitle className="text-lg">Campaigns by platform</CardTitle>
              </CardHeader>
              <CardContent>
                <BarChart
                  data={data.campaignsByPlatform}
                  height={220}
                  accentGradient="from-[#14F195] via-[#9945FF] to-[#14F195]"
                />
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}
