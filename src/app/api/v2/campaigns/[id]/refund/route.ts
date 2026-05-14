// Manual brand-triggered refund.
//
// The cron settlement runner will auto-refund a campaign with zero settled
// creators, but brands may want to claim their refund immediately after the
// 7-day final-proof window closes rather than waiting for the next cron run.
//
// This endpoint exposes that path. Guardrails:
//   1. Caller must be the brand wallet (via SIWS session OR body fallback).
//   2. Campaign must be past `endsAt + settlementWindowDays`.
//   3. No participation may have `settlementStatus = 'settled'`.
//   4. Idempotent — if already refunded (campaign.status === 'cancelled' and
//      a refund notification exists), return 409 with the existing record.

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
  const { allowed } = rateLimit(clientKey(req, 'campaign:refund'), {
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

    // 1. Brand-only
    if (campaign.brandWallet !== callerWallet) {
      return NextResponse.json(
        { error: 'only the brand wallet that created this campaign can refund' },
        { status: 403 },
      );
    }

    // 2. Past the final-proof window
    const now = new Date();
    const endsAt = new Date(campaign.endsAt);
    const windowDays = campaign.settlementWindowDays ?? 7;
    const refundEligibleAt = new Date(
      endsAt.getTime() + windowDays * 86_400_000,
    );
    if (now < refundEligibleAt) {
      return NextResponse.json(
        {
          error: 'campaign still inside settlement window',
          refundEligibleAt: refundEligibleAt.toISOString(),
        },
        { status: 400 },
      );
    }

    // 3. No settled participations
    const parts = await db
      .select()
      .from(schema.participations)
      .where(eq(schema.participations.campaignId, params.id));
    const anySettled = parts.some((p) => p.settlementStatus === 'settled');
    if (anySettled) {
      return NextResponse.json(
        {
          error:
            'campaign has settled creators — partial refunds are not supported. Wait for the cron settlement to finalise per-creator payouts.',
          settledCount: parts.filter((p) => p.settlementStatus === 'settled')
            .length,
        },
        { status: 400 },
      );
    }

    // 4. Idempotency — if already cancelled with an existing refund notification,
    //    return 409 with that record instead of double-paying.
    const existingRefunds = await db
      .select()
      .from(schema.notifications)
      .where(
        and(
          eq(schema.notifications.wallet, campaign.brandWallet),
          eq(schema.notifications.kind, 'campaign_refunded'),
        ),
      );
    const alreadyRefunded = existingRefunds.find(
      (n) => (n.payload as any)?.campaignId === campaign.id,
    );
    if (alreadyRefunded) {
      return NextResponse.json(
        {
          error: 'already refunded',
          refund: {
            amount: (alreadyRefunded.payload as any)?.amount,
            txSignature: (alreadyRefunded.payload as any)?.txSignature,
            refundedAt: alreadyRefunded.createdAt,
          },
        },
        { status: 409 },
      );
    }

    // 5. Execute the on-chain refund
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

    // 6. Mark all unsettled participations as forfeited (no creator gets paid)
    for (const p of parts) {
      if (
        p.settlementStatus !== 'settled' &&
        p.settlementStatus !== 'forfeited'
      ) {
        await db
          .update(schema.participations)
          .set({
            forfeited: true,
            settlementStatus: 'forfeited',
            settledAt: now,
          })
          .where(eq(schema.participations.id, p.id));
      }
    }

    // 7. Cancel the campaign + record the refund notification
    await db
      .update(schema.campaignsV2)
      .set({ status: 'cancelled', settledAt: now })
      .where(eq(schema.campaignsV2.id, params.id));

    await db.insert(schema.notifications).values({
      wallet: campaign.brandWallet,
      kind: 'campaign_refunded',
      title: `Refund issued · ${campaign.budget.toFixed(4)} SOL`,
      body: `"${campaign.title}" refunded in full per the no-show clause.`,
      payload: {
        campaignId: campaign.id,
        amount: campaign.budget,
        txSignature: txDescriptor,
        kind: refundResult.kind,
        trigger: 'manual',
      },
    });

    return NextResponse.json({
      refund: {
        amount: campaign.budget,
        txSignature: txDescriptor,
        refundedAt: now.toISOString(),
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
