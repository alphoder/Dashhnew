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
} from "@solana/web3.js";

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

  const { blockhash } = await connection.getLatestBlockhash();
  tx.recentBlockhash = blockhash;
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
