import { NextResponse } from "next/server";
import { and, desc, eq, isNull } from "drizzle-orm";
import { db } from "@/lib/db";
import { notifications } from "@/lib/db/schema-v2";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const wallet = searchParams.get("wallet");
  const unreadOnly = searchParams.get("unreadOnly") === "true";

  if (!wallet) return NextResponse.json({ items: [] });

  const filters = [eq(notifications.wallet, wallet)];
  if (unreadOnly) filters.push(isNull(notifications.readAt));

  const items = await db
    .select()
    .from(notifications)
    .where(and(...filters))
    .orderBy(desc(notifications.createdAt))
    .limit(50);

  return NextResponse.json({ items });
}

export async function PATCH(req: Request) {
  const body = await req.json().catch(() => ({}));
  const { id, wallet, markAllRead } = body as {
    id?: string;
    wallet?: string;
    markAllRead?: boolean;
  };

  if (markAllRead && wallet) {
    await db
      .update(notifications)
      .set({ readAt: new Date() })
      .where(and(eq(notifications.wallet, wallet), isNull(notifications.readAt)));
    return NextResponse.json({ ok: true });
  }

  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
  const [row] = await db
    .update(notifications)
    .set({ readAt: new Date() })
    .where(eq(notifications.id, id))
    .returning();
  return NextResponse.json({ notification: row });
}
