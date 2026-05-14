// Lightweight escrow helper for DASHH payouts.
//
// NOTE: this is a dev-friendly abstraction around a SystemProgram.transfer
// from a campaign's funded wallet to a creator. For mainnet, swap this out
// for a real Anchor escrow program (PDA-owned, with verifier signatures).

import {
  Connection,
  PublicKey,
  Transaction,
  SystemProgram,
  clusterApiUrl,
  LAMPORTS_PER_SOL,
  Cluster,
  Keypair,
  sendAndConfirmTransaction,
} from "@solana/web3.js";
import bs58 from "bs58";

const CLUSTER = (process.env.NEXT_PUBLIC_SOLANA_CLUSTER as Cluster) || "devnet";
const RPC = process.env.NEXT_PUBLIC_SOLANA_RPC || clusterApiUrl(CLUSTER);

export function getConnection() {
  return new Connection(RPC, "confirmed");
}

export async function buildPayoutTransaction({
  fromWallet,
  toWallet,
  amountSol,
}: {
  fromWallet: string;
  toWallet: string;
  amountSol: number;
}): Promise<Transaction> {
  const connection = getConnection();
  const from = new PublicKey(fromWallet);
  const to = new PublicKey(toWallet);

  const tx = new Transaction().add(
    SystemProgram.transfer({
      fromPubkey: from,
      toPubkey: to,
      lamports: Math.floor(amountSol * LAMPORTS_PER_SOL),
    }),
  );

  // 'finalized' commitment gives us the longest possible validity window
  // (~60s) between building, signing, and submitting the tx — important on
  // the public devnet RPC which is slow and rate-limited.
  const latest = await connection.getLatestBlockhash("finalized");
  tx.recentBlockhash = latest.blockhash;
  tx.feePayer = from;
  return tx;
}

export async function confirmSignature(signature: string): Promise<boolean> {
  try {
    const connection = getConnection();
    const result = await connection.confirmTransaction(signature, "confirmed");
    return !result.value.err;
  } catch {
    return false;
  }
}

/**
 * Decode the platform's signing key from env. Supports two formats so the
 * key can come from either `solana-keygen` (JSON array) or Phantom export
 * (base58 string).
 *
 * If no key is configured we return null — callers should treat this as a
 * dry-run signal rather than an error, because devnet/staging environments
 * often run settlement without a real signing wallet.
 */
export function getPlatformKeypair(): Keypair | null {
  const secret = process.env.PLATFORM_SIGNING_KEY?.trim();
  if (!secret) return null;
  try {
    if (secret.startsWith("[")) {
      const arr = JSON.parse(secret);
      return Keypair.fromSecretKey(Uint8Array.from(arr));
    }
    return Keypair.fromSecretKey(bs58.decode(secret));
  } catch (err) {
    console.error("[escrow] failed to decode PLATFORM_SIGNING_KEY:", err);
    return null;
  }
}

/**
 * Send a SOL payout from the platform signing wallet to a creator wallet.
 *
 * Used by `/api/v2/settle` to move money on-chain after the settlement
 * runner has decided how much each creator earned. Until the audited
 * Anchor escrow program is live (see P2.1 in the production roadmap),
 * payouts come straight from the platform's hot wallet.
 *
 * Returns a discriminated union so the settle runner can distinguish:
 *   - `{ kind: 'paid', signature }`     → on-chain success, record the sig
 *   - `{ kind: 'dry_run' }`             → no signing key configured (devnet)
 *   - `{ kind: 'failed', error }`       → RPC error, will retry next cron
 */
export type PayoutResult =
  | { kind: "paid"; signature: string }
  | { kind: "dry_run"; reason: string }
  | { kind: "failed"; error: string };

export async function executePayout(opts: {
  toWallet: string;
  amountSol: number;
}): Promise<PayoutResult> {
  if (opts.amountSol <= 0) {
    return { kind: "dry_run", reason: "amount<=0, skipping on-chain transfer" };
  }

  const keypair = getPlatformKeypair();
  if (!keypair) {
    return {
      kind: "dry_run",
      reason: "PLATFORM_SIGNING_KEY not configured — bookkeeping only",
    };
  }

  try {
    const connection = getConnection();
    const tx = new Transaction().add(
      SystemProgram.transfer({
        fromPubkey: keypair.publicKey,
        toPubkey: new PublicKey(opts.toWallet),
        lamports: Math.floor(opts.amountSol * LAMPORTS_PER_SOL),
      }),
    );
    const latest = await connection.getLatestBlockhash("finalized");
    tx.recentBlockhash = latest.blockhash;
    tx.feePayer = keypair.publicKey;

    const signature = await sendAndConfirmTransaction(
      connection,
      tx,
      [keypair],
      { commitment: "confirmed", maxRetries: 3 },
    );
    return { kind: "paid", signature };
  } catch (err: any) {
    console.error("[escrow] executePayout failed", err);
    return {
      kind: "failed",
      error: err?.message ?? String(err),
    };
  }
}
