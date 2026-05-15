// Cloudflare Turnstile verification.
//
// Turnstile is a free, privacy-friendly CAPTCHA alternative. The client
// renders the widget with NEXT_PUBLIC_TURNSTILE_SITE_KEY and posts the
// resulting token along with the form submission. This server-side helper
// verifies the token against Cloudflare's API.
//
// Configuration:
//   NEXT_PUBLIC_TURNSTILE_SITE_KEY  — public site key (safe to ship)
//   TURNSTILE_SECRET                — server secret (never expose)
//
// If TURNSTILE_SECRET is NOT set, verification is bypassed (returns true).
// This keeps local dev + previews working without forcing every developer
// to provision a Turnstile site. Production deploys MUST set the secret.

const TURNSTILE_VERIFY_URL =
  'https://challenges.cloudflare.com/turnstile/v0/siteverify';

export interface CaptchaResult {
  ok: boolean;
  bypass?: boolean;
  reason?: string;
}

export async function verifyTurnstile(
  token: string | null | undefined,
  options: { remoteIp?: string } = {},
): Promise<CaptchaResult> {
  const secret = process.env.TURNSTILE_SECRET;
  if (!secret) {
    return { ok: true, bypass: true, reason: 'no-turnstile-secret-configured' };
  }
  if (!token) {
    return { ok: false, reason: 'missing-token' };
  }
  try {
    const body = new URLSearchParams();
    body.set('secret', secret);
    body.set('response', token);
    if (options.remoteIp) body.set('remoteip', options.remoteIp);

    const res = await fetch(TURNSTILE_VERIFY_URL, {
      method: 'POST',
      body,
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      // Turnstile sometimes takes 1-2s under load.
      signal: AbortSignal.timeout(5000),
    });
    const data = await res.json().catch(() => null);
    if (data?.success === true) return { ok: true };
    return {
      ok: false,
      reason: Array.isArray(data?.['error-codes'])
        ? data['error-codes'].join(',')
        : 'verify-failed',
    };
  } catch (err: any) {
    return { ok: false, reason: err?.message ?? 'verify-threw' };
  }
}

/** Extract the client IP from a Next.js Request, matching ratelimit.ts. */
export function getClientIp(req: Request): string | undefined {
  const fwd = req.headers.get('x-forwarded-for') ?? '';
  const ip =
    fwd.split(',')[0]?.trim() ||
    req.headers.get('x-real-ip') ||
    undefined;
  return ip;
}
