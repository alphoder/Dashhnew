import { NextResponse } from "next/server";
import { desc, eq, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { proofs, participations, payouts } from "@/lib/db/schema-v2";

export const dynamic = "force-dynamic";

export async function GET() {
  const rows = await db
    .select({
      wallet: participations.creatorWallet,
      totalViews: sql<number>`coalesce(sum(${proofs.verifiedViews}), 0)`,
      totalEarned: sql<number>`coalesce(sum(${payouts.amount}), 0)`,
      proofCount: sql<number>`count(distinct ${proofs.id})`,
    })
    .from(participations)
    .leftJoin(proofs, eq(proofs.participationId, participations.id))
    .leftJoin(payouts, eq(payouts.proofId, proofs.id))
    .groupBy(participations.creatorWallet)
    .orderBy(desc(sql`coalesce(sum(${proofs.verifiedViews}), 0)`))
    .limit(50);

  return NextResponse.json({ items: rows });
}
