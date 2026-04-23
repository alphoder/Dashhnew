// Thin wrapper around Irys/Arweave uploads. Used to anchor Reclaim proofs
// permanently so a creator can always point back to the original proof.
//
// This is a no-op in dev unless IRYS_PRIVATE_KEY is set, so local demo still
// works. In production, ensure the env var is configured.

export interface AnchorResult {
  txId: string | null;
  skipped?: 'no-key';
}

/**
 * Upload a JSON proof blob to Arweave via Irys.
 * Returns the Arweave tx id, or `null` if skipped.
 */
export async function anchorProofToArweave(
  proof: unknown,
  tags: Record<string, string> = {},
): Promise<AnchorResult> {
  const pk = process.env.IRYS_PRIVATE_KEY;
  if (!pk) return { txId: null, skipped: 'no-key' };

  try {
    // Lazy import so the Irys SDK doesn't hit client bundles.
    const { Uploader } = await import('@irys/upload');
    const { Solana } = await import('@irys/upload-solana');
    const irysUploader = await Uploader(Solana).withWallet(pk);

    const body = typeof proof === 'string' ? proof : JSON.stringify(proof);
    const receipt = await irysUploader.upload(body, {
      tags: [
        { name: 'Content-Type', value: 'application/json' },
        { name: 'App-Name', value: 'DASHH-2.0' },
        ...Object.entries(tags).map(([name, value]) => ({ name, value })),
      ],
    });
    return { txId: receipt.id };
  } catch (err) {
    console.error('[arweave] anchor failed:', err);
    return { txId: null };
  }
}
