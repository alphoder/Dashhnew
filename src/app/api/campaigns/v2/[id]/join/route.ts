import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { campaignsV2, participations, notifications } from "@/lib/db/schema-v2";
import { participateSchema } from "@/lib/validation/campaign";
import { clientKey, rateLimit } from "@/lib/ratelimit";
import { getSession } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

export async function POST(
  req: Request,
  { params }: { params: { id: string } },
) {
  const { allowed } = rateLimit(clientKey(req, "join"), { limit: 20, windowMs: 60_000 });
  if (!allowed) return new NextResponse("Too Many Requests", { status: 429 });

  const body = await req.json().catch(() => ({}));
  const session = await getSession();
  const creatorWallet = session?.wallet ?? body?.creatorWallet;
  if (!creatorWallet) {
    return NextResponse.json({ error: "creatorWallet required" }, { status: 401 });
  }

  const parsed = participateSchema.safeParse({
    campaignId: params.id,
    postUrl: body?.postUrl,
  });
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const [campaign] = await db
    .select()
    .from(campaignsV2)
    .where(eq(campaignsV2.id, params.id))
    .limit(1);
  if (!campaign) return NextResponse.json({ error: "not found" }, { status: 404 });
  if (campaign.status !== "active") {
    return NextResponse.json({ error: "campaign is not active" }, { status: 409 });
  }

  const existing = await db
    .select()
    .from(participations)
    .where(
      and(
        eq(participations.campaignId, params.id),
        eq(participations.creatorWallet, creatorWallet),
      ),
    )
    .limit(1);
  if (existing.length) {
    return NextResponse.json({ participation: existing[0] });
  }

  const [row] = await db
    .insert(participations)
    .values({
      campaignId: params.id,
      creatorWallet,
      postUrl: parsed.data.postUrl ?? null,
    })
    .returning();

  // Notify the brand
  await db.insert(notifications).values({
    wallet: campaign.brandWallet,
    kind: "campaign.joined",
    title: "New creator joined",
    body: `${creatorWallet.slice(0, 6)}… joined "${campaign.title}"`,
    payload: { campaignId: campaign.id, creatorWallet },
  });

  return NextResponse.json({ participation: row }, { status: 201 });
}
