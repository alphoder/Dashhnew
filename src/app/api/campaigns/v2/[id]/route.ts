import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { campaignsV2, participations, proofs } from "@/lib/db/schema-v2";

export const dynamic = "force-dynamic";

export async function GET(
  _req: Request,
  { params }: { params: { id: string } },
) {
  const [campaign] = await db
    .select()
    .from(campaignsV2)
    .where(eq(campaignsV2.id, params.id))
    .limit(1);

  if (!campaign) {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }

  const joined = await db
    .select()
    .from(participations)
    .where(eq(participations.campaignId, params.id));

  const proofRows = joined.length
    ? await db
        .select()
        .from(proofs)
        .where(eq(proofs.status, "verified"))
    : [];

  const totalVerifiedViews = proofRows.reduce(
    (sum, p) => sum + (p.verifiedViews ?? 0),
    0,
  );

  return NextResponse.json({
    campaign,
    stats: {
      participants: joined.length,
      verifiedViews: totalVerifiedViews,
      spent: totalVerifiedViews * campaign.cpv,
      remaining: Math.max(0, campaign.budget - totalVerifiedViews * campaign.cpv),
    },
  });
}

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } },
) {
  const body = await req.json().catch(() => ({}));
  const allowed = ["status", "title", "description", "endsAt"] as const;
  const updates: Record<string, unknown> = {};
  for (const key of allowed) {
    if (body[key] !== undefined) updates[key] = body[key];
  }
  if (updates.endsAt) updates.endsAt = new Date(updates.endsAt as string);
  updates.updatedAt = new Date();

  const [row] = await db
    .update(campaignsV2)
    .set(updates)
    .where(eq(campaignsV2.id, params.id))
    .returning();

  return NextResponse.json({ campaign: row });
}
