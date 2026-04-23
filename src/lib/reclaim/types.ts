export type Platform = 'instagram' | 'youtube' | 'twitter' | 'tiktok';

export interface VerifiedEngagement {
  platform: Platform;
  /** The handle that's authenticated in the proof (session user). */
  handle: string;
  /** The handle that OWNS the submitted post. Used for ownership cross-check. */
  ownerHandle?: string;
  postUrl: string;
  views: number;
  /** Seconds since epoch when the post was created — used for post-age check. */
  postCreatedAt?: number;
  /** Optional engagement signals for bot-ratio heuristics. */
  likes?: number;
  comments?: number;
  /** Post caption / description / tweet text — used for content-match checks. */
  caption?: string;
  rawProof: unknown;
  verifiedAt: Date;
}

export interface ReclaimAdapter {
  platform: Platform;
  /** Provider ID configured on dev.reclaimprotocol.org */
  providerId: string;
  /** Build the verification request URL/config for the client SDK */
  buildRequestConfig(params: { userId: string; callbackUrl: string }): {
    providerId: string;
    callbackUrl: string;
    context: Record<string, unknown>;
  };
  /** Parse a verified Reclaim proof into normalized engagement data */
  parseProof(rawProof: unknown): VerifiedEngagement | null;
}
