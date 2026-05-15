// Analytics summary endpoint.
//
// Returns aggregated metrics for the /analytics page. Two scopes:
//   - Global (no wallet param) — every campaign on the platform
//   - Brand-scoped (?wallet=<brandPubkey>) — only that brand's campaigns
//
// All heavy lifting is done server-side so the client just renders. Pulled
// in one shot (in-memory aggregation across 4 tables) to keep the page-load
// chatty round-trips low. Will need pagination once we cross ~10k proofs.

import { NextResponse } from 'next/server';
import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import * as schema from '@/lib/db/schemas';

export const dynamic = 'force-dynamic';

function getDb() {
  return drizzle(neon(process.env.DATABASE_URL!), { schema });
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const wallet = searchParams.get('wallet');

    const db = getDb();
    const [allCampaigns, allProofs, allPayouts, allParticipations] =
      await Promise.all([
        db.select().from(schema.campaignsV2),
        db.select().from(schema.proofs),
        db.select().from(schema.payouts),
        db.select().from(schema.participations),
      ]);

    const campaigns = wallet
      ? allCampaigns.filter((c) => c.brandWallet === wallet)
      : allCampaigns;
    const campaignIds = new Set(campaigns.map((c) => c.id));

    const scopedParts = allParticipations.filter((p) =>
      campaignIds.has(p.campaignId),
    );
    const scopedPartIds = new Set(scopedParts.map((p) => p.id));
    const scopedProofs = allProofs.filter((p) =>
      scopedPartIds.has(p.participationId),
    );
    const scopedProofIds = new Set(scopedProofs.map((p) => p.id));
    const scopedPayouts = allPayouts.filter((p) =>
      scopedProofIds.has(p.proofId),
    );

    const verifiedProofs = scopedProofs.filter((p) => p.status === 'verified');
    const rejectedProofs = scopedProofs.filter((p) => p.status === 'rejected');
    const totalViews = verifiedProofs.reduce(
      (sum, p) => sum + (p.verifiedViews || 0),
      0,
    );
    const paidPayouts = scopedPayouts.filter((p) => p.status === 'paid');
    const totalPayouts = paidPayouts.reduce(
      (sum, p) => sum + (p.amount || 0),
      0,
    );
    const totalBudget = campaigns.reduce(
      (sum, c) => sum + (c.budget || 0),
      0,
    );
    const totalCreators = new Set(scopedParts.map((p) => p.creatorWallet)).size;

    // Daily proof-count buckets (last 14 days)
    const days = 14;
    const now = new Date();
    const proofBuckets: { label: string; value: number }[] = [];
    const viewBuckets: { label: string; value: number }[] = [];
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(now.getDate() - i);
      const key = d.toISOString().slice(5, 10);
      const matching = verifiedProofs.filter((p) => {
        const pd = p.verifiedAt ? new Date(p.verifiedAt) : null;
        return pd && pd.toISOString().slice(5, 10) === key;
      });
      proofBuckets.push({ label: key, value: matching.length });
      viewBuckets.push({
        label: key,
        value: matching.reduce((acc, p) => acc + (p.verifiedViews ?? 0), 0),
      });
    }

    const byPlatform = ['instagram', 'youtube', 'twitter', 'tiktok'].map(
      (p) => ({
        label: p,
        value: campaigns.filter((c) => c.platform === p).length,
      }),
    );

    // Top creators across this scope, ranked by max verified view count.
    const creatorAgg = new Map<
      string,
      { wallet: string; verifiedViews: number; earned: number; proofs: number }
    >();
    for (const part of scopedParts) {
      if (!creatorAgg.has(part.creatorWallet)) {
        creatorAgg.set(part.creatorWallet, {
          wallet: part.creatorWallet,
          verifiedViews: 0,
          earned: 0,
          proofs: 0,
        });
      }
    }
    for (const pr of verifiedProofs) {
      const part = scopedParts.find((p) => p.id === pr.participationId);
      if (!part) continue;
      const agg = creatorAgg.get(part.creatorWallet);
      if (!agg) continue;
      // Take MAX across this creator's proofs — Δv is computed at settlement
      agg.verifiedViews = Math.max(agg.verifiedViews, pr.verifiedViews ?? 0);
      agg.proofs++;
    }
    for (const py of paidPayouts) {
      const pr = scopedProofs.find((x) => x.id === py.proofId);
      const part = pr
        ? scopedParts.find((p) => p.id === pr.participationId)
        : null;
      if (!part) continue;
      const agg = creatorAgg.get(part.creatorWallet);
      if (agg) agg.earned += py.amount ?? 0;
    }
    const topCreators = Array.from(creatorAgg.values())
      .sort((a, b) => b.verifiedViews - a.verifiedViews)
      .slice(0, 10);

    // Disqualification breakdown — count proofs by rejection reason.
    // We read the reason off the participation row (the API path that ran
    // verify() stamped it there).
    const dqCounts = new Map<string, number>();
    for (const pr of rejectedProofs) {
      const part = scopedParts.find((p) => p.id === pr.participationId);
      const reason =
        part?.disqualificationReason ?? 'Unknown / not categorised';
      dqCounts.set(reason, (dqCounts.get(reason) ?? 0) + 1);
    }
    const disqualificationByReason = Array.from(dqCounts.entries())
      .map(([label, value]) => ({ label, value }))
      .sort((a, b) => b.value - a.value);

    const cpvActual = totalViews > 0 ? totalPayouts / totalViews : 0;

    return NextResponse.json({
      totals: {
        campaigns: campaigns.length,
        activeCampaigns: campaigns.filter((c) => c.status === 'active').length,
        verifiedViews: totalViews,
        payouts: totalPayouts,
        budget: totalBudget,
        creators: totalCreators,
        cpvActual,
        rejectedProofs: rejectedProofs.length,
      },
      verifiedPerDay: proofBuckets,
      viewsPerDay: viewBuckets,
      campaignsByPlatform: byPlatform,
      topCreators,
      disqualificationByReason,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message ?? 'internal error' },
      { status: 500 },
    );
  }
}
