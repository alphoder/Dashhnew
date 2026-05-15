// Referral self-view.
//
// Returns:
//   - referredCount      — how many wallets joined via this wallet's link
//   - bonusesEarned      — total SOL earned from referral payouts
//   - referredCreators[] — list of referred wallets + bonuses-paid count
//
// Read-only; identifies the wallet via SIWS session OR ?wallet= param.

import { NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';
import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import * as schema from '@/lib/db/schemas';
import { getSession } from '@/lib/auth/session';

export const dynamic = 'force-dynamic';

function getDb() {
  return drizzle(neon(process.env.DATABASE_URL!), { schema });
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

    // Everyone whose `referredBy` is this wallet
    const referredProfiles = await db
      .select()
      .from(schema.profiles)
      .where(eq(schema.profiles.referredBy, wallet));

    const bonusesEarned = referredProfiles.reduce(
      (sum, p) => sum + ((p as any).referralBonusesEarned ?? 0),
      0,
    );
    const totalBonusesPaid = referredProfiles.reduce(
      (sum, p) => sum + ((p as any).referralBonusesPaid ?? 0),
      0,
    );

    return NextResponse.json({
      wallet,
      referredCount: referredProfiles.length,
      bonusesEarned,
      totalBonusesPaid,
      referredCreators: referredProfiles.map((p) => ({
        wallet: p.wallet,
        referredAt: (p as any).referredAt ?? p.createdAt,
        bonusesPaid: (p as any).referralBonusesPaid ?? 0,
        bonusesEarnedFromThis:
          (p as any).referralBonusesEarned ?? 0,
      })),
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message ?? 'internal error' },
      { status: 500 },
    );
  }
}
