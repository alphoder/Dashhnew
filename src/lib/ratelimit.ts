// Lightweight in-memory rate limit. Good enough for dev and single-instance deploys.
// Swap for Upstash Redis in production by setting UPSTASH_REDIS_REST_URL.

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
  const ip = fwd.split(',')[0]?.trim() || req.headers.get('x-real-ip') || 'unknown';
  return `${prefix}:${ip}`;
}
