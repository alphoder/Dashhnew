import { NextResponse } from 'next/server';
import { desc } from 'drizzle-orm';
import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import * as schema from '@/lib/db/schemas';
import { createCampaignSchema } from '@/lib/validation/campaign';
import { clientKey, rateLimit } from '@/lib/ratelimit';
import { getSession } from '@/lib/auth/session';

export const dynamic = 'force-dynamic';

function getDb() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error('DATABASE_URL not configured');
  return drizzle(neon(url), { schema });
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const platform = searchParams.get('platform');
    const status = searchParams.get('status') ?? 'active';
    const brandWallet = searchParams.get('brand');

    const db = getDb();
    let rows = await db
      .select()
      .from(schema.campaignsV2)
      .orderBy(desc(schema.campaignsV2.createdAt))
      .limit(100);

    if (platform) rows = rows.filter((r) => r.platform === platform);
    if (status) rows = rows.filter((r) => r.status === status);
    if (brandWallet) rows = rows.filter((r) => r.brandWallet === brandWallet);

    return NextResponse.json({ campaigns: rows });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message ?? 'internal error', campaigns: [] },
      { status: 500 },
    );
  }
}

export async function POST(req: Request) {
  const { allowed } = rateLimit(clientKey(req, 'campaigns:create'), {
    limit: 10,
    windowMs: 60_000,
  });
  if (!allowed) return new NextResponse('Too Many Requests', { status: 429 });

  try {
    // Session guard — prefer SIWS session, fall back to body-provided wallet
    // while the SIWS flow is still opt-in for older pages.
    const session = await getSession();
    const body = await req.json();
    const brandWallet: string | undefined = session?.wallet ?? body.brandWallet;
    if (!brandWallet) {
      return NextResponse.json({ error: 'unauthenticated' }, { status: 401 });
    }

    const parsed = createCampaignSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }

    const db = getDb();
    const [row] = await db
      .insert(schema.campaignsV2)
      .values({
        brandWallet,
        title: parsed.data.title,
        description: parsed.data.description,
        platform: parsed.data.platform,
        iconUrl: parsed.data.iconUrl,
        ctaLabel: parsed.data.ctaLabel,
        budget: parsed.data.budget,
        cpv: parsed.data.cpv,
        paymentModel: parsed.data.paymentModel,
        topNCount: parsed.data.topNCount ?? 1,
        platformFeeBps: parsed.data.platformFeeBps,
        termsVersion: parsed.data.termsVersion,
        termsSignature: parsed.data.termsSignature,
        termsSignedAt: new Date(),
        startsAt: parsed.data.startsAt,
        endsAt: parsed.data.endsAt,
        status: 'active',
      })
      .returning();

    return NextResponse.json({ campaign: row });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message ?? 'internal error' }, { status: 500 });
  }
}
