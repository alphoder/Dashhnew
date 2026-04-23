import { NextResponse } from 'next/server';
import { eq, and } from 'drizzle-orm';
import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import * as schema from '@/lib/db/schemas';
import { clientKey, rateLimit } from '@/lib/ratelimit';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

function getDb() {
  return drizzle(neon(process.env.DATABASE_URL!), { schema });
}

const bodySchema = z.object({
  creatorWallet: z.string().min(32),
  postUrl: z.string().url().optional(),
  termsVersion: z.string().min(1).optional(),
  termsSignature: z.string().min(10).optional(),
});

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const { allowed } = rateLimit(clientKey(req, 'participate'), {
    limit: 20,
    windowMs: 60_000,
  });
  if (!allowed) return new NextResponse('Too Many Requests', { status: 429 });

  try {
    const body = await req.json();
    const parsed = bodySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }

    const db = getDb();
    // Ensure campaign exists and is active
    const [campaign] = await db
      .select()
      .from(schema.campaignsV2)
      .where(eq(schema.campaignsV2.id, params.id))
      .limit(1);
    if (!campaign) return NextResponse.json({ error: 'campaign not found' }, { status: 404 });
    if (campaign.status !== 'active') {
      return NextResponse.json({ error: 'campaign not active' }, { status: 400 });
    }

    // Upsert participation
    const existing = await db
      .select()
      .from(schema.participations)
      .where(
        and(
          eq(schema.participations.campaignId, params.id),
          eq(schema.participations.creatorWallet, parsed.data.creatorWallet),
        ),
      )
      .limit(1);

    let participation;
    if (existing.length) {
      participation = existing[0];
      if (parsed.data.postUrl) {
        [participation] = await db
          .update(schema.participations)
          .set({ postUrl: parsed.data.postUrl })
          .where(eq(schema.participations.id, participation.id))
          .returning();
      }
    } else {
      // A signature is required for new joins. Existing joins can re-post
      // without re-signing (same terms version already accepted).
      if (!parsed.data.termsSignature) {
        return NextResponse.json(
          {
            error:
              'Creator terms must be signed before joining. Re-send with termsVersion + termsSignature.',
          },
          { status: 400 },
        );
      }
      [participation] = await db
        .insert(schema.participations)
        .values({
          campaignId: params.id,
          creatorWallet: parsed.data.creatorWallet,
          postUrl: parsed.data.postUrl,
          termsVersion: parsed.data.termsVersion ?? 'v1',
          termsSignature: parsed.data.termsSignature,
          termsSignedAt: new Date(),
        })
        .returning();

      // Notify brand
      await db.insert(schema.notifications).values({
        wallet: campaign.brandWallet,
        kind: 'participation_joined',
        title: 'New creator joined your campaign',
        body: `${parsed.data.creatorWallet.slice(0, 6)}… joined "${campaign.title}"`,
        payload: { campaignId: campaign.id, creator: parsed.data.creatorWallet },
      });
    }

    return NextResponse.json({ participation });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message ?? 'internal error' }, { status: 500 });
  }
}
