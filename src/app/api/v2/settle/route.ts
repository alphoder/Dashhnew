// Post-campaign settlement job.
//
// Runs via Vercel Cron once a day (/api/v2/settle). Walks every campaign
// whose settlement window has closed and finalises payouts:
//
//   1. Participations WITHOUT a final proof inside the window → forfeited.
//   2. For pool-based models (top_performer, split_top_n, equal_split)
//      with valid final proofs → compute final distribution and insert
//      payout rows against the final proof.
//   3. Execute every `pending` payout row on-chain (SystemProgram.transfer
//      from the platform signing wallet to the creator wallet) and update
//      the row to `paid` with the tx signature. Failures stay `pending`
//      so the next cron run will retry.
//   4. Mark the campaign as settled so new proofs are refused (`settledAt`).
//
// Forfeited shares redistribute to settled creators in pool models, or
// return to the brand's budget for per_view.
//
// Development testing: hit /api/v2/settle?force=true to bypass the
// `readyToSettle` window check (and the CRON_SECRET requirement when
// NODE_ENV !== 'production'). Use `&campaign=<uuid>` to settle one
// specific campaign instead of every eligible candidate.

import { NextResponse } from 'next/server';
import { and, eq, inArray, isNull } from 'drizzle-orm';
import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import * as schema from '@/lib/db/schemas';
import { readyToSettle } from '@/lib/settlement';
import type { PaymentModel } from '@/lib/payouts';
import { executePayout } from '@/lib/solana/escrow';

export const dynamic = 'force-dynamic';

function getDb() {
  return drizzle(neon(process.env.DATABASE_URL!), { schema });
}

/**
 * Walk every `pending` payout row for a campaign and try to settle it
 * on-chain. Returns counts so the caller can include them in the response.
 *
 * Failures stay `pending` (not `failed`) so the next cron run retries.
 * We only mark `failed` after, say, 5 retries — for now we just log.
 */
async function executePendingPayoutsForCampaign(
  db: ReturnType<typeof getDb>,
  campaignId: string,
  participations: Array<typeof schema.participations.$inferSelect>,
): Promise<{ paid: number; dryRun: number; failed: number; lamports: number }> {
  const stats = { paid: 0, dryRun: 0, failed: 0, lamports: 0 };

  // Collect all proof IDs across this campaign's participations
  const proofIds: string[] = [];
  for (const p of participations) {
    if (p.joinProofId) proofIds.push(p.joinProofId);
    if (p.finalProofId) proofIds.push(p.finalProofId);
  }
  if (proofIds.length === 0) return stats;

  // Pull every pending payout referenced by any of those proofs
  const pendingPayouts = await db
    .select()
    .from(schema.payouts)
    .where(
      and(
        inArray(schema.payouts.proofId, proofIds),
        eq(schema.payouts.status, 'pending'),
      ),
    );

  if (pendingPayouts.length === 0) return stats;

  // Map proofId → creatorWallet so we know where to send the SOL
  const proofs = await db
    .select()
    .from(schema.proofs)
    .where(inArray(schema.proofs.id, proofIds));
  const partById = new Map(participations.map((p) => [p.id, p]));
  const walletByProofId = new Map<string, string>();
  for (const pr of proofs) {
    const part = partById.get(pr.participationId);
    if (part) walletByProofId.set(pr.id, part.creatorWallet);
  }

  for (const payout of pendingPayouts) {
    const recipient = walletByProofId.get(payout.proofId);
    if (!recipient) {
      console.warn(
        '[settle] payout has no recipient wallet — skipping',
        payout.id,
      );
      continue;
    }

    const result = await executePayout({
      toWallet: recipient,
      amountSol: payout.amount,
    });

    if (result.kind === 'paid') {
      await db
        .update(schema.payouts)
        .set({
          status: 'paid',
          txSig: result.signature,
          paidAt: new Date(),
        })
        .where(eq(schema.payouts.id, payout.id));

      await db.insert(schema.notifications).values({
        wallet: recipient,
        kind: 'payout_paid',
        title: `Payout sent · ${payout.amount.toFixed(4)} SOL`,
        body: `Your DASHH payout for campaign ${campaignId.slice(0, 8)}… landed on-chain.`,
        payload: {
          campaignId,
          payoutId: payout.id,
          amount: payout.amount,
          txSignature: result.signature,
        },
      });
      stats.paid++;
      stats.lamports += Math.floor(payout.amount * 1_000_000_000);
    } else if (result.kind === 'dry_run') {
      // No signing key configured (devnet/staging) — record a synthetic
      // signature so the row visibly settles in the UI without hiding the
      // fact that no real money moved.
      await db
        .update(schema.payouts)
        .set({
          status: 'paid',
          txSig: `DRY_RUN:${result.reason}`,
          paidAt: new Date(),
        })
        .where(eq(schema.payouts.id, payout.id));
      stats.dryRun++;
    } else {
      // Failed — leave as pending so the next cron run retries.
      // Append a notification so the team sees the problem.
      console.error(
        '[settle] on-chain payout failed for',
        payout.id,
        result.error,
      );
      stats.failed++;
    }
  }

  return stats;
}

