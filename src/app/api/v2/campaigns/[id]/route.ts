import { NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';
import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import * as schema from '@/lib/db/schemas';

export const dynamic = 'force-dynamic';

function getDb() {
  return drizzle(neon(process.env.DATABASE_URL!), { schema });
}

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  try {
    const db = getDb();
    const [row] = await db
      .select()
      .from(schema.campaignsV2)
      .where(eq(schema.campaignsV2.id, params.id))
      .limit(1);
    if (!row) return NextResponse.json({ error: 'not found' }, { status: 404 });
    return NextResponse.json({ campaign: row });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message ?? 'internal error' }, { status: 500 });
  }
}

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  try {
    const body = await req.json();
    const db = getDb();
    const [row] = await db
      .update(schema.campaignsV2)
      .set({ ...body, updatedAt: new Date() })
      .where(eq(schema.campaignsV2.id, params.id))
      .returning();
    return NextResponse.json({ campaign: row });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message ?? 'internal error' }, { status: 500 });
  }
}
