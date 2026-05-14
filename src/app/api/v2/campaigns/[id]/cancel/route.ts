// Brand-side campaign cancellation.
//
// Lets a brand pull the plug on a campaign BEFORE creators have started
// joining. Different from /refund (P0.3) in two ways:
//
//   1. /cancel is callable while the campaign is still inside its active
//      window (endsAt has not passed) — it's the "I made a mistake" button.
//      /refund is callable AFTER the settlement window closes — it's the
//      "no one showed up" button.
//
//   2. /cancel rejects if ANY participation exists. Once a creator has
//      signed the terms and joined, the campaign must run its full course
//      (per the brand's signed terms message — cancelling unilaterally
//      after a join would violate the on-chain T&C).
//
// Both paths refund the full budget to the brand and end up with
// `campaigns_v2.status = 'cancelled'`.

import { NextResponse } from 'next/server';
import { and, eq } from 'drizzle-orm';
import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import * as schema from '@/lib/db/schemas';
import { getSession } from '@/lib/auth/session';
import { executePayout } from '@/lib/solana/escrow';
import { clientKey, rateLimit } from '@/lib/ratelimit';

export const dynamic = 'force-dynamic';

function getDb() {
  return drizzle(neon(process.env.DATABASE_URL!), { schema });
}

export async function POST(
  req: Request,
  { params }: { params: { id: string } },
) {
  const { allowed } = rateLimit(clientKey(req, 'campaign:cancel'), {
    limit: 5,
    windowMs: 60_000,
  });
  if (!allowed) return new NextResponse('Too Many Requests', { status: 429 });

  try {
    const db = getDb();
    const session = await getSession();
    const body = await req.json().catch(() => ({}));
    const callerWallet: string | undefined =
      session?.wallet ?? (body as any)?.brandWallet;
    if (!callerWallet) {
      return NextResponse.json({ error: 'unauthenticated' }, { status: 401 });
    }

    const [campaign] = await db
      .select()
      .from(schema.campaignsV2)
      .where(eq(schema.campaignsV2.id, params.id))
      .limit(1);
    if (!campaign) {
      return NextResponse.json({ error: 'campaign not found' }, { status: 404 });
    }

    // Brand-only
    if (campaign.brandWallet !== callerWallet) {
      return NextResponse.json(
        { error: 'only the brand wallet can cancel this campaign' },
        { status: 403 },
      );
    }

    // Already cancelled / settled? idempotent return.
    if (
      campaign.status === 'cancelled' ||
      campaign.status === 'completed' ||
      campaign.settledAt
    ) {
      return NextResponse.json(
        {
          error: 'campaign already finalised',
          status: campaign.status,
          settledAt: campaign.settledAt,
        },
        { status: 409 },
      );
    }

    // Has anyone joined? If yes, cancellation is not allowed.
    const parts = await db
      .select()
      .from(schema.participations)
      .where(eq(schema.participations.campaignId, params.id));
    if (parts.length > 0) {
      return NextResponse.json(
        {
          error:
            'campaign has participants — cancellation requires zero joins. Use /refund after the settlement window closes if no one submits final proofs.',
          participantCount: parts.length,
        },
        { status: 400 },
      );
    }

    // Already past endsAt? Send to /refund instead.
    const now = new Date();
    if (new Date(campaign.endsAt) < now) {
      return NextResponse.json(
        {
          error:
            'campaign has already ended. Use /refund after the settlement window closes.',
        },
        { status: 400 },
      );
    }

    // Execute the refund on-chain
    const refundResult = await executePayout({
      toWallet: campaign.brandWallet,
      amountSol: campaign.budget,
    });

    if (refundResult.kind === 'failed') {
      return NextResponse.json(
        { error: 'on-chain refund failed', detail: refundResult.error },
        { status: 502 },
      );
    }

    const txDescriptor =
      refundResult.kind === 'paid'
        ? refundResult.signature
        : `DRY_RUN:${refundResult.reason}`;

    // Update campaign
    await db
      .update(schema.campaignsV2)
      .set({ status: 'cancelled', settledAt: now })
      .where(eq(schema.campaignsV2.id, params.id));

    // Notification
    await db.insert(schema.notifications).values({
      wallet: campaign.brandWallet,
      kind: 'campaign_cancelled',
      title: `Campaign cancelled · ${campaign.budget.toFixed(4)} SOL refunded`,
      body: `"${campaign.title}" was cancelled before any creator joined. Full escrow refunded.`,
      payload: {
        campaignId: campaign.id,
        amount: campaign.budget,
        txSignature: txDescriptor,
        kind: refundResult.kind,
        trigger: 'manual_cancel',
      },
    });

    return NextResponse.json({
      cancelled: {
        campaignId: campaign.id,
        amount: campaign.budget,
        txSignature: txDescriptor,
        cancelledAt: now.toISOString(),
        kind: refundResult.kind,
      },
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message ?? 'internal error' },
      { status: 500 },
    );
  }
}