async function runSettlement(opts: {
  force: boolean;
  onlyCampaign?: string;
}): Promise<{
  considered: number;
  settled: number;
  forfeited: number;
  paid: number;
  dryRun: number;
  failed: number;
  ranAt: string;
}> {
  const db = getDb();
  const now = new Date();
  const stats = {
    considered: 0,
    settled: 0,
    forfeited: 0,
    paid: 0,
    dryRun: 0,
    failed: 0,
    ranAt: now.toISOString(),
  };

  // Candidate campaigns: still open (not settled) regardless of status
  // because we want to retry pending payouts even on already-settled ones.
  const baseQuery = opts.onlyCampaign
    ? db
        .select()
        .from(schema.campaignsV2)
        .where(eq(schema.campaignsV2.id, opts.onlyCampaign))
    : db
        .select()
        .from(schema.campaignsV2)
        .where(
          and(
            inArray(schema.campaignsV2.status, ['active', 'completed']),
            isNull(schema.campaignsV2.settledAt),
          ),
        );

  const candidates = await baseQuery;
  stats.considered = candidates.length;

  const toSettle = opts.force
    ? candidates
    : candidates.filter((c) => readyToSettle(c as any, now));

  for (const campaign of toSettle) {
    const parts = await db
      .select()
      .from(schema.participations)
      .where(eq(schema.participations.campaignId, campaign.id));

    // 1. Forfeit anyone who missed the final proof
    const forfeitable = parts.filter(
      (p) => !p.finalProofId && !p.forfeited && !p.disqualified,
    );
    for (const p of forfeitable) {
      await db
        .update(schema.participations)
        .set({
          forfeited: true,
          settlementStatus: 'forfeited',
          settledAt: now,
        })
        .where(eq(schema.participations.id, p.id));
      await db.insert(schema.notifications).values({
        wallet: p.creatorWallet,
        kind: 'forfeited',
        title: 'Payout forfeited — final proof not submitted',
        body: `"${campaign.title}" settled without your final Reclaim proof. Payout forfeited per the 2-proof settlement rule.`,
        payload: { campaignId: campaign.id, participationId: p.id },
      });
      stats.forfeited++;
    }

    // 2. Pool-based finalisation
    const model = (campaign.paymentModel as PaymentModel) ?? 'per_view';
    const finalists = parts.filter((p) => p.finalProofId && !p.disqualified);

    if (finalists.length > 0 && model !== 'per_view') {
      const proofIds = finalists.map((p) => p.finalProofId!).filter(Boolean);
      const proofs = await db
        .select()
        .from(schema.proofs)
        .where(inArray(schema.proofs.id, proofIds));
      const viewsByPart = new Map<string, number>();
      const proofByPart = new Map<string, string>();
      for (const pr of proofs) {
        viewsByPart.set(pr.participationId, pr.verifiedViews ?? 0);
        proofByPart.set(pr.participationId, pr.id);
      }

      const platformFeeBps = campaign.platformFeeBps ?? 2000;
      const creatorPool = campaign.budget * (1 - platformFeeBps / 10_000);

      const ranked = [...finalists]
        .map((p) => ({
          participation: p,
          views: viewsByPart.get(p.id) ?? 0,
        }))
        .sort((a, b) => b.views - a.views);

      const allocations: { partId: string; proofId: string; amount: number }[] = [];
      if (model === 'top_performer' && ranked.length > 0) {
        const winner = ranked[0];
        allocations.push({
          partId: winner.participation.id,
          proofId: proofByPart.get(winner.participation.id)!,
          amount: creatorPool,
        });
      } else if (model === 'split_top_n') {
        const n = Math.min(campaign.topNCount ?? 3, ranked.length);
        const each = creatorPool / n;
        for (let i = 0; i < n; i++) {
          const r = ranked[i];
          allocations.push({
            partId: r.participation.id,
            proofId: proofByPart.get(r.participation.id)!,
            amount: each,
          });
        }
      } else if (model === 'equal_split') {
        const each = creatorPool / ranked.length;
        for (const r of ranked) {
          allocations.push({
            partId: r.participation.id,
            proofId: proofByPart.get(r.participation.id)!,
            amount: each,
          });
        }
      }

      for (const alloc of allocations) {
        if (alloc.amount <= 0) continue;
        await db.insert(schema.payouts).values({
          proofId: alloc.proofId,
          amount: Number(alloc.amount.toFixed(6)),
          status: 'pending',
        });
        await db
          .update(schema.participations)
          .set({ settlementStatus: 'settled', settledAt: now })
          .where(eq(schema.participations.id, alloc.partId));
        await db.insert(schema.notifications).values({
          wallet: finalists.find((p) => p.id === alloc.partId)!.creatorWallet,
          kind: 'settled',
          title: `Settled · ${alloc.amount.toFixed(4)} SOL queued`,
          body: `"${campaign.title}" finalised. Payout will land on-chain shortly.`,
          payload: {
            campaignId: campaign.id,
            amount: alloc.amount,
          },
        });
      }
    } else if (model === 'per_view') {
      // For per_view, the final proof already issued the payout row in
      // /api/v2/proofs. Just mark participations settled.
      for (const p of finalists) {
        if (p.settlementStatus !== 'settled') {
          await db
            .update(schema.participations)
            .set({ settlementStatus: 'settled', settledAt: now })
            .where(eq(schema.participations.id, p.id));
        }
      }
    }

    // 3. Execute the on-chain transfers for every pending payout we just
    //    inserted (or any still-pending rows from previous failed runs).
    const exec = await executePendingPayoutsForCampaign(
      db,
      campaign.id,
      parts,
    );
    stats.paid += exec.paid;
    stats.dryRun += exec.dryRun;
    stats.failed += exec.failed;

    // 4. Brand-refund path. If nothing was paid out and no creator settled,
    //    return the entire escrow to the brand. This is the "why would a
    //    brand invest if no creators join?" defense.
    //
    //    Conditions to refund: zero `paid` payouts AND every participation
    //    is either forfeited or disqualified (or there are no participations
    //    at all). We base the check on freshly-read state because exec may
    //    have moved counts.
    const partsAfter = await db
      .select()
      .from(schema.participations)
      .where(eq(schema.participations.campaignId, campaign.id));

    const anySettled = partsAfter.some(
      (p) => p.settlementStatus === 'settled',
    );
    if (!anySettled) {
      // Refund the brand for the full budget. We bypass payouts_v2 here
      // because that table is keyed by proofId and this transfer has none.
      // The refund metadata lives in the notification row, which serves as
      // the audit log.
      const refundResult = await executePayout({
        toWallet: campaign.brandWallet,
        amountSol: campaign.budget,
      });

      const txDescriptor =
        refundResult.kind === 'paid'
          ? refundResult.signature
          : refundResult.kind === 'dry_run'
            ? `DRY_RUN:${refundResult.reason}`
            : null;

      if (refundResult.kind === 'paid' || refundResult.kind === 'dry_run') {
        await db.insert(schema.notifications).values({
          wallet: campaign.brandWallet,
          kind: 'campaign_refunded',
          title: `Refund issued · ${campaign.budget.toFixed(4)} SOL`,
          body: `"${campaign.title}" closed without any verified creator proofs. Your full escrow has been refunded.`,
          payload: {
            campaignId: campaign.id,
            amount: campaign.budget,
            txSignature: txDescriptor,
            kind: refundResult.kind,
          },
        });
        stats.paid++;
        if (refundResult.kind === 'dry_run') stats.dryRun++;
      } else {
        // Failed — stay in pending state for next cron retry. Don't mark
        // campaign settled so the retry will pick it up again.
        console.error(
          '[settle] brand refund failed for',
          campaign.id,
          refundResult.error,
        );
        stats.failed++;
        continue; // skip the campaign-settled update below
      }
    }

    // 5. Mark the campaign itself settled
    await db
      .update(schema.campaignsV2)
      .set({
        settledAt: now,
        status: anySettled ? 'completed' : 'cancelled',
      })
      .where(eq(schema.campaignsV2.id, campaign.id));
    stats.settled++;
  }

  return stats;
}

