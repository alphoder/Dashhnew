// Public, unauthenticated counters surface for the landing page.
//
// Returns aggregated, non-sensitive numbers that signal traction:
//   - totalCampaigns        — count of campaigns_v2 rows
//   - activeCampaigns       — campaigns with status='active'
//   - totalVerifiedViews    — sum of proofs_v2.verifiedViews where status='verified'
//   - totalEscrowedSol      — sum of campaigns_v2.budget across all campaigns
//   - totalPaidSol          — sum of payouts_v2.amount where status='paid'
//   - creatorsReached       — distinct participations_v2.creatorWallet count
//   - brandsServed          — distinct campaigns_v2.brandWallet count
//
// Cached aggressively (revalidate every 60s) so a viral moment doesn't
// hammer the DB.

import { NextResponse } from 'next/server';
import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import * as schema from '@/lib/db/schemas';
import { eq, sql } from 'drizzle-orm';

export const dynamic = 'force-dynamic';
export const revalidate = 60;

function getDb() {
  return drizzle(neon(process.env.DATABASE_URL!), { schema });
}

export async function GET() {
  try {
    const db = getDb();

    const [campaignsRow] = await db
      .select({
        total: sql<number>`count(*)::int`,
        active: sql<number>`count(*) filter (where ${schema.campaignsV2.status} = 'active')::int`,
        totalBudget: sql<number>`coalesce(sum(${schema.campaignsV2.budget}), 0)::float`,
        brands: sql<number>`count(distinct ${schema.campaignsV2.brandWallet})::int`,
      })
      .from(schema.campaignsV2);

    const [proofsRow] = await db
      .select({
        verifiedViews: sql<number>`coalesce(sum(${schema.proofs.verifiedViews}), 0)::bigint`,
      })
      .from(schema.proofs)
      .where(eq(schema.proofs.status, 'verified'));

    const [payoutsRow] = await db
      .select({
        paid: sql<number>`coalesce(sum(${schema.payouts.amount}), 0)::float`,
      })
      .from(schema.payouts)
      .where(eq(schema.payouts.status, 'paid'));

    const [participationsRow] = await db
      .select({
        creators: sql<number>`count(distinct ${schema.participations.creatorWallet})::int`,
      })
      .from(schema.participations);

    return NextResponse.json({
      totalCampaigns: Number(campaignsRow?.total ?? 0),
      activeCampaigns: Number(campaignsRow?.active ?? 0),
      totalEscrowedSol: Number(campaignsRow?.totalBudget ?? 0),
      totalVerifiedViews: Number(proofsRow?.verifiedViews ?? 0),
      totalPaidSol: Number(payoutsRow?.paid ?? 0),
      creatorsReached: Number(participationsRow?.creators ?? 0),
      brandsServed: Number(campaignsRow?.brands ?? 0),
      asOf: new Date().toISOString(),
    });
  } catch (err: any) {
    // Always return a 200 with zeros so the landing page never breaks if
    // the DB is briefly unavailable. The landing UI shouldn't 500 on stats.
    return NextResponse.json(
      {
        totalCampaigns: 0,
        activeCampaigns: 0,
        totalEscrowedSol: 0,
        totalVerifiedViews: 0,
        totalPaidSol: 0,
        creatorsReached: 0,
        brandsServed: 0,
        asOf: new Date().toISOString(),
        error: err?.message ?? 'failed to read counters',
      },
      { status: 200 },
    );
  }
}
