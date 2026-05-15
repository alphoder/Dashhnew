import { NextResponse } from 'next/server';
import { desc, eq } from 'drizzle-orm';
import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import * as schema from '@/lib/db/schemas';
import { createCampaignSchema } from '@/lib/validation/campaign';
import { LIMITS, rateLimitBoth } from '@/lib/ratelimit';
import { getSession } from '@/lib/auth/session';
import { getClientIp, verifyTurnstile } from '@/lib/captcha';
import { guardWrites } from '@/lib/kill-switch';

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
    const verifiedOnly = searchParams.get('verifiedOnly') === 'true';

    const db = getDb();
    let rows = await db
      .select()
      .from(schema.campaignsV2)
      .orderBy(desc(schema.campaignsV2.createdAt))
      .limit(100);

    if (platform) rows = rows.filter((r) => r.platform === platform);
    if (status) rows = rows.filter((r) => r.status === status);
    if (brandWallet) rows = rows.filter((r) => r.brandWallet === brandWallet);

    // Enrich with brand verification status — single batch lookup so we
    // don't N+1 the profiles table per campaign card.
    let verifiedByWallet = new Map<string, { level: string; at: Date | null }>();
    if (rows.length > 0) {
      try {
        const brandWallets = Array.from(new Set(rows.map((r) => r.brandWallet)));
        const profiles = await db
          .select()
          .from(schema.profiles)
          .where(eq(schema.profiles.role, 'brand'));
        for (const p of profiles) {
          if (!brandWallets.includes(p.wallet)) continue;
          if ((p as any).verified) {
            verifiedByWallet.set(p.wallet, {
              level: (p as any).verificationLevel ?? 'basic',
              at: (p as any).verifiedAt ?? null,
            });
          }
        }
      } catch {
        // Schema-migration races: if `verified` doesn't exist yet on the
        // live DB, we just don't show badges. Never break the list.
      }
    }

    const enriched = rows.map((r) => {
      const v = verifiedByWallet.get(r.brandWallet);
      return {
        ...r,
        brandVerified: !!v,
        brandVerificationLevel: v?.level ?? 'none',
      };
    });

    const final = verifiedOnly
      ? enriched.filter((r) => r.brandVerified)
      : enriched;

    return NextResponse.json({ campaigns: final });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message ?? 'internal error', campaigns: [] },
      { status: 500 },
    );
  }
}

export async function POST(req: Request) {
  const blocked = guardWrites();
  if (blocked) return blocked;
  try {
    // Session guard — prefer SIWS session, fall back to body-provided wallet
    // while the SIWS flow is still opt-in for older pages.
    const session = await getSession();
    const body = await req.json();
    const brandWallet: string | undefined = session?.wallet ?? body.brandWallet;
    if (!brandWallet) {
      return NextResponse.json({ error: 'unauthenticated' }, { status: 401 });
    }

    // Tighter rate-limit: per-wallet AND per-IP, both must allow.
    // This stops a single wallet from creating 1000s of campaigns even if
    // it rotates IPs, and stops a single bot from creating campaigns under
    // many wallets from one machine.
    const rl = rateLimitBoth(
      req,
      'campaigns:create',
      brandWallet,
      LIMITS.CAMPAIGN_CREATE,
    );
    if (!rl.allowed) {
      return NextResponse.json(
        {
          error:
            'too many campaigns this hour. Please wait before creating another.',
          resetAt: rl.resetAt,
        },
        { status: 429 },
      );
    }

    // Optional CAPTCHA — only enforced if TURNSTILE_SECRET is set.
    // Field name `captchaToken` matches Cloudflare's default React widget.
    const captcha = await verifyTurnstile(body?.captchaToken ?? null, {
      remoteIp: getClientIp(req),
    });
    if (!captcha.ok) {
      return NextResponse.json(
        { error: 'captcha verification failed', reason: captcha.reason },
        { status: 403 },
      );
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
        requiredHashtag: parsed.data.requiredHashtag || null,
        requiredMention: parsed.data.requiredMention || null,
        requiredPhrase: parsed.data.requiredPhrase || null,
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
