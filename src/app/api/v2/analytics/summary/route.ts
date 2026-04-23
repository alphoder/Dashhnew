import { NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';
import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import * as schema from '@/lib/db/schemas';

export const dynamic = 'force-dynamic';

function getDb() {
  return drizzle(neon(process.env.DATABASE_URL!), { schema });
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const wallet = searchParams.get('wallet');

    const db = getDb();
    const [allCampaigns, allProofs, allPayouts] = await Promise.all([
      db.select().from(schema.campaignsV2),
      db.select().from(schema.proofs),
      db.select().from(schema.payouts),
    ]);

    const campaigns = wallet
      ? allCampaigns.filter((c) => c.brandWallet === wallet)
      : allCampaigns;
    const campaignIds = new Set(campaigns.map((c) => c.id));

    // Aggregate per-campaign views from proofs (via participations lookup is expensive; approximate by total)
    const verifiedProofs = allProofs.filter((p) => p.status === 'verified');
    const totalViews = verifiedProofs.reduce((sum, p) => sum + (p.verifiedViews || 0), 0);
    const totalPayouts = allPayouts.reduce((sum, p) => sum + (p.amount || 0), 0);
    const totalBudget = campaigns.reduce((sum, c) => sum + (c.budget || 0), 0);

    // Daily buckets (last 14 days) of proofs verifiedAt
    const days = 14;
    const now = new Date();
    const buckets: { label: string; value: number }[] = [];
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(now.getDate() - i);
      const key = d.toISOString().slice(5, 10); // MM-DD
      const count = verifiedProofs.filter((p) => {
        const pd = p.verifiedAt ? new Date(p.verifiedAt) : null;
        return pd && pd.toISOString().slice(5, 10) === key;
      }).length;
      buckets.push({ label: key, value: count });
    }

    const byPlatform = ['instagram', 'youtube', 'twitter', 'tiktok'].map((p) => ({
      label: p,
      value: campaigns.filter((c) => c.platform === p).length,
    }));

    return NextResponse.json({
      totals: {
        campaigns: campaigns.length,
        activeCampaigns: campaigns.filter((c) => c.status === 'active').length,
        verifiedViews: totalViews,
        payouts: totalPayouts,
        budget: totalBudget,
      },
      verifiedPerDay: buckets,
      campaignsByPlatform: byPlatform,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message ?? 'internal error' }, { status: 500 });
  }
}
