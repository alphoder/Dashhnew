// Demo mode — "try DASHH without a wallet" flow.
//
// Activated via `?demo=1` (or `?demo=true`) anywhere in the app. The flag
// persists in sessionStorage so navigating between pages keeps the demo
// going. The user can exit at any time via the banner.
//
// What it does:
//   - Sets a stable, well-known "demo wallet" pubkey into localStorage so
//     pages that gate behind wallet-connect (creator dashboard, brand
//     refund/cancel buttons) light up immediately.
//   - Surfaces a global banner that the user is in demo mode + how to leave.
//   - Components that perform on-chain signing should branch on
//     `isDemoMode()` and short-circuit to a simulated success instead of
//     invoking Phantom. This file does NOT short-circuit Phantom on its
//     own — callers must opt in.

export const DEMO_FLAG_KEY = 'dashh_demo_mode';
export const DEMO_WALLET_KEY = 'dashh_wallet';

// A well-known, non-existent Solana pubkey shape. Looks legit in UIs that
// truncate to "DemoW…AAAA" without being a real Solana address.
export const DEMO_WALLET = 'DemoWalletDASHHxxxxxxxxxxxxxxxxxxxxxxxxxAAAA';

/** True if demo mode is currently active. Safe to call from server code (returns false). */
export function isDemoMode(): boolean {
  if (typeof window === 'undefined') return false;
  return (
    window.sessionStorage.getItem(DEMO_FLAG_KEY) === '1' ||
    window.localStorage.getItem(DEMO_FLAG_KEY) === '1'
  );
}

/** Turn demo mode on — store the flag + plant the demo wallet. */
export function enterDemoMode(): void {
  if (typeof window === 'undefined') return;
  window.sessionStorage.setItem(DEMO_FLAG_KEY, '1');
  window.localStorage.setItem(DEMO_FLAG_KEY, '1');
  // Only plant the demo wallet if the user doesn't already have a real one.
  // We don't want to clobber a connected Phantom session.
  const existing = window.localStorage.getItem(DEMO_WALLET_KEY);
  if (!existing) {
    window.localStorage.setItem(DEMO_WALLET_KEY, DEMO_WALLET);
  }
}

/** Turn demo mode off — clear both flag stores + the planted wallet. */
export function exitDemoMode(): void {
  if (typeof window === 'undefined') return;
  window.sessionStorage.removeItem(DEMO_FLAG_KEY);
  window.localStorage.removeItem(DEMO_FLAG_KEY);
  // Only remove the wallet if it's the demo placeholder — never clobber a
  // real connected Phantom wallet.
  if (window.localStorage.getItem(DEMO_WALLET_KEY) === DEMO_WALLET) {
    window.localStorage.removeItem(DEMO_WALLET_KEY);
  }
  // Reload so any in-memory state that branched on demo mode resets.
  window.location.reload();
}

/**
 * Check the current URL for `?demo=1` (or `?demo=true`) on every render and
 * promote the flag to sessionStorage if found. Call this once near the top
 * of the app shell (e.g. in the global header).
 */
export function syncDemoFlagFromUrl(): void {
  if (typeof window === 'undefined') return;
  const params = new URLSearchParams(window.location.search);
  const demo = params.get('demo');
  if (demo === '1' || demo === 'true') {
    enterDemoMode();
  }
}