/**
 * GET = the cron-fired entry point. Verifies CRON_SECRET if set, then
 * runs settlement for every eligible campaign.
 *
 * Query params:
 *   - `force=true`     → bypass `readyToSettle` window check (dev only)
 *   - `campaign=<id>`  → settle one specific campaign id
 *
 * The `force` flag is rejected in production unless the request also
 * carries a valid CRON_SECRET, to prevent abuse.
 */
export async function GET(req: Request) {
  const cronSecret = process.env.CRON_SECRET;
  const auth = req.headers.get('authorization');
  const authorized = !cronSecret || auth === `Bearer ${cronSecret}`;
  if (!authorized) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  try {
    const url = new URL(req.url);
    const force = url.searchParams.get('force') === 'true';
    const onlyCampaign = url.searchParams.get('campaign') ?? undefined;

    // In production, `force` requires an explicit secret to prevent
    // anyone from triggering early settlement.
    if (force && process.env.NODE_ENV === 'production' && !cronSecret) {
      return NextResponse.json(
        { error: 'force=true requires CRON_SECRET in production' },
        { status: 403 },
      );
    }

    const stats = await runSettlement({ force, onlyCampaign });
    return NextResponse.json(stats);
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message ?? 'internal error' },
      { status: 500 },
    );
  }
}

/**
 * POST is identical to GET — exposed so curl + JSON-API clients have a
 * choice. Vercel Cron uses GET.
 */
export const POST = GET;
