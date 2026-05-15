// Lightweight in-memory rate limit. Good enough for dev and the current
// single-region Vercel deploy. Swap for Upstash Redis in production by
// setting UPSTASH_REDIS_REST_URL (TODO — not done yet).
//
// Each entry stores a token-bucket: how many tokens remain, and when the
// bucket resets. When tokens hit zero, we return {allowed:false} until
// resetAt passes.
//
// Two key-builders are exposed:
//   clientKey(req, prefix)         → keys by client IP, good for unauth flows
//   walletKey(prefix, wallet)      → keys by wallet pubkey, prevents one
//                                    wallet from creating 100 campaigns/hour
//                                    even across multiple IPs.

type Bucket = { tokens: number; resetAt: number };
const buckets = new Map<string, Bucket>();

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: number;
}

export function rateLimit(
  key: string,
  { limit = 20, windowMs = 60_000 }: { limit?: number; windowMs?: number } = {},
): RateLimitResult {
  const now = Date.now();
  const bucket = buckets.get(key);

  if (!bucket || bucket.resetAt < now) {
    buckets.set(key, { tokens: limit - 1, resetAt: now + windowMs });
    return { allowed: true, remaining: limit - 1, resetAt: now + windowMs };
  }

  if (bucket.tokens <= 0) {
    return { allowed: false, remaining: 0, resetAt: bucket.resetAt };
  }

  bucket.tokens -= 1;
  return { allowed: true, remaining: bucket.tokens, resetAt: bucket.resetAt };
}

export function clientKey(req: Request, prefix = ''): string {
  const fwd = req.headers.get('x-forwarded-for') ?? '';
  const ip =
    fwd.split(',')[0]?.trim() ||
    req.headers.get('x-real-ip') ||
    'unknown';
  return `${prefix}:${ip}`;
}

export function walletKey(prefix: string, wallet: string): string {
  return `${prefix}:w:${wallet}`;
}

/**
 * Named limit presets — keep critical surface limits in one place so we
 * can audit them at a glance and adjust without grepping the codebase.
 *
 * Conservative defaults: 5–30 per hour for write paths. Reads stay at the
 * generic `rateLimit` default (20 / minute).
 */
export const LIMITS = {
  CAMPAIGN_CREATE: { limit: 5, windowMs: 60 * 60_000 }, // 5/hour per wallet
  PARTICIPATE: { limit: 20, windowMs: 60 * 60_000 }, // 20/hour per wallet
  PROOF_SUBMIT: { limit: 10, windowMs: 60 * 60_000 }, // 10/hour per wallet
  CANCEL_REFUND: { limit: 5, windowMs: 60_000 }, // 5/min per wallet
  AUTH_NONCE: { limit: 30, windowMs: 60_000 }, // 30/min per IP
} as const;

/**
 * Compose a wallet rate-limit check that ALSO falls back to IP if no
 * wallet is yet associated with the request. Both keys must allow.
 */
export function rateLimitBoth(
  req: Request,
  prefix: string,
  wallet: string | null | undefined,
  { limit, windowMs }: { limit: number; windowMs: number },
): RateLimitResult {
  const ipResult = rateLimit(clientKey(req, prefix), { limit, windowMs });
  if (!ipResult.allowed) return ipResult;
  if (!wallet) return ipResult;
  return rateLimit(walletKey(prefix, wallet), { limit, windowMs });
}
