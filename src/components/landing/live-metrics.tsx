'use client';

import { useEffect, useState } from 'react';
import { CountUp } from '@/components/motion/count-up';
import { FadeIn } from '@/components/motion/fade-in';
import { Activity, Coins, Eye, Users } from 'lucide-react';

type Counters = {
  totalCampaigns: number;
  activeCampaigns: number;
  totalEscrowedSol: number;
  totalVerifiedViews: number;
  totalPaidSol: number;
  creatorsReached: number;
  brandsServed: number;
  asOf: string;
};

/**
 * Live, on-chain-derived counters for the landing page. Pulls aggregated
 * numbers from /api/v2/analytics/landing-counters (60s cache). Anything that
 * 500s is shown as zeros — never crashes the page.
 */
export function LiveMetrics() {
  const [counters, setCounters] = useState<Counters | null>(null);

  useEffect(() => {
    let alive = true;
    fetch('/api/v2/analytics/landing-counters', { cache: 'no-store' })
      .then((r) => r.json())
      .then((data) => {
        if (alive) setCounters(data);
      })
      .catch(() => {
        if (alive)
          setCounters({
            totalCampaigns: 0,
            activeCampaigns: 0,
            totalEscrowedSol: 0,
            totalVerifiedViews: 0,
            totalPaidSol: 0,
            creatorsReached: 0,
            brandsServed: 0,
            asOf: new Date().toISOString(),
          });
      });
    return () => {
      alive = false;
    };
  }, []);

  const items = [
    {
      Icon: Eye,
      label: 'Verified views',
      value: counters?.totalVerifiedViews ?? 0,
      suffix: '',
      tint: 'text-[#14F195]',
    },
    {
      Icon: Coins,
      label: 'SOL escrowed',
      value: counters?.totalEscrowedSol ?? 0,
      suffix: ' SOL',
      tint: 'text-[#9945FF]',
      decimals: 2,
    },
    {
      Icon: Users,
      label: 'Creators reached',
      value: counters?.creatorsReached ?? 0,
      suffix: '',
      tint: 'text-[#14F195]',
    },
    {
      Icon: Activity,
      label: 'Active campaigns',
      value: counters?.activeCampaigns ?? 0,
      suffix: '',
      tint: 'text-[#9945FF]',
    },
  ];

  return (
    <section className="relative w-full border-t border-white/5 py-12 md:py-16">
      <div className="mx-auto max-w-6xl px-4 md:px-6">
        <FadeIn className="mb-8 text-center">
          <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-[#14F195]">
            Live on devnet
          </p>
          <h2 className="text-2xl font-bold text-white md:text-3xl">
            Numbers, on-chain and verifiable
          </h2>
          <p className="mx-auto mt-2 max-w-2xl text-sm text-zinc-400">
            Pulled live from the Solana blockchain and Arweave-anchored proofs.
            No marketing fluff — these are real counts.
          </p>
        </FadeIn>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {items.map((item) => {
            const Icon = item.Icon;
            return (
              <div
                key={item.label}
                className="relative overflow-hidden rounded-xl border border-white/10 bg-gradient-to-br from-black/60 to-zinc-900/40 p-5"
              >
                <div className="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-gradient-to-br from-[#9945FF]/10 to-[#14F195]/10 blur-2xl" />
                <Icon className={`relative mb-3 h-5 w-5 ${item.tint}`} />
                <p className="relative text-3xl font-bold text-white md:text-4xl">
                  {counters === null ? (
                    <span className="text-zinc-700">···</span>
                  ) : (
                    <>
                      <CountUp
                        value={item.value}
                        decimals={item.decimals ?? 0}
                        duration={1.4}
                      />
                      <span className="ml-1 text-base font-medium text-zinc-400">
                        {item.suffix}
                      </span>
                    </>
                  )}
                </p>
                <p className="relative mt-1 text-xs uppercase tracking-wider text-zinc-500">
                  {item.label}
                </p>
              </div>
            );
          })}
        </div>

        {counters?.asOf && (
          <p className="mt-4 text-center text-[10px] text-zinc-600">
            Updated {new Date(counters.asOf).toLocaleString()} · cached for 60s
          </p>
        )}
      </div>
    </section>
  );
}
