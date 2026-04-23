import { NextResponse } from "next/server";
import { and, eq, gte, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { campaignsV2, participations, proofs, payouts } from "@/lib/db/schema-v2";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const wallet = searchParams.get("wallet");
  const days = Math.min(Number(searchParams.get("days") ?? 30), 90);
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

  // Totals
  const totals = await db
    .select({
      campaigns: sql<number>`count(distinct ${campaignsV2.id})`,
      participants: sql<number>`count(distinct ${participations.creatorWallet})`,
      verifiedViews: sql<number>`coalesce(sum(${proofs.verifiedViews}), 0)`,
      paidOut: sql<number>`coalesce(sum(case when ${payouts.status} = 'paid' then ${payouts.amount} else 0 end), 0)`,
    })
    .from(campaignsV2)
    .leftJoin(participations, eq(participations.campaignId, campaignsV2.id))
    .leftJoin(proofs, eq(proofs.participationId, participations.id))
    .leftJoin(payouts, eq(payouts.proofId, proofs.id))
    .where(wallet ? eq(campaignsV2.brandWallet, wallet) : sql`true`);

  // Daily views over time
  const daily = await db
    .select({
      day: sql<string>`to_char(${proofs.createdAt}, 'YYYY-MM-DD')`,
      views: sql<number>`coalesce(sum(${proofs.verifiedViews}), 0)`,
      payouts: sql<number>`coalesce(sum(${payouts.amount}), 0)`,
    })
    .from(proofs)
    .leftJoin(participations, eq(participations.id, proofs.participationId))
    .leftJoin(campaignsV2, eq(campaignsV2.id, participations.campaignId))
    .leftJoin(payouts, eq(payouts.proofId, proofs.id))
    .where(
      and(
        gte(proofs.createdAt, since),
        wallet ? eq(campaignsV2.brandWallet, wallet) : sql`true`,
      ),
    )
    .groupBy(sql`to_char(${proofs.createdAt}, 'YYYY-MM-DD')`)
    .orderBy(sql`to_char(${proofs.createdAt}, 'YYYY-MM-DD')`);

  return NextResponse.json({
    totals: totals[0] ?? { campaigns: 0, participants: 0, verifiedViews: 0, paidOut: 0 },
    daily,
  });
}
