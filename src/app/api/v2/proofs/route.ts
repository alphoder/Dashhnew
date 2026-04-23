import { NextResponse } from 'next/server';
import { and, eq } from 'drizzle-orm';
import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import * as schema from '@/lib/db/schemas';
import { z } from 'zod';
import { clientKey, rateLimit } from '@/lib/ratelimit';
import { getAdapter } from '@/lib/reclaim';
import { verify } from '@/lib/reclaim/verify';
import { anchorProofToArweave } from '@/lib/arweave';
import { getSession } from '@/lib/auth/session';
import { computePayoutForProof, type PaymentModel } from '@/lib/payouts';
import { nextTrustExpiry } from '@/lib/trust';
import { routeProofByWindow, settlementDeadline } from '@/lib/settlement';

export const dynamic = 'force-dynamic';

function getDb() {
  return drizzle(neon(process.env.DATABASE_URL!), { schema });
}

const submitSchema = z.object({
  participationId: z.string().uuid(),
  reclaimProofId: z.string().min(1),
  rawProof: z.unknown(),
});

/**
 * Record a disqualification against a wallet.  After 3 strikes in 90 days
 * (or a "severe" hit), the wallet is banned — `profiles_v2.banned = true`.
 */
async function recordDisqualification(
  db: ReturnType<typeof getDb>,
  wallet: string,
  reason: string,
  severe: boolean,
): Promise<{ banned: boolean }> {
  const rows = await db
    .select()
    .from(schema.profiles)
    .where(eq(schema.profiles.wallet, wallet));

  if (rows.length === 0) {
    await db.insert(schema.profiles).values({
      wallet,
      role: 'creator',
      disqualificationCount: 1,
      banned: severe,
      banReason: severe ? reason : null,
      bannedAt: severe ? new Date() : null,
    });
    return { banned: severe };
  }

  let banned = false;
  for (const row of rows) {
    const nextCount = (row.disqualificationCount ?? 0) + 1;
    const shouldBan = severe || nextCount >= 3;
    if (shouldBan) banned = true;
    await db
      .update(schema.profiles)
      .set({
        disqualificationCount: nextCount,
        banned: row.banned || shouldBan,
        banReason: row.banned
          ? row.banReason
          : shouldBan
            ? reason
            : row.banReason,
        bannedAt: row.banned
          ? row.bannedAt
          : shouldBan
            ? new Date()
            : null,
        updatedAt: new Date(),
      })
      .where(eq(schema.profiles.id, row.id));
  }
  return { banned };
}

