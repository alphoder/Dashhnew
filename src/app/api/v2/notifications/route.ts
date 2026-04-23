import { NextResponse } from 'next/server';
import { eq, desc } from 'drizzle-orm';
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
    if (!wallet) return NextResponse.json({ notifications: [] });

    const db = getDb();
    const rows = await db
      .select()
      .from(schema.notifications)
      .where(eq(schema.notifications.wallet, wallet))
      .orderBy(desc(schema.notifications.createdAt))
      .limit(50);

    return NextResponse.json({ notifications: rows });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message ?? 'internal error', notifications: [] },
      { status: 500 },
    );
  }
}
