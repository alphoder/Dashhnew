// Sign-In With Solana (SIWS) — verifies that the user owns the wallet by
// asking them to sign a challenge message with their private key. No password, no email.
//
// Flow:
//   1. Client calls GET /api/auth/nonce -> receives { nonce, message }
//   2. User signs `message` with their Phantom wallet
//   3. Client POSTs { address, signature } to /api/auth/verify
//   4. Server verifies the signature against the nonce, issues a session cookie (JWT)

import { PublicKey } from '@solana/web3.js';
import nacl from 'tweetnacl';
import bs58 from 'bs58';

const SESSION_SECRET = process.env.SIWS_SESSION_SECRET || '';

if (typeof window === 'undefined' && SESSION_SECRET && SESSION_SECRET.length < 32) {
  console.warn('SIWS_SESSION_SECRET is shorter than 32 chars. Please use a stronger secret.');
}

export interface SiwsPayload {
  wallet: string;
  role: 'brand' | 'creator';
  iat: number;
  exp: number;
}

export function buildSiwsMessage({
  domain,
  address,
  nonce,
  issuedAt,
}: {
  domain: string;
  address: string;
  nonce: string;
  issuedAt: string;
}): string {
  return [
    `${domain} wants you to sign in with your Solana account:`,
    address,
    ``,
    `Welcome to DASHH. Sign this message to authenticate. No transaction fee.`,
    ``,
    `URI: https://${domain}`,
    `Version: 1`,
    `Nonce: ${nonce}`,
    `Issued At: ${issuedAt}`,
  ].join('\n');
}

export function verifySignature(
  message: string,
  signatureB58: string,
  address: string,
): boolean {
  try {
    const publicKeyBytes = new PublicKey(address).toBytes();
    const signatureBytes = bs58.decode(signatureB58);
    const messageBytes = new TextEncoder().encode(message);
    return nacl.sign.detached.verify(messageBytes, signatureBytes, publicKeyBytes);
  } catch {
    return false;
  }
}

export function randomNonce(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID().replace(/-/g, '');
  }
  // Fallback for older Node
  return Array.from({ length: 4 }, () => Math.random().toString(36).slice(2)).join('');
}

// ─────────── Lightweight HMAC-signed token (no jose dependency) ───────────

function base64url(input: string | Uint8Array): string {
  const buf = typeof input === 'string' ? Buffer.from(input) : Buffer.from(input);
  return buf.toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function base64urlDecode(input: string): Buffer {
  const pad = input.length % 4 === 0 ? '' : '='.repeat(4 - (input.length % 4));
  return Buffer.from(input.replace(/-/g, '+').replace(/_/g, '/') + pad, 'base64');
}

async function hmac(key: string, data: string): Promise<string> {
  const { createHmac } = await import('crypto');
  return base64url(createHmac('sha256', key).update(data).digest());
}

export async function createSessionToken(
  wallet: string,
  role: 'brand' | 'creator',
  ttlSeconds = 60 * 60 * 24 * 7,
): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  const payload: SiwsPayload = { wallet, role, iat: now, exp: now + ttlSeconds };
  const header = base64url(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const body = base64url(JSON.stringify(payload));
  const sig = await hmac(SESSION_SECRET, `${header}.${body}`);
  return `${header}.${body}.${sig}`;
}

export async function readSessionToken(token: string | undefined): Promise<SiwsPayload | null> {
  if (!token) return null;
  const parts = token.split('.');
  if (parts.length !== 3) return null;
  const [header, body, sig] = parts;
  const expected = await hmac(SESSION_SECRET, `${header}.${body}`);
  if (expected !== sig) return null;
  try {
    const payload = JSON.parse(base64urlDecode(body).toString('utf8')) as SiwsPayload;
    if (payload.exp < Math.floor(Date.now() / 1000)) return null;
    return payload;
  } catch {
    return null;
  }
}
