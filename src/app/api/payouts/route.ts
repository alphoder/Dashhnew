import { NextResponse } from "next/server";
import { desc, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { payouts, proofs, participations } from "@/lib/db/schema-v2";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const wallet = searchParams.get("wallet");

  const rows = await db
    .select({
      id: payouts.id,
      amount: payouts.amount,
      status: payouts.status,
      txSig: payouts.txSig,
      paidAt: payouts.paidAt,
      createdAt: payouts.createdAt,
      creatorWallet: participations.creatorWallet,
    })
    .from(payouts)
    .leftJoin(proofs, eq(payouts.proofId, proofs.id))
    .leftJoin(participations, eq(proofs.participationId, participations.id))
    .orderBy(desc(payouts.createdAt))
    .limit(100);

  const filtered = wallet
    ? rows.filter((r) => r.creatorWallet === wallet)
    : rows;

  return NextResponse.json({ items: filtered });
}

export async function PATCH(req: Request) {
  const body = await req.json().catch(() => ({}));
  const { id, txSig, status } = body as {
    id: string;
    txSig?: string;
    status?: "pending" | "paid" | "failed";
  };
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

  const [row] = await db
    .update(payouts)
    .set({
      txSig: txSig ?? null,
      status: status ?? "paid",
      paidAt: status === "paid" || !status ? new Date() : null,
    })
    .where(eq(payouts.id, id))
    .returning();

  return NextResponse.json({ payout: row });
}
