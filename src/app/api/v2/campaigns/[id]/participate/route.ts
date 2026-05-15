import { NextResponse } from 'next/server';
import { eq, and } from 'drizzle-orm';
import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import * as schema from '@/lib/db/schemas';
import { LIMITS, rateLimitBoth } from '@/lib/ratelimit';
import { guardWrites } from '@/lib/kill-switch';
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
  // Wallet that referred this creator. We only honour it on the wallet's
  // very first participation; subsequent joins ignore the field.
  referredBy: z.string().min(32).optional(),
});

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const blocked = guardWrites();
  if (blocked) return blocked;
  try {
    const body = await req.json();
    const parsed = bodySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }

    // Per-wallet + per-IP rate limit. A single wallet can join at most 20
    // campaigns per hour — way more than legitimate usage but tight enough
    // to thwart enumeration scripts.
    const rl = rateLimitBoth(
      req,
      'participate',
      parsed.data.creatorWallet,
      LIMITS.PARTICIPATE,
    );
    if (!rl.allowed) {
      return NextResponse.json(
        { error: 'too many joins this hour', resetAt: rl.resetAt },
        { status: 429 },
      );
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

      // Referral stamp — record on the creator's profile so future
      // settlements can pay out the referrer bonus. Only fires on first
      // participation. The referrer cannot be the same wallet.
      if (
        parsed.data.referredBy &&
        parsed.data.referredBy !== parsed.data.creatorWallet
      ) {
        try {
          const [creatorProfile] = await db
            .select()
            .from(schema.profiles)
            .where(
              and(
                eq(schema.profiles.wallet, parsed.data.creatorWallet),
                eq(schema.profiles.role, 'creator'),
              ),
            )
            .limit(1);

          if (!creatorProfile) {
            await db.insert(schema.profiles).values({
              wallet: parsed.data.creatorWallet,
              role: 'creator',
              referredBy: parsed.data.referredBy,
              referredAt: new Date(),
            });
          } else if (!(creatorProfile as any).referredBy) {
            await db
              .update(schema.profiles)
              .set({
                referredBy: parsed.data.referredBy,
                referredAt: new Date(),
                updatedAt: new Date(),
              })
              .where(eq(schema.profiles.id, creatorProfile.id));
          }

          // Notify the referrer that a friend joined.
          await db.insert(schema.notifications).values({
            wallet: parsed.data.referredBy,
            kind: 'referral_joined',
            title: 'A creator joined via your referral',
            body: `${parsed.data.creatorWallet.slice(0, 6)}… joined "${campaign.title}" through your link. You'll earn a 1% bonus on their first 3 settled payouts.`,
            payload: {
              campaignId: campaign.id,
              referredCreator: parsed.data.creatorWallet,
            },
          });
        } catch (refErr) {
          // Don't fail the join if referral stamping breaks — it's a
          // best-effort attribution. Log and continue.
          console.error('[participate] referral stamp failed', refErr);
        }
      }
    }

    return NextResponse.json({ participation });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message ?? 'internal error' }, { status: 500 });
  }
}
