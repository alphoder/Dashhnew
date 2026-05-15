// Operational kill-switch.
//
// Set the env var DASHH_KILL_SWITCH=true on Vercel to immediately return
// 503 from every write endpoint without redeploying code. Useful when
// something is on fire (rogue cron, leaked key, RPC outage burning budget)
// and you need to stop new writes RIGHT NOW.
//
// Reads stay live — users can still browse, see balances, view payouts.
// Only writes (POST/PATCH/DELETE) are blocked. The kill switch is a flag,
// not a feature flag — there's no per-user override.

import { NextResponse } from 'next/server';

/**
 * True if writes should be blocked. Reads should NEVER call this.
 */
export function isKillSwitchActive(): boolean {
  // Accept any truthy value the operator might paste: 'true', '1', 'yes'.
  const flag = process.env.DASHH_KILL_SWITCH?.toLowerCase().trim();
  return flag === 'true' || flag === '1' || flag === 'yes';
}

/**
 * Standardised 503 response when the kill switch is active. Wallets see a
 * clear message + the contact channel for outage updates.
 */
export function killSwitchResponse(): NextResponse {
  return NextResponse.json(
    {
      error: 'DASHH is temporarily paused for maintenance',
      detail:
        'Reads are still working but writes are disabled. Follow updates at https://github.com/alphoder/Dashhnew.',
      code: 'KILL_SWITCH_ACTIVE',
    },
    {
      status: 503,
      headers: { 'Retry-After': '300' },
    },
  );
}

/**
 * Drop-in guard for API route handlers. Returns null if writes are allowed,
 * or a 503 NextResponse if the kill switch is set. Usage:
 *
 *   const blocked = guardWrites();
 *   if (blocked) return blocked;
 *
 * Place at the top of every POST/PATCH/DELETE handler before any DB work.
 */
export function guardWrites(): NextResponse | null {
  if (isKillSwitchActive()) return killSwitchResponse();
  return null;
}
