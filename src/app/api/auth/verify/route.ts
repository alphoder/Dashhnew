import { NextResponse } from 'next/server';
import { verifySignature, buildSiwsMessage } from '@/lib/auth/siws';
import { setSessionCookie } from '@/lib/auth/session';
import { verifySiwsSchema } from '@/lib/validation/auth';
import { clientKey, rateLimit } from '@/lib/ratelimit';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  const { allowed } = rateLimit(clientKey(req, 'verify'), { limit: 10, windowMs: 60_000 });
  if (!allowed) return new NextResponse('Too Many Requests', { status: 429 });

  const body = await req.json().catch(() => null);
  const parsed = verifySiwsSchema.safeParse({
    ...body,
    nonce: body?.nonce ?? '',
  });
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { address, signature, nonce, role } = parsed.data;
  const issuedAt = body?.issuedAt ?? new Date().toISOString();
  const host = req.headers.get('host') || 'localhost:3000';
  const message = buildSiwsMessage({ domain: host, address, nonce, issuedAt });

  if (!verifySignature(message, signature, address)) {
    return NextResponse.json({ error: 'invalid signature' }, { status: 401 });
  }

  await setSessionCookie(address, role);
  return NextResponse.json({ ok: true, wallet: address, role });
}
