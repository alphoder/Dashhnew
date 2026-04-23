import { cookies } from 'next/headers';
import { readSessionToken, createSessionToken, type SiwsPayload } from './siws';

export const SESSION_COOKIE = 'dashh_session';

export async function getSession(): Promise<SiwsPayload | null> {
  const token = cookies().get(SESSION_COOKIE)?.value;
  return readSessionToken(token);
}

export async function requireSession(): Promise<SiwsPayload> {
  const session = await getSession();
  if (!session) {
    throw new Error('UNAUTHENTICATED');
  }
  return session;
}

export async function setSessionCookie(wallet: string, role: 'brand' | 'creator') {
  const token = await createSessionToken(wallet, role);
  cookies().set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 7,
  });
}

export async function clearSessionCookie() {
  cookies().delete(SESSION_COOKIE);
}
