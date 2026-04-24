// Solana Actions / Blinks endpoint.
//
// Dial.to (and wallet Blink embeds) call this route twice:
//   GET  → returns ActionGetResponse metadata (icon/title/description/CTA)
//   POST → returns a partially-signed Solana transaction to sign & submit
//
// Historically this only knew about the v1 `creators` table. Campaigns
// created through the new form flow land in `campaigns_v2`, so every new
// Blink link used to fall through to the "Donate to Solana" default card.
// The GET now prefers v2 and falls back to v1, so both old and new IDs work.

import { db } from "@/lib/db";
import { creators, users } from "@/lib/db/schema";
import { campaignsV2, participations } from "@/lib/db/schema-v2";
import {
  ActionGetResponse,
  ActionPostRequest,
  ActionPostResponse,
  ACTIONS_CORS_HEADERS,
} from "@solana/actions";
import {
  clusterApiUrl,
  Connection,
  LAMPORTS_PER_SOL,
  PublicKey,
  SystemProgram,
  Transaction,
} from "@solana/web3.js";
import { eq, sql, and } from "drizzle-orm";

const RECIPIENT_ADDRESS =
  process.env.SOLANA_RECIPIENT_ADDRESS ||
  "8vbaCLhg1SZmiGNZfFzV2DEJHenFtdgg7G2JtY5v74i1";

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const DEFAULT_METADATA = {
  icon: "https://cdn.vectorstock.com/i/500p/04/45/solana-logo-coin-icon-isolated-vector-43670445.jpg",
  title: "DASHH Campaign",
  description:
    "This campaign could not be found. It may have ended or the link may be incorrect.",
  label: "View DASHH",
};

type NormalizedCampaign = {
  source: "v2" | "v1" | "default";
  icon: string;
  title: string;
  description: string;
  label: string;
};

async function loadCampaign(id: string): Promise<NormalizedCampaign> {
  if (!UUID_REGEX.test(id)) return { source: "default", ...DEFAULT_METADATA };

  // Prefer v2 — the new table the form now writes to.
  try {
    const [v2] = await db
      .select()
      .from(campaignsV2)
      .where(eq(campaignsV2.id, id))
      .limit(1);
    if (v2) {
      return {
        source: "v2",
        icon: v2.iconUrl,
        title: v2.title,
        description: v2.description,
        label: v2.ctaLabel || "Participate",
      };
    }
  } catch (err) {
    console.error("[donate] v2 lookup failed", err);
  }

  // Back-compat: v1 creators-table rows.
  try {
    const [v1] = await db
      .select()
      .from(creators)
      .where(eq(creators.id, id))
      .limit(1);
    if (v1) {
      return {
        source: "v1",
        icon: v1.icons,
        title: v1.title,
        description: v1.description,
        label: v1.label ?? "Participate",
      };
    }
  } catch (err) {
    console.error("[donate] v1 lookup failed", err);
  }

  return { source: "default", ...DEFAULT_METADATA };
}

export async function GET(
  request: Request,
  { params }: { params: { id: string } },
) {
  const url = new URL(request.url);
  const id = params.id;
  const campaign = await loadCampaign(id);

  const payload: ActionGetResponse = {
    icon: campaign.icon,
    title: campaign.title,
    description: campaign.description,
    label: campaign.label,
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
          label: campaign.label,
          href: `${url.href}?amount=0`,
        },
      ],
    },
  };

  return Response.json(payload, { headers: ACTIONS_CORS_HEADERS });
}

export const OPTIONS = GET;

export async function POST(
  request: Request,
  { params }: { params: { id: string } },
) {
  const body: ActionPostRequest = await request.json();
  const url = new URL(request.url);
  const amount = Math.max(0, Number(url.searchParams.get("amount")) || 0);
  const id = params.id;

  let sender: PublicKey;
  try {
    sender = new PublicKey(body.account);
  } catch (e) {
    return Response.json(
      { error: e instanceof Error ? e.message : "Invalid account" },
      { status: 400, headers: ACTIONS_CORS_HEADERS },
    );
  }

  const rpc = process.env.NEXT_PUBLIC_SOLANA_RPC || clusterApiUrl("devnet");
  const connection = new Connection(rpc, "confirmed");

  const transaction = new Transaction().add(
    SystemProgram.transfer({
      fromPubkey: sender,
      toPubkey: new PublicKey(RECIPIENT_ADDRESS),
      lamports: Math.round(amount * LAMPORTS_PER_SOL),
    }),
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
    message: "Participation recorded \u2014 complete the transaction in your wallet.",
  };

  // Persist participation — try v2 first, fall back to v1 for legacy rows.
  const campaign = await loadCampaign(id);
  try {
    if (campaign.source === "v2") {
      // Idempotent insert so repeated Blink clicks don't spam the table.
      const existing = await db
        .select({ id: participations.id })
        .from(participations)
        .where(
          and(
            eq(participations.campaignId, id),
            eq(participations.creatorWallet, sender.toString()),
          ),
        )
        .limit(1);
      if (existing.length === 0) {
        await db.insert(participations).values({
          campaignId: id,
          creatorWallet: sender.toString(),
          settlementStatus: "awaiting_join",
        });
      }
    } else if (campaign.source === "v1") {
      await db
        .update(creators)
        .set({
          users: sql`array_append(${creators.users}, ${sender.toString()})`,
        })
        .where(eq(creators.id, id));

      await db.insert(users).values({
        solAdd: sender.toString(),
        post: url.href.toString(),
        isAwarded: false,
      });
    }
    // 'default' source (unknown campaign) — still return the transaction so
    // the wallet flow completes, but don't write to either table.

    return Response.json(payload, { headers: ACTIONS_CORS_HEADERS });
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 400, headers: ACTIONS_CORS_HEADERS },
    );
  }
}
