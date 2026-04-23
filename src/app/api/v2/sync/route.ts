import { NextResponse } from 'next/server';
import { eq, inArray } from 'drizzle-orm';
import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import * as schema from '@/lib/db/schemas';
import { pollPublicViews } from '@/lib/platform-poll';

export const dynamic = 'force-dynamic';

function getDb() {
  return drizzle(neon(process.env.DATABASE_URL!), { schema });
}

/**
 * Batch public-view sync. Run via Vercel Cron every 30 minutes.
 *
 * Two modes per participation:
 *   1. Trusted (`trustMode=true`, not expired) — polled views are
 *      auto-verified, synthetic proofs are recorded with source='auto',
 *      payouts are issued on the delta exactly like manual resubmission.
 *   2. Untrusted — polled views go to `pending_views` and the creator is
 *      nudged to run Reclaim to re-establish trust.
 */
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
    const activeCampaigns = await db
      .select()
      .from(schema.campaignsV2)
      .where(eq(schema.campaignsV2.status, 'active'));
    if (activeCampaigns.length === 0) {
      return NextResponse.json({ synced: 0, note: 'no active campaigns' });
    }
    const campaignById = new Map(activeCampaigns.map((c) => [c.id, c]));
    const activeIds = activeCampaigns.map((c) => c.id);

    const parts = await db
      .select()
      .from(schema.participations)
      .where(inArray(schema.participations.campaignId, activeIds));
    const activeParts = parts.filter((p) => !p.disqualified);

    const allProofs = await db.select().from(schema.proofs);
    const proofsByPart = new Map<string, typeof allProofs>();
    for (const pr of allProofs) {
      const list = proofsByPart.get(pr.participationId) ?? [];
      list.push(pr);
      proofsByPart.set(pr.participationId, list);
    }

    const allPayouts = await db.select().from(schema.payouts);
    const proofIdToPayoutTotal = new Map<string, number>();
    for (const py of allPayouts) {
      proofIdToPayoutTotal.set(
        py.proofId,
        (proofIdToPayoutTotal.get(py.proofId) ?? 0) + (py.amount ?? 0),
      );
    }
    const totalPaidPerCampaign = new Map<string, number>();
    for (const pr of allProofs) {
      const part = activeParts.find((p) => p.id === pr.participationId);
      if (!part) continue;
      const amount = proofIdToPayoutTotal.get(pr.id) ?? 0;
      totalPaidPerCampaign.set(
        part.campaignId,
        (totalPaidPerCampaign.get(part.campaignId) ?? 0) + amount,
      );
    }

    const now = new Date();
    const stats = { synced: 0, autoVerified: 0, nudged: 0, trustBroken: 0 };

    for (const p of activeParts) {
      const campaign = campaignById.get(p.campaignId);
      if (!campaign) continue;

      const priorForPart = (proofsByPart.get(p.id) ?? [])
        .filter((pr) => pr.status === 'verified')
        .sort(
          (a, b) =>
            (b.verifiedAt?.getTime() ?? 0) -
            (a.verifiedAt?.getTime() ?? 0),
        );
      const latestVerified = priorForPart[0] ?? null;
      const verifiedMax = priorForPart.reduce(
        (m, pr) => Math.max(m, pr.verifiedViews ?? 0),
        0,
      );
      const prevBaseline = Math.max(p.pendingViews ?? 0, verifiedMax);

      const { views } = await pollPublicViews(
        campaign.platform as any,
        p.postUrl,
        prevBaseline,
      );
      const polled = Math.max(prevBaseline, views);
      if (polled === (p.pendingViews ?? 0) && polled === verifiedMax) continue;

      // 2-proof model: sync is DISPLAY-ONLY. We update pendingViews so the
      // UI can show "your post has X views so far", but we never auto-create
      // proofs or payouts — that only happens when the creator runs Reclaim
      // themselves (join proof + final proof within the settlement window).
      await db
        .update(schema.participations)
        .set({ pendingViews: polled, lastSyncedAt: now })
        .where(eq(schema.participations.id, p.id));

      // If campaign has ended and the creator hasn't posted a final proof,
      // nudge them with the settlement-window countdown.
      const endsAt = new Date(campaign.endsAt);
      const windowDays = campaign.settlementWindowDays ?? 7;
      const deadline = new Date(endsAt.getTime() + windowDays * 86_400_000);
      const inSettlementWindow = now >= endsAt && now <= deadline;

      if (inSettlementWindow && !p.finalProofId && !p.disqualified) {
        const hoursLeft = Math.max(
          0,
          Math.round((deadline.getTime() - now.getTime()) / 3_600_000),
        );
        await db.insert(schema.notifications).values({
          wallet: p.creatorWallet,
          kind: 'final_proof_due',
          title: `Settlement window closing — ${hoursLeft}h left`,
          body: `Submit your final Reclaim proof on "${campaign.title}" to claim your payout. Miss the window and the payout is forfeited.`,
          payload: {
            participationId: p.id,
            campaignId: campaign.id,
            deadline: deadline.toISOString(),
          },
        });
        stats.nudged++;
      } else if (!p.joinProofId) {
        const unverified = polled;
        if (unverified >= 500) {
          await db.insert(schema.notifications).values({
            wallet: p.creatorWallet,
            kind: 'join_proof_due',
            title: `${unverified.toLocaleString()} views — run your join proof`,
            body: `Anchor "${campaign.title}" with a Reclaim proof now. A second proof at campaign end triggers your payout.`,
            payload: {
              participationId: p.id,
              campaignId: campaign.id,
              pendingViews: unverified,
            },
          });
          stats.nudged++;
        }
      }
      stats.synced++;
    }

    return NextResponse.json({
      ...stats,
      active: activeParts.length,
      ranAt: now.toISOString(),
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message ?? 'internal error' },
      { status: 500 },
    );
  }
}
