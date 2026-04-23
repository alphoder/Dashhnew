'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { toast } from 'react-toastify';
import { RefreshCw, Sparkles, Zap, ShieldAlert } from 'lucide-react';

interface PendingRow {
  participationId: string;
  campaignId: string;
  campaignTitle: string;
  unverified: number;
  kind: 'join_proof_due' | 'final_proof_due' | 'pending_views' | 'forfeited';
  body?: string;
  delta?: number;
}

/**
 * Shows the creator their campaigns with new pending (unverified) views.
 * Each row has a "Verify now" button that triggers a fresh sync + deep-links
 * into the Reclaim flow.
 */
export function PendingViewsBanner({
  wallet,
}: {
  wallet: string | null;
}) {
  const [rows, setRows] = useState<PendingRow[]>([]);
  const [syncing, setSyncing] = useState(false);

  const load = useCallback(async () => {
    if (!wallet) return;
    try {
      const res = await fetch(
        `/api/v2/notifications?wallet=${encodeURIComponent(wallet)}`,
        { cache: 'no-store' },
      );
      const { notifications } = await res.json();
      const relevant: PendingRow[] = (notifications ?? [])
        .filter(
          (n: any) =>
            !n.readAt &&
            (n.kind === 'join_proof_due' ||
              n.kind === 'final_proof_due' ||
              n.kind === 'pending_views' ||
              n.kind === 'forfeited'),
        )
        .map((n: any) => ({
          participationId: n.payload?.participationId,
          campaignId: n.payload?.campaignId,
          campaignTitle: n.title,
          unverified: Number(n.payload?.unverified ?? 0),
          delta: Number(n.payload?.delta ?? 0),
          kind: n.kind,
          body: n.body,
        }))
        .filter((r: PendingRow) => r.participationId);

      // Dedupe by participationId; latest notification wins
      const byPart = new Map<string, PendingRow>();
      for (const r of relevant) byPart.set(r.participationId, r);
      setRows(Array.from(byPart.values()));
    } catch (err) {
      console.error(err);
    }
  }, [wallet]);

  useEffect(() => {
    load();
    // Poll every minute so the banner reflects fresh cron results.
    const t = setInterval(load, 60_000);
    return () => clearInterval(t);
  }, [load]);

  async function resync() {
    if (!wallet) return;
    setSyncing(true);
    try {
      await Promise.all(
        rows.map((r) =>
          fetch(`/api/v2/participations/${r.participationId}/sync`, {
            method: 'POST',
          }),
        ),
      );
      await load();
      toast.success('Synced');
    } catch {
      toast.error('Sync failed');
    } finally {
      setSyncing(false);
    }
  }

  if (!wallet || rows.length === 0) return null;

  const finalRows = rows.filter((r) => r.kind === 'final_proof_due');
  const joinRows = rows.filter(
    (r) => r.kind === 'join_proof_due' || r.kind === 'pending_views',
  );
  const forfeitedRows = rows.filter((r) => r.kind === 'forfeited');
  // legacy aliases for the old layout so the JSX below still renders
  const autoRows: PendingRow[] = [];
  const pendingRows = joinRows;
  const brokenRows = finalRows;

  return (
    <div className="space-y-3">
      {/* Forfeited — someone missed the settlement window */}
      {forfeitedRows.length > 0 && (
        <div className="rounded-xl border border-zinc-500/30 bg-zinc-900/40 p-5">
          <div className="flex items-start gap-3">
            <div className="rounded-lg bg-zinc-500/20 p-2 ring-1 ring-zinc-500/40">
              <ShieldAlert className="h-4 w-4 text-zinc-400" />
            </div>
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.15em] text-zinc-400">
                Payout forfeited
              </p>
              <p className="mt-1 text-sm text-zinc-300">
                {forfeitedRows.length}{' '}
                {forfeitedRows.length === 1 ? 'campaign' : 'campaigns'}{' '}
                settled without your final proof. These payouts are lost — the
                2-proof rule is strict.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Final proof due — campaign ended, window closing */}
      {finalRows.length > 0 && (
        <div className="rounded-xl border border-red-500/40 bg-red-500/5 p-5">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div className="flex items-start gap-3">
              <div className="rounded-lg bg-red-500/20 p-2 ring-1 ring-red-500/40">
                <Zap className="h-4 w-4 text-red-300" />
              </div>
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.15em] text-red-300">
                  Final proof required
                </p>
                <p className="mt-1 text-sm text-white">
                  {finalRows.length === 1
                    ? `"${finalRows[0].campaignTitle}" has ended — submit your final Reclaim proof before the settlement window closes to get paid.`
                    : `${finalRows.length} campaigns need your final proof before settlement closes.`}
                </p>
                <p className="mt-0.5 text-xs text-zinc-400">
                  Miss the window and the payout forfeits — no exceptions.
                </p>
              </div>
            </div>
            <Link
              href={`/verifyClaim/${finalRows[0].participationId}`}
              className="inline-flex items-center gap-2 rounded-full bg-red-500/80 px-4 py-1.5 text-xs font-semibold text-white hover:bg-red-500"
            >
              Submit final proof
            </Link>
          </div>
        </div>
      )}

      {/* Join proof due — needs first proof */}
      {joinRows.length > 0 && (
        <div className="rounded-xl border border-[#9945FF]/30 bg-gradient-to-br from-[#9945FF]/10 via-black to-black p-5">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div className="flex items-start gap-3">
              <div className="rounded-lg bg-[#9945FF]/20 p-2 ring-1 ring-[#9945FF]/40">
                <Sparkles className="h-4 w-4 text-[#9945FF]" />
              </div>
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.15em] text-[#9945FF]">
                  Join proof required
                </p>
                <p className="mt-1 text-sm text-white">
                  {joinRows.length === 1
                    ? `${joinRows[0].unverified.toLocaleString()} views on 1 campaign — anchor it with a Reclaim proof`
                    : `${joinRows.length} campaigns waiting for your join proof`}
                </p>
                <p className="mt-0.5 text-xs text-zinc-400">
                  Anchor now, submit the final proof within 7 days of campaign
                  end to claim your payout.
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={resync}
                disabled={syncing}
                className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-white hover:bg-white/10 disabled:opacity-60"
              >
                <RefreshCw className={`h-3 w-3 ${syncing ? 'animate-spin' : ''}`} />
                Re-sync
              </button>
              <Link
                href={`/verifyClaim/${pendingRows[0].participationId}`}
                className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-[#9945FF] to-[#14F195] px-4 py-1.5 text-xs font-semibold text-white hover:opacity-90"
              >
                Verify now
              </Link>
            </div>
          </div>
          {pendingRows.length > 1 && (
            <ul className="mt-4 space-y-2 text-xs">
              {pendingRows.map((r) => (
                <li
                  key={r.participationId}
                  className="flex items-center justify-between rounded-md bg-black/40 border border-white/5 px-3 py-2"
                >
                  <span className="truncate text-zinc-300">{r.campaignTitle}</span>
                  <span className="text-[#9945FF]">
                    +{r.unverified.toLocaleString()} views
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
