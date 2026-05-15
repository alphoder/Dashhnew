// Creator self-view aggregator.
//
// Pulls everything a creator's dashboard needs in one round-trip:
//   - Their profile (strike count, ban status, tier)
//   - All their participations, grouped by lifecycle state
//   - Their lifetime earnings + active payout total
//   - Per-participation context (campaign title, platform, endsAt, proofs)
//
// Wallet identification priority:
//   1. SIWS session (preferred — proves wallet ownership)
//   2. ?wallet=<pubkey> query param (fallback so the page works for users
//      who haven't done SIWS yet — read-only data, no risk)

import { NextResponse } from 'next/server';
import { eq, inArray } from 'drizzle-orm';
import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import * as schema from '@/lib/db/schemas';
import { getSession } from '@/lib/auth/session';

export const dynamic = 'force-dynamic';

function getDb() {
  return drizzle(neon(process.env.DATABASE_URL!), { schema });
}

/** Map lifetime-earned SOL → display tier. */
function tierForEarnings(sol: number): {
  name: string;
  next: string | null;
  toNext: number;
} {
  if (sol >= 50) return { name: 'Elite', next: null, toNext: 0 };
  if (sol >= 5) return { name: 'Pro', next: 'Elite', toNext: 50 - sol };
  if (sol >= 0.5) return { name: 'Verified', next: 'Pro', toNext: 5 - sol };
  return { name: 'Rookie', next: 'Verified', toNext: 0.5 - sol };
}

export async function GET(req: Request) {
  try {
    const session = await getSession();
    const { searchParams } = new URL(req.url);
    const wallet = session?.wallet ?? searchParams.get('wallet');
    if (!wallet) {
      return NextResponse.json(
        { error: 'no wallet — pass ?wallet= or sign in with SIWS' },
        { status: 400 },
      );
    }

    const db = getDb();

    // Profile (creator row)
    const [profile] = await db
      .select()
      .from(schema.profiles)
      .where(eq(schema.profiles.wallet, wallet))
      .limit(1);

    // All participations for this wallet
    const parts = await db
      .select()
      .from(schema.participations)
      .where(eq(schema.participations.creatorWallet, wallet));

    if (parts.length === 0) {
      return NextResponse.json({
        wallet,
        profile: profile ?? null,
        tier: tierForEarnings(0),
        totals: {
          lifetimeEarnedSol: 0,
          activeCampaigns: 0,
          pendingPayouts: 0,
          lifetimeVerifiedViews: 0,
          settlementsCount: 0,
        },
        participations: [],
      });
    }

    // Pull related campaigns
    const campaignIds = Array.from(new Set(parts.map((p) => p.campaignId)));
    const campaigns = await db
      .select()
      .from(schema.campaignsV2)
      .where(inArray(schema.campaignsV2.id, campaignIds));
    const campaignById = new Map(campaigns.map((c) => [c.id, c]));

    // Pull proofs for all these participations
    const partIds = parts.map((p) => p.id);
    const proofs = await db
      .select()
      .from(schema.proofs)
      .where(inArray(schema.proofs.participationId, partIds));
    const proofsByPart = new Map<string, typeof proofs>();
    for (const pr of proofs) {
      if (!proofsByPart.has(pr.participationId)) {
        proofsByPart.set(pr.participationId, []);
      }
      proofsByPart.get(pr.participationId)!.push(pr);
    }

    // Pull payouts attached to those proofs
    const proofIds = proofs.map((p) => p.id);
    const payouts =
      proofIds.length > 0
        ? await db
            .select()
            .from(schema.payouts)
            .where(inArray(schema.payouts.proofId, proofIds))
        : [];
    const payoutByProof = new Map<string, typeof payouts>();
    for (const py of payouts) {
      if (!payoutByProof.has(py.proofId)) {
        payoutByProof.set(py.proofId, []);
      }
      payoutByProof.get(py.proofId)!.push(py);
    }

    const lifetimeEarnedSol = payouts
      .filter((p) => p.status === 'paid')
      .reduce((sum, p) => sum + (p.amount ?? 0), 0);
    const pendingPayoutSol = payouts
      .filter((p) => p.status === 'pending')
      .reduce((sum, p) => sum + (p.amount ?? 0), 0);
    const lifetimeVerifiedViews = proofs
      .filter((p) => p.status === 'verified')
      .reduce((max, p) => Math.max(max, p.verifiedViews ?? 0), 0);

    // Build a per-participation summary
    const now = new Date();
    const rows = parts.map((part) => {
      const c = campaignById.get(part.campaignId);
      const partProofs = proofsByPart.get(part.id) ?? [];
      const joinProof = part.joinProofId
        ? partProofs.find((p) => p.id === part.joinProofId)
        : null;
      const finalProof = part.finalProofId
        ? partProofs.find((p) => p.id === part.finalProofId)
        : null;

      const partPayouts: Array<{
        amount: number | null;
        status: string;
        txSig: string | null;
      }> = [];
      for (const pr of partProofs) {
        const ps = payoutByProof.get(pr.id) ?? [];
        for (const py of ps) {
          partPayouts.push({
            amount: py.amount,
            status: py.status,
            txSig: py.txSig,
          });
        }
      }
      const earnedOnThis = partPayouts
        .filter((p) => p.status === 'paid')
        .reduce((sum, p) => sum + (p.amount ?? 0), 0);

      // Lifecycle bucketing — easier for the client than re-computing
      let bucket:
        | 'action_needed'
        | 'awaiting_join'
        | 'in_progress'
        | 'settled'
        | 'forfeited'
        | 'disqualified';
      if (part.disqualified) {
        bucket = 'disqualified';
      } else if (part.forfeited || part.settlementStatus === 'forfeited') {
        bucket = 'forfeited';
      } else if (
        part.settlementStatus === 'settled' ||
        part.settledAt !== null
      ) {
        bucket = 'settled';
      } else if (!joinProof) {
        bucket = 'awaiting_join';
      } else if (c && new Date(c.endsAt) < now && !finalProof) {
        bucket = 'action_needed';
      } else {
        bucket = 'in_progress';
      }

      return {
        participationId: part.id,
        campaignId: part.campaignId,
        campaignTitle: c?.title ?? '—',
        platform: c?.platform ?? 'instagram',
        iconUrl: c?.iconUrl,
        endsAt: c?.endsAt,
        settlementWindowDays: c?.settlementWindowDays ?? 7,
        settlementStatus: part.settlementStatus,
        bucket,
        joinedAt: part.joinedAt,
        joinViews: joinProof?.verifiedViews ?? null,
        finalViews: finalProof?.verifiedViews ?? null,
        earnedOnThis,
        disqualificationReason: part.disqualificationReason,
        payouts: partPayouts,
      };
    });

    return NextResponse.json({
      wallet,
      profile: profile ?? null,
      tier: tierForEarnings(lifetimeEarnedSol),
      totals: {
        lifetimeEarnedSol,
        activeCampaigns: rows.filter(
          (r) => r.bucket === 'in_progress' || r.bucket === 'action_needed',
        ).length,
        pendingPayouts: pendingPayoutSol,
        lifetimeVerifiedViews,
        settlementsCount: rows.filter((r) => r.bucket === 'settled').length,
      },
      participations: rows.sort((a, b) => {
        const order = {
          action_needed: 0,
          awaiting_join: 1,
          in_progress: 2,
          settled: 3,
          disqualified: 4,
          forfeited: 5,
        } as const;
        return order[a.bucket] - order[b.bucket];
      }),
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message ?? 'internal error' },
      { status: 500 },
    );
  }
}
