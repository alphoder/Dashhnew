// Single source of truth for the Explore / Create mode system.
// Both <AppSidebar> and <RoleToggle> derive from the same lists here, so the
// header pill and the sidebar can never disagree on which mode a route is in.
//
// Three buckets:
//   EXPLORE_ROUTES  — routes that belong strictly to Explore mode
//   CREATE_ROUTES   — routes that belong strictly to Create mode
//   NEUTRAL_ROUTES  — routes shared by both; preserve the user's last choice
//
// When adding a new page: add its prefix to exactly ONE of the three arrays
// and both the sidebar and the header pill pick it up automatically.

export type Mode = 'explore' | 'create';

export const EXPLORE_ROUTES = [
  '/dashboard',
  '/discover',
  '/leaderboard',
] as const;

export const CREATE_ROUTES = [
  '/creatordashboard',
  '/form',
  '/analytics',
] as const;

export const NEUTRAL_ROUTES = [
  '/notifications',
  '/onboarding',
  '/terms',
  '/verifyClaim',
] as const;

export const MODE_STORAGE_KEY = 'dashh_mode';
export const DEFAULT_MODE: Mode = 'explore';

function startsWithAny(path: string, list: readonly string[]): boolean {
  return list.some((p) => path === p || path.startsWith(p + '/') || path.startsWith(p));
}

/** True when the route belongs to the authenticated app shell (any mode). */
export function isAppRoute(pathname: string | null | undefined): boolean {
  const path = pathname ?? '';
  return (
    startsWithAny(path, EXPLORE_ROUTES) ||
    startsWithAny(path, CREATE_ROUTES) ||
    startsWithAny(path, NEUTRAL_ROUTES)
  );
}

/**
 * Derive the active mode from a pathname.
 *
 * - Explicit route match wins.
 * - On neutral routes (notifications, onboarding, etc.) we preserve the
 *   user's stored preference so the header pill doesn't flip on them.
 * - On unknown routes we fall back to DEFAULT_MODE.
 */
export function deriveMode(
  pathname: string | null | undefined,
  storedMode?: Mode | null,
): Mode {
  const path = pathname ?? '/';
  if (startsWithAny(path, CREATE_ROUTES)) return 'create';
  if (startsWithAny(path, EXPLORE_ROUTES)) return 'explore';
  if (startsWithAny(path, NEUTRAL_ROUTES)) return storedMode ?? DEFAULT_MODE;
  return DEFAULT_MODE;
}

/** Read the stored mode from localStorage (client-only). */
export function readStoredMode(): Mode | null {
  if (typeof window === 'undefined') return null;
  const v = window.localStorage.getItem(MODE_STORAGE_KEY);
  return v === 'create' || v === 'explore' ? v : null;
}

/** Persist the mode to localStorage. */
export function writeStoredMode(mode: Mode) {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(MODE_STORAGE_KEY, mode);
}

/** Pick the canonical landing route for a mode. */
export function homeForMode(mode: Mode): string {
  return mode === 'create' ? '/creatordashboard' : '/dashboard';
}
