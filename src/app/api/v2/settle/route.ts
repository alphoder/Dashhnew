// Post-campaign settlement job.
//
// Runs via Vercel Cron once a day (/api/v2/settle). Walks every campaign
// whose settlement window has closed and finalises payouts:
//
//   1. Participations WITHOUT a final proof inside the window → forfeited.
//   2. For pool-based models (top_performer, split_top_n, equal_split)
//      with valid final proofs → compute final distribution and insert
//      payout rows against the final proof.
//   3. Mark the campaign as settled so new proofs are refused (`settledAt`).
//
// Forfeited shares redistribute to settled creators in pool models, or
// return to the brand's budget for per_view.

import { NextResponse } from 'next/server';
import { and, eq, inArray, isNull } from 'drizzle-orm';
import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import * as schema from '@/lib/db/schemas';
import { readyToSettle } from '@/lib/settlement';
import type { PaymentModel } from '@/lib/payouts';

export const dynamic = 'force-dynamic';

function getDb() {
  return drizzle(neon(process.env.DATABASE_URL!), { schema });
}

export async function GET(req: Request) {
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret) {
    const auth = req.headers.get('authorization');
    if (auth !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
    }
  }

  try {
    const db = getDb();
    const now = new Date();

    const candidates = await db
      .select()
      .from(schema.campaignsV2)
      .where(
        and(
          inArray(schema.campaignsV2.status, ['active', 'completed']),
          isNull(schema.campaignsV2.settledAt),
        ),
      );

    const toSettle = candidates.filter((c) => readyToSettle(c as any, now));
    const stats = {
      considered: candidates.length,
      settled: 0,
      forfeited: 0,
      paidOut: 0,
    };

    for (const campaign of toSettle) {
      const parts = await db
        .select()
        .from(schema.participations)
        .where(eq(schema.participations.campaignId, campaign.id));

      // Forfeit anyone who missed the final proof
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

      // Pool-based finalisation
      const model = (campaign.paymentModel as PaymentModel) ?? 'per_view';
      const finalists = parts.filter((p) => p.finalProofId && !p.disqualified);

      if (finalists.length > 0 && model !== 'per_view') {
        const proofIds = finalists.map((p) => p.finalProofId!).filter(Boolean);
        const proofs = await db
          .select()
          .from(schema.proofs)
          .where(inArray(schema.proofs.id, proofIds));
        const viewsByPart = new Map<string, number>();
        const proofByPart = new Map<string, string>(); // participationId -> proofId
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

        // Distribute creatorPool per model
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
          stats.paidOut++;
        }
      } else if (model === 'per_view') {
        // For per_view, the final proof already issued the payout in
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

      // Mark the campaign itself settled
      await db
        .update(schema.campaignsV2)
        .set({ settledAt: now, status: 'completed' })
        .where(eq(schema.campaignsV2.id, campaign.id));
      stats.settled++;
    }

    return NextResponse.json({ ...stats, ranAt: now.toISOString() });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message ?? 'internal error' },
      { status: 500 },
    );
  }
}
