import { NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';
import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import * as schema from '@/lib/db/schemas';

export const dynamic = 'force-dynamic';

function getDb() {
  return drizzle(neon(process.env.DATABASE_URL!), { schema });
}

/**
 * Per-campaign leaderboard. Aggregates verified views + paid amounts per
 * creator wallet, scoped to a single campaign id.
 */
export async function GET(
  _req: Request,
  { params }: { params: { id: string } },
) {
  try {
    const db = getDb();

    const parts = await db
      .select()
      .from(schema.participations)
      .where(eq(schema.participations.campaignId, params.id));
    if (parts.length === 0) {
      return NextResponse.json({ leaderboard: [] });
    }
    const partIds = new Set(parts.map((p) => p.id));
    const partToWallet = new Map(parts.map((p) => [p.id, p.creatorWallet]));

    const allProofs = await db.select().from(schema.proofs);
    const proofs = allProofs.filter((p) => partIds.has(p.participationId));
    const proofIds = new Set(proofs.map((p) => p.id));
    const proofToWallet = new Map<string, string>();
    for (const pr of proofs) {
      const w = partToWallet.get(pr.participationId);
      if (w) proofToWallet.set(pr.id, w);
    }

    const allPayouts = await db.select().from(schema.payouts);
    const payouts = allPayouts.filter((py) => proofIds.has(py.proofId));

    const stats = new Map<
      string,
      { wallet: string; views: number; proofs: number; earned: number }
    >();
    // Seed all participants (so zero-proof creators still appear)
    for (const p of parts) {
      stats.set(p.creatorWallet, {
        wallet: p.creatorWallet,
        views: 0,
        proofs: 0,
        earned: 0,
      });
    }
    for (const pr of proofs) {
      if (pr.status !== 'verified') continue;
      const wallet = partToWallet.get(pr.participationId);
      if (!wallet) continue;
      const s = stats.get(wallet)!;
      s.views += pr.verifiedViews ?? 0;
      s.proofs += 1;
    }
    for (const py of payouts) {
      const wallet = proofToWallet.get(py.proofId);
      if (!wallet) continue;
      const s = stats.get(wallet)!;
      s.earned += py.amount ?? 0;
    }

    const leaderboard = Array.from(stats.values()).sort(
      (a, b) => b.views - a.views || b.earned - a.earned,
    );

    return NextResponse.json({ leaderboard });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message ?? 'internal error', leaderboard: [] },
      { status: 500 },
    );
  }
}