export async function POST(req: Request) {
  const { allowed } = rateLimit(clientKey(req, 'proofs'), {
    limit: 20,
    windowMs: 60_000,
  });
  if (!allowed) return new NextResponse('Too Many Requests', { status: 429 });

  try {
    const body = await req.json();
    const parsed = submitSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }

    const db = getDb();
    const [participation] = await db
      .select()
      .from(schema.participations)
      .where(eq(schema.participations.id, parsed.data.participationId))
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

    const session = await getSession();
    if (session && session.wallet !== participation.creatorWallet) {
      return NextResponse.json(
        { error: 'wallet does not match participation' },
        { status: 403 },
      );
    }

    const adapter = getAdapter(campaign.platform as any);
    const engagement = adapter.parseProof(parsed.data.rawProof);
    if (!engagement) {
      return NextResponse.json(
        {
          error: 'proof could not be parsed',
          disqualificationReason:
            'Submitting a Reclaim proof that fails cryptographic verification',
        },
        { status: 400 },
      );
    }

    // Creator profile — used for linked-handle + ban check
    const [creatorProfile] = await db
      .select()
      .from(schema.profiles)
      .where(
        and(
          eq(schema.profiles.wallet, participation.creatorWallet),
          eq(schema.profiles.role, 'creator'),
        ),
      )
      .limit(1);

    if (creatorProfile?.banned) {
      return NextResponse.json(
        {
          error: 'wallet is banned',
          banReason: creatorProfile.banReason,
          bannedAt: creatorProfile.bannedAt,
        },
        { status: 403 },
      );
    }

    const linkedHandle =
      campaign.platform === 'instagram'
        ? creatorProfile?.instagramHandle ?? null
        : campaign.platform === 'youtube'
          ? creatorProfile?.youtubeHandle ?? null
          : campaign.platform === 'twitter'
            ? creatorProfile?.twitterHandle ?? null
            : campaign.platform === 'tiktok'
              ? creatorProfile?.tiktokHandle ?? null
              : null;

    // Prior proofs for this campaign — for velocity + non-decreasing-views
    const priorProofs = await db
      .select()
      .from(schema.proofs)
      .where(eq(schema.proofs.participationId, parsed.data.participationId));
    const previousViewsForThisCampaign = priorProofs
      .filter((p) => p.status === 'verified')
      .reduce((max, p) => Math.max(max, p.verifiedViews ?? 0), 0);

    // Run the verdict
    const verdict = verify(engagement, {
      linkedHandle,
      campaignStartsAt: new Date(campaign.startsAt),
      bannedCreator: !!creatorProfile?.banned,
      previousProofsForThisCampaign: priorProofs.length,
      previousViewsForThisCampaign,
      requiredHashtag: (campaign as any).requiredHashtag ?? null,
      requiredMention: (campaign as any).requiredMention ?? null,
      requiredPhrase: (campaign as any).requiredPhrase ?? null,
      campaignId: campaign.id,
    });

    const status: 'verified' | 'rejected' =
      verdict.severity === 'ok' ? 'verified' : 'rejected';
    const verifiedViews = status === 'verified' ? engagement.views : 0;

    // Anchor only verified proofs to Arweave
    let arweaveTx: string | null = null;
    if (status === 'verified') {
      const result = await anchorProofToArweave(parsed.data.rawProof, {
        'Reclaim-Proof-Id': parsed.data.reclaimProofId,
        Platform: String(campaign.platform),
        'Creator-Wallet': participation.creatorWallet,
        'Campaign-Id': campaign.id,
      });
      arweaveTx = result.txId;
    }

    const [proof] = await db
      .insert(schema.proofs)
      .values({
        participationId: parsed.data.participationId,
        reclaimProofId: parsed.data.reclaimProofId,
        verifiedViews,
        rawProof: parsed.data.rawProof as any,
        arweaveTx,
        status,
        verifiedAt: status === 'verified' ? new Date() : null,
      })
      .returning();

    // Success path — 2-proof settlement routing
    if (status === 'verified' && verifiedViews > 0) {
      const routing = routeProofByWindow(
        campaign as any,
        participation,
        new Date(),
      );

      if (routing.kind === 'refused') {
        // Still record the proof for audit, but don't link it to settlement
        return NextResponse.json(
          { proof, engagement, verdict, refused: routing.reason },
          { status: 409 },
        );
      }

      const now = new Date();
      if (routing.kind === 'join') {
        // Proof #1 — anchor ownership + baseline, NO payout yet.
        await db
          .update(schema.participations)
          .set({
            joinProofId: proof.id,
            settlementStatus: 'active',
            pendingViews: verifiedViews,
            lastSyncedAt: now,
            // Keep trust fields for display-only auto-sync UI
            trustMode: true,
            trustedUntil: nextTrustExpiry(now),
            lastProofCheckpointAt: now,
          })
          .where(eq(schema.participations.id, parsed.data.participationId));

        const deadline = settlementDeadline(campaign as any);
        await db.insert(schema.notifications).values({
          wallet: participation.creatorWallet,
          kind: 'proof_join_recorded',
          title: 'Join proof recorded',
          body: `Baseline ${verifiedViews.toLocaleString()} views anchored for "${campaign.title}". Final proof must be submitted before ${deadline.toLocaleDateString()}.`,
          payload: {
            proofId: proof.id,
            campaignId: campaign.id,
            deadline: deadline.toISOString(),
          },
        });
        return NextResponse.json({ proof, engagement, verdict, kind: 'join' });
      }

      // routing.kind === 'final' — proof #2, fire the payout.
      const allParticipations = await db
        .select()
        .from(schema.participations)
        .where(eq(schema.participations.campaignId, campaign.id));
      const allProofIds = new Set<string>();
      const campaignProofs = await db.select().from(schema.proofs);
      for (const p of campaignProofs) {
        if (allParticipations.some((pp) => pp.id === p.participationId)) {
          allProofIds.add(p.id);
        }
      }
      const allPayouts = await db.select().from(schema.payouts);
      const totalAlreadyPaidOnCampaign = allPayouts
        .filter((py) => allProofIds.has(py.proofId))
        .reduce((sum, py) => sum + (py.amount ?? 0), 0);

      const decision = computePayoutForProof({
        model: (campaign.paymentModel as PaymentModel) ?? 'per_view',
        cpv: campaign.cpv,
        budget: campaign.budget,
        newViews: verifiedViews,
        previousMaxViewsThisCreator: 0, // final is the authoritative count
        totalAlreadyPaidOnCampaign,
      });

      if (decision.amount > 0 && !decision.deferredToEnd) {
        await db.insert(schema.payouts).values({
          proofId: proof.id,
          amount: decision.amount,
          status: 'pending',
        });
      }

      await db
        .update(schema.participations)
        .set({
          finalProofId: proof.id,
          settlementStatus: decision.deferredToEnd
            ? 'awaiting_final' // pool-based models finalise in /api/v2/settle
            : 'settled',
          settledAt: decision.deferredToEnd ? null : now,
          pendingViews: verifiedViews,
          lastSyncedAt: now,
        })
        .where(eq(schema.participations.id, parsed.data.participationId));

      await db.insert(schema.notifications).values({
        wallet: participation.creatorWallet,
        kind: 'proof_final_recorded',
        title: decision.deferredToEnd
          ? 'Final proof recorded · awaiting campaign settlement'
          : decision.amount > 0
            ? 'Final proof verified · payout queued'
            : 'Final proof verified · no payout',
        body: `${verifiedViews.toLocaleString()} views locked in. ${decision.reason}`,
        payload: {
          proofId: proof.id,
          amount: decision.amount,
          campaignId: campaign.id,
          deferredToEnd: decision.deferredToEnd,
        },
      });
      return NextResponse.json({
        proof,
        engagement,
        verdict,
        kind: 'final',
        payout: decision,
      });
    }

    // Rejection / severe path — track disqualification + maybe ban
    if (verdict.severity === 'reject' || verdict.severity === 'severe') {
      const severe = verdict.severity === 'severe';
      const { banned } = await recordDisqualification(
        db,
        participation.creatorWallet,
        verdict.disqualificationReason ?? verdict.reason ?? 'unknown',
        severe,
      );
      await db
        .update(schema.participations)
        .set({
          disqualified: true,
          disqualificationReason:
            verdict.disqualificationReason ?? verdict.reason,
          disqualifiedAt: new Date(),
        })
        .where(eq(schema.participations.id, parsed.data.participationId));

      await db.insert(schema.notifications).values({
        wallet: participation.creatorWallet,
        kind: banned ? 'banned' : 'proof_rejected',
        title: banned ? 'You have been banned' : 'Proof rejected',
        body:
          verdict.disqualificationReason ??
          verdict.reason ??
          'Proof failed verification',
        payload: {
          participationId: participation.id,
          severity: verdict.severity,
          banned,
        },
      });

      return NextResponse.json(
        { proof, verdict, banned },
        { status: banned ? 403 : 400 },
      );
    }

    // Warning → held for community review; no ban counter, no payout yet
    await db.insert(schema.notifications).values({
      wallet: participation.creatorWallet,
      kind: 'proof_flagged',
      title: 'Proof flagged for review',
      body:
        verdict.reason ??
        'Proof looks unusual and is held pending community review.',
      payload: {
        proofId: proof.id,
        campaignId: campaign.id,
        severity: verdict.severity,
      },
    });
    return NextResponse.json({ proof, verdict });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message ?? 'internal error' },
      { status: 500 },
    );
  }
}
