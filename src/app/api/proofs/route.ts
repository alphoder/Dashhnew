import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  campaignsV2,
  participations,
  proofs,
  payouts,
  notifications,
} from "@/lib/db/schema-v2";
import { submitProofSchema } from "@/lib/validation/campaign";
import { getAdapter } from "@/lib/reclaim";
import { clientKey, rateLimit } from "@/lib/ratelimit";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const { allowed } = rateLimit(clientKey(req, "proof-submit"), {
    limit: 30,
    windowMs: 60_000,
  });
  if (!allowed) return new NextResponse("Too Many Requests", { status: 429 });

  const body = await req.json().catch(() => null);
  const parsed = submitProofSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const [participation] = await db
    .select()
    .from(participations)
    .where(eq(participations.id, parsed.data.participationId))
    .limit(1);
  if (!participation) {
    return NextResponse.json({ error: "participation not found" }, { status: 404 });
  }

  const [campaign] = await db
    .select()
    .from(campaignsV2)
    .where(eq(campaignsV2.id, participation.campaignId))
    .limit(1);
  if (!campaign) {
    return NextResponse.json({ error: "campaign not found" }, { status: 404 });
  }

  const adapter = getAdapter(campaign.platform);
  const engagement = adapter.parseProof(parsed.data.rawProof);
  const verifiedViews = engagement?.views ?? 0;
  const isValid = Boolean(engagement);

  const [proofRow] = await db
    .insert(proofs)
    .values({
      participationId: participation.id,
      reclaimProofId: parsed.data.reclaimProofId,
      rawProof: parsed.data.rawProof as any,
      verifiedViews,
      status: isValid ? "verified" : "rejected",
      verifiedAt: isValid ? new Date() : null,
    })
    .returning();

  if (isValid && verifiedViews > 0) {
    const amount = Math.min(verifiedViews * campaign.cpv, campaign.budget);
    await db.insert(payouts).values({
      proofId: proofRow.id,
      amount,
      status: "pending",
    });

    await db.insert(notifications).values({
      wallet: participation.creatorWallet,
      kind: "proof.verified",
      title: "Proof verified",
      body: `You earned ${amount.toFixed(4)} SOL from "${campaign.title}"`,
      payload: { proofId: proofRow.id, amount, campaignId: campaign.id },
    });
  } else {
    await db.insert(notifications).values({
      wallet: participation.creatorWallet,
      kind: "proof.rejected",
      title: "Proof rejected",
      body: `Verification for "${campaign.title}" could not be confirmed.`,
      payload: { campaignId: campaign.id },
    });
  }

  return NextResponse.json({ proof: proofRow }, { status: 201 });
}
