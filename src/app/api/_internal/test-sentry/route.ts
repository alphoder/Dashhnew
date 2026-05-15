// Internal: synthetic-error endpoint to verify Sentry is capturing.
//
// Hit /api/_internal/test-sentry?secret=<CRON_SECRET> on the live deploy.
// The server throws on purpose; if Sentry is configured correctly, the
// exception lands in your Sentry dashboard within ~30 seconds.

import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  const url = new URL(req.url);
  const secret = url.searchParams.get('secret');
  if (!secret || secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }
  // Intentional throw — Sentry should pick this up
  throw new Error(
    'DASHH test-sentry endpoint hit. If you see this in Sentry, the wiring works.',
  );
}
