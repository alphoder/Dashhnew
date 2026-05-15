'use client';

import { Check, X, Minus } from 'lucide-react';
import { FadeIn } from '@/components/motion/fade-in';

type Cell =
  | { kind: 'yes'; label?: string }
  | { kind: 'no'; label?: string }
  | { kind: 'partial'; label: string }
  | { kind: 'text'; label: string };

type Row = {
  feature: string;
  dashh: Cell;
  igMarketplace: Cell;
  brave: Cell;
  agency: Cell;
};

const ROWS: Row[] = [
  {
    feature: 'Platform fee',
    dashh: { kind: 'text', label: '20%' },
    igMarketplace: { kind: 'text', label: '30%' },
    brave: { kind: 'text', label: '~50%' },
    agency: { kind: 'text', label: '40–60%' },
  },
  {
    feature: 'Cryptographic view verification',
    dashh: { kind: 'yes', label: 'zkTLS via Reclaim' },
    igMarketplace: { kind: 'no', label: 'Platform-reported' },
    brave: { kind: 'no' },
    agency: { kind: 'no', label: 'Manual reports' },
  },
  {
    feature: 'Time to payout',
    dashh: { kind: 'text', label: 'Auto, ≤ 1 day after final proof' },
    igMarketplace: { kind: 'text', label: '60 days' },
    brave: { kind: 'text', label: 'Monthly' },
    agency: { kind: 'text', label: '30–90 days' },
  },
  {
    feature: 'On-chain audit trail',
    dashh: { kind: 'yes', label: 'Solana + Arweave' },
    igMarketplace: { kind: 'no' },
    brave: { kind: 'partial', label: 'BAT ledger only' },
    agency: { kind: 'no' },
  },
  {
    feature: 'Refund if no creators join',
    dashh: { kind: 'yes', label: 'Automatic' },
    igMarketplace: { kind: 'no' },
    brave: { kind: 'no' },
    agency: { kind: 'no' },
  },
  {
    feature: 'Disqualification rules in code',
    dashh: { kind: 'text', label: '13 rules' },
    igMarketplace: { kind: 'no' },
    brave: { kind: 'no' },
    agency: { kind: 'partial', label: 'Subjective' },
  },
  {
    feature: 'Anti-fraud bans',
    dashh: { kind: 'yes', label: '3 strikes / 90 days' },
    igMarketplace: { kind: 'partial', label: 'Opaque' },
    brave: { kind: 'partial', label: 'Opaque' },
    agency: { kind: 'no' },
  },
  {
    feature: 'No middleman holds the money',
    dashh: { kind: 'yes', label: 'Direct escrow' },
    igMarketplace: { kind: 'no' },
    brave: { kind: 'no' },
    agency: { kind: 'no' },
  },
];

function CellRender({ cell }: { cell: Cell }) {
  if (cell.kind === 'yes') {
    return (
      <div className="flex items-center justify-center gap-1.5">
        <Check className="h-4 w-4 flex-shrink-0 text-[#14F195]" />
        {cell.label && (
          <span className="text-[11px] text-zinc-400">{cell.label}</span>
        )}
      </div>
    );
  }
  if (cell.kind === 'no') {
    return (
      <div className="flex items-center justify-center gap-1.5">
        <X className="h-4 w-4 flex-shrink-0 text-red-400/70" />
        {cell.label && (
          <span className="text-[11px] text-zinc-500">{cell.label}</span>
        )}
      </div>
    );
  }
  if (cell.kind === 'partial') {
    return (
      <div className="flex items-center justify-center gap-1.5">
        <Minus className="h-4 w-4 flex-shrink-0 text-amber-400/70" />
        <span className="text-[11px] text-zinc-400">{cell.label}</span>
      </div>
    );
  }
  return (
    <span className="text-xs font-medium text-zinc-200">{cell.label}</span>
  );
}

export function CompareTable() {
  return (
    <section className="relative w-full border-t border-white/5 py-16 md:py-24">
      <div className="mx-auto max-w-6xl px-4 md:px-6">
        <FadeIn className="mb-10 text-center">
          <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-[#14F195]">
            Versus the alternatives
          </p>
          <h2 className="text-3xl font-bold text-white md:text-4xl">
            Why brands move to DASHH
          </h2>
          <p className="mx-auto mt-2 max-w-2xl text-sm text-zinc-400">
            The same campaign, side by side. Lower fee, faster payout,
            cryptographic proof — and your money never leaves your control.
          </p>
        </FadeIn>

        <FadeIn>
          <div className="overflow-x-auto rounded-2xl border border-white/10 bg-black/40">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/10 bg-gradient-to-r from-[#9945FF]/10 to-[#14F195]/10">
                  <th className="p-4 text-left text-[11px] font-semibold uppercase tracking-wider text-zinc-400">
                    Feature
                  </th>
                  <th className="p-4 text-center">
                    <span className="inline-flex flex-col items-center gap-0.5">
                      <span className="bg-gradient-to-r from-[#9945FF] to-[#14F195] bg-clip-text text-base font-bold text-transparent">
                        DASHH
                      </span>
                      <span className="text-[10px] text-zinc-500">Solana + zkTLS</span>
                    </span>
                  </th>
                  <th className="p-4 text-center">
                    <span className="inline-flex flex-col items-center gap-0.5">
                      <span className="text-sm font-medium text-zinc-300">
                        Instagram
                      </span>
                      <span className="text-[10px] text-zinc-500">Creator Marketplace</span>
                    </span>
                  </th>
                  <th className="p-4 text-center">
                    <span className="inline-flex flex-col items-center gap-0.5">
                      <span className="text-sm font-medium text-zinc-300">
                        Brave
                      </span>
                      <span className="text-[10px] text-zinc-500">Ads + BAT</span>
                    </span>
                  </th>
                  <th className="p-4 text-center">
                    <span className="inline-flex flex-col items-center gap-0.5">
                      <span className="text-sm font-medium text-zinc-300">
                        Agencies
                      </span>
                      <span className="text-[10px] text-zinc-500">Traditional</span>
                    </span>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {ROWS.map((row, i) => (
                  <tr
                    key={row.feature}
                    className={i % 2 === 0 ? 'bg-white/[0.01]' : ''}
                  >
                    <td className="p-4 font-medium text-zinc-300">
                      {row.feature}
                    </td>
                    <td className="p-4 text-center">
                      <div className="rounded-md bg-gradient-to-r from-[#14F195]/5 to-[#9945FF]/5 px-2 py-1">
                        <CellRender cell={row.dashh} />
                      </div>
                    </td>
                    <td className="p-4 text-center">
                      <CellRender cell={row.igMarketplace} />
                    </td>
                    <td className="p-4 text-center">
                      <CellRender cell={row.brave} />
                    </td>
                    <td className="p-4 text-center">
                      <CellRender cell={row.agency} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </FadeIn>

        <p className="mt-4 text-center text-[11px] text-zinc-600">
          Fees and timing benchmarks compiled from each platform's public
          documentation as of mid-2025. DASHH numbers are exact, audit-able
          on-chain.
        </p>
      </div>
    </section>
  );
}
