import { NextResponse } from "next/server";
import { and, desc, eq, gt, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { campaignsV2, participations } from "@/lib/db/schema-v2";
import { createCampaignSchema, platformSchema } from "@/lib/validation/campaign";
import { clientKey, rateLimit } from "@/lib/ratelimit";
import { getSession } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const platform = searchParams.get("platform");
  const status = searchParams.get("status") ?? "active";
  const limit = Math.min(Number(searchParams.get("limit") ?? 50), 100);

  const filters = [eq(campaignsV2.status, status as any)];
  if (platform) {
    const parsed = platformSchema.safeParse(platform);
    if (parsed.success) filters.push(eq(campaignsV2.platform, parsed.data));
  }
  filters.push(gt(campaignsV2.endsAt, new Date()));

  const rows = await db
    .select()
    .from(campaignsV2)
    .where(and(...filters))
    .orderBy(desc(campaignsV2.createdAt))
    .limit(limit);

  return NextResponse.json({ items: rows });
}

export async function POST(req: Request) {
  const { allowed } = rateLimit(clientKey(req, "campaigns-create"), {
    limit: 10,
    windowMs: 60_000,
  });
  if (!allowed) return new NextResponse("Too Many Requests", { status: 429 });

  const session = await getSession();
  const body = await req.json().catch(() => null);
  const parsed = createCampaignSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const brandWallet = session?.wallet ?? body?.brandWallet;
  if (!brandWallet) {
    return NextResponse.json({ error: "brandWallet required" }, { status: 401 });
  }

  const [row] = await db
    .insert(campaignsV2)
    .values({
      brandWallet,
      title: parsed.data.title,
      description: parsed.data.description,
      platform: parsed.data.platform,
      iconUrl: parsed.data.iconUrl,
      ctaLabel: parsed.data.ctaLabel,
      budget: parsed.data.budget,
      cpv: parsed.data.cpv,
      startsAt: parsed.data.startsAt,
      endsAt: parsed.data.endsAt,
      status: "active",
    })
    .returning();

  return NextResponse.json({ campaign: row }, { status: 201 });
}
