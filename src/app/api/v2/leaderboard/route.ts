import { NextResponse } from 'next/server';
import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import * as schema from '@/lib/db/schemas';

export const dynamic = 'force-dynamic';

function getDb() {
  return drizzle(neon(process.env.DATABASE_URL!), { schema });
}

export async function GET() {
  try {
    const db = getDb();
    const [parts, proofs, payouts] = await Promise.all([
      db.select().from(schema.participations),
      db.select().from(schema.proofs),
      db.select().from(schema.payouts),
    ]);

    // Map participationId -> creatorWallet
    const partToCreator = new Map(parts.map((p) => [p.id, p.creatorWallet]));
    // Map proofId -> creatorWallet (via participation)
    const proofToCreator = new Map<string, string>();
    for (const pr of proofs) {
      const c = partToCreator.get(pr.participationId);
      if (c) proofToCreator.set(pr.id, c);
    }

    const stats = new Map<
      string,
      { wallet: string; views: number; proofs: number; earned: number }
    >();

    for (const pr of proofs) {
      if (pr.status !== 'verified') continue;
      const wallet = partToCreator.get(pr.participationId);
      if (!wallet) continue;
      const s = stats.get(wallet) ?? { wallet, views: 0, proofs: 0, earned: 0 };
      s.views += pr.verifiedViews ?? 0;
      s.proofs += 1;
      stats.set(wallet, s);
    }
    for (const py of payouts) {
      const wallet = proofToCreator.get(py.proofId);
      if (!wallet) continue;
      const s = stats.get(wallet) ?? { wallet, views: 0, proofs: 0, earned: 0 };
      s.earned += py.amount ?? 0;
      stats.set(wallet, s);
    }

    const leaderboard = Array.from(stats.values())
      .sort((a, b) => b.views - a.views)
      .slice(0, 50);

    return NextResponse.json({ leaderboard });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message ?? 'internal error', leaderboard: [] },
      { status: 500 },
    );
  }
}
