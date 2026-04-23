import { NextResponse } from 'next/server';
import { eq, desc } from 'drizzle-orm';
import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import * as schema from '@/lib/db/schemas';
import { pollPublicViews } from '@/lib/platform-poll';

export const dynamic = 'force-dynamic';

function getDb() {
  return drizzle(neon(process.env.DATABASE_URL!), { schema });
}

/**
 * Sync a single participation's pending view count. Creators can hit this
 * on-demand from the UI; the batch /api/v2/sync endpoint fans out to every
 * active participation via cron.
 */
export async function POST(
  _req: Request,
  { params }: { params: { id: string } },
) {
  try {
    const db = getDb();
    const [participation] = await db
      .select()
      .from(schema.participations)
      .where(eq(schema.participations.id, params.id))
      .limit(1);
    if (!participation) {
      return NextResponse.json({ error: 'participation not found' }, { status: 404 });
    }
    const [campaign] = await db
      .select()
      .from(schema.campaignsV2)
      .where(eq(schema.campaignsV2.id, participation.campaignId))
      .limit(1);
    if (!campaign) {
      return NextResponse.json({ error: 'campaign not found' }, { status: 404 });
    }

    // Compute the previous max — use verified if higher than pending.
    const prior = await db
      .select()
      .from(schema.proofs)
      .where(eq(schema.proofs.participationId, participation.id))
      .orderBy(desc(schema.proofs.verifiedAt))
      .limit(1);
    const verifiedMax = prior[0]?.verifiedViews ?? 0;
    const previous = Math.max(
      participation.pendingViews ?? 0,
      verifiedMax,
    );

    const { views, live } = await pollPublicViews(
      campaign.platform as any,
      participation.postUrl,
      previous,
    );

    const newPending = Math.max(previous, views);
    await db
      .update(schema.participations)
      .set({ pendingViews: newPending, lastSyncedAt: new Date() })
      .where(eq(schema.participations.id, participation.id));

    // Nudge the creator if new public views are worth verifying.
    const unverified = newPending - verifiedMax;
    if (unverified >= 100) {
      await db.insert(schema.notifications).values({
        wallet: participation.creatorWallet,
        kind: 'pending_views',
        title: `${unverified.toLocaleString()} new views waiting to be verified`,
        body: `Re-run Reclaim on "${campaign.title}" to convert them into a verified payout.`,
        payload: {
          participationId: participation.id,
          campaignId: campaign.id,
          unverified,
        },
      });
    }

    return NextResponse.json({
      participationId: participation.id,
      pendingViews: newPending,
      verifiedViews: verifiedMax,
      unverifiedDelta: unverified,
      live,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message ?? 'internal error' }, { status: 500 });
  }
}
