import { NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';
import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import * as schema from '@/lib/db/schemas';

export const dynamic = 'force-dynamic';

function getDb() {
  return drizzle(neon(process.env.DATABASE_URL!), { schema });
}

export async function POST(_req: Request, { params }: { params: { id: string } }) {
  try {
    const db = getDb();
    const [row] = await db
      .update(schema.notifications)
      .set({ readAt: new Date() })
      .where(eq(schema.notifications.id, params.id))
      .returning();
    return NextResponse.json({ notification: row });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message ?? 'internal error' }, { status: 500 });
  }
}
