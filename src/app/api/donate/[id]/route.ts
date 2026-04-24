import { db } from "@/lib/db";
import { creators, users } from "@/lib/db/schema";
import { ActionGetResponse, ActionPostRequest, ActionPostResponse, ACTIONS_CORS_HEADERS } from "@solana/actions";
import { clusterApiUrl, Connection, LAMPORTS_PER_SOL, PublicKey, SystemProgram, Transaction } from "@solana/web3.js";
import { eq, sql } from "drizzle-orm";

const RECIPIENT_ADDRESS = process.env.SOLANA_RECIPIENT_ADDRESS || "8vbaCLhg1SZmiGNZfFzV2DEJHenFtdgg7G2JtY5v74i1";

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const DEFAULT_CREATOR = {
  icons: "https://cdn.vectorstock.com/i/500p/04/45/solana-logo-coin-icon-isolated-vector-43670445.jpg",
  title: "Donate to Solana",
  description: "Donate to the Solana Foundation to support the Solana ecosystem.",
  label: "Donate",
};

export async function GET(request: Request, { params }: { params: { id: string } }) {
  const url = new URL(request.url);
  const id = params.id;

  let creator;

  if (!UUID_REGEX.test(id)) {
    creator = DEFAULT_CREATOR;
  } else {
    try {
      const [result] = await db.select().from(creators).where(eq(creators.id, id));
      creator = result || DEFAULT_CREATOR;
    } catch (e) {
      return Response.json(
        { error: e instanceof Error ? e.message : "Unknown error" },
        { status: 400, headers: ACTIONS_CORS_HEADERS }
      );
    }
  }

  const payload: ActionGetResponse = {
    icon: creator.icons,
    title: creator.title,
    description: creator.description,
    label: creator.label,
    links: {
      actions: [
        {
          type: "external-link",
          label: "See Leaderboard",
          href: `${url.origin}/api/redirect/${id}`,
        },
        {
          type: "external-link",
          label: "Verify With Reclaim",
          href: `${url.origin}/api/reclaim/${id}`,
        },
        {
          type: "transaction",
          label: "Participate",
          href: `${url.href}?amount=0`,
        },
      ],
    },
  };

  return Response.json(payload, {
    headers: ACTIONS_CORS_HEADERS,
  });
}

export const OPTIONS = GET;

export async function POST(request: Request, { params }: { params: { id: string } }) {
  const body: ActionPostRequest = await request.json();
  const url = new URL(request.url);
  const amount = Math.max(0, Number(url.searchParams.get("amount")) || 0);
  const id = params.id;

  let sender;

  try {
    sender = new PublicKey(body.account);
  } catch (e) {
    return Response.json(
      { error: e instanceof Error ? e.message : "Invalid account" },
      { status: 400, headers: ACTIONS_CORS_HEADERS }
    );
  }

  const rpc = process.env.NEXT_PUBLIC_SOLANA_RPC || clusterApiUrl("devnet");
  const connection = new Connection(rpc, "confirmed");

  const transaction = new Transaction().add(
    SystemProgram.transfer({
      fromPubkey: sender,
      toPubkey: new PublicKey(RECIPIENT_ADDRESS),
      lamports: amount * LAMPORTS_PER_SOL,
    })
  );

  // 'finalized' gives the widest validity window; Blinks often spend
  // 30–60s in the wallet-UI handoff before submission.
  const blockheight = await connection.getLatestBlockhash("finalized");
  transaction.recentBlockhash = blockheight.blockhash;
  transaction.lastValidBlockHeight = blockheight.lastValidBlockHeight;
  transaction.feePayer = sender;

  const payload: ActionPostResponse = {
    type: "transaction",
    transaction: transaction.serialize({ verifySignatures: false }).toString("base64"),
    message: "Participation done successfully",
  };

  try {
    await db.update(creators)
      .set({
        users: sql`array_append(${creators.users}, ${sender.toString()})`,
      })
      .where(eq(creators.id, id));

    await db.insert(users).values({
      solAdd: sender.toString(),
      post: url.href.toString(),
      isAwarded: false,
    });

    return Response.json(payload, {
      headers: ACTIONS_CORS_HEADERS,
    });
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 400, headers: ACTIONS_CORS_HEADERS }
    );
  }
}
