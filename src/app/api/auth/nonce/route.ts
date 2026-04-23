import { NextResponse } from 'next/server';
import { buildSiwsMessage, randomNonce } from '@/lib/auth/siws';
import { clientKey, rateLimit } from '@/lib/ratelimit';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  const { allowed } = rateLimit(clientKey(req, 'nonce'), { limit: 30, windowMs: 60_000 });
  if (!allowed) return new NextResponse('Too Many Requests', { status: 429 });

  const { searchParams } = new URL(req.url);
  const address = searchParams.get('address');
  if (!address) return NextResponse.json({ error: 'address required' }, { status: 400 });

  const nonce = randomNonce();
  const issuedAt = new Date().toISOString();
  const host = req.headers.get('host') || 'localhost:3000';
  const message = buildSiwsMessage({ domain: host, address, nonce, issuedAt });

  return NextResponse.json({ nonce, message, issuedAt });
}
