// Trust-mode rules for auto-verification.
//
// Once a creator runs a real zkTLS proof on a participation, we enter
// "trust mode" for a fixed window. During the window, the public-API view
// counter drives payouts automatically — no human action required.
//
// Trust is broken (forces a fresh zkTLS checkpoint) when:
//   • The window expires.
//   • Views drop between polls (rollback suspected).
//   • Velocity spikes above realistic multiples.
//   • Engagement ratio collapses (views spike with zero likes/comments).
//
// Every proof — whether manually submitted or auto-verified — re-sets the
// trust window so active creators never hit the wall.

export const TRUST_WINDOW_DAYS = 14;
export const TRUST_WINDOW_MS = TRUST_WINDOW_DAYS * 24 * 60 * 60 * 1000;

/** Max views allowed per hour as a multiple of the prior verified rate. */
export const VELOCITY_MULTIPLIER_MAX = 10;

/** Absolute cap on auto-verified views per poll — never auto-verify more
 *  than this much engagement in a single sync (a real hit would be easy
 *  for the creator to manually re-verify). */
export const AUTO_VERIFY_SPIKE_CAP = 50_000;

export interface TrustInputs {
  previousVerifiedViews: number;
  previousVerifiedAt: Date | null;
  newViews: number;
  now?: Date;
  likes?: number;
  comments?: number;
}

export type TrustVerdict =
  | { ok: true; delta: number }
  | { ok: false; reason: string };

export function canAutoVerify(inputs: TrustInputs): TrustVerdict {
  const now = inputs.now ?? new Date();
  const delta = inputs.newViews - inputs.previousVerifiedViews;

  if (delta < 0) {
    return { ok: false, reason: 'views decreased since last checkpoint' };
  }
  if (delta === 0) {
    return { ok: true, delta: 0 };
  }
  if (delta > AUTO_VERIFY_SPIKE_CAP) {
    return {
      ok: false,
      reason: `+${delta.toLocaleString()} exceeds auto-verify spike cap (${AUTO_VERIFY_SPIKE_CAP.toLocaleString()})`,
    };
  }

  if (inputs.previousVerifiedAt && inputs.previousVerifiedViews > 0) {
    const hoursSince =
      (now.getTime() - inputs.previousVerifiedAt.getTime()) / (1000 * 60 * 60);
    if (hoursSince > 0) {
      const priorRate = inputs.previousVerifiedViews / Math.max(1, hoursSince);
      const newRate = delta / Math.max(0.01, hoursSince);
      if (newRate > priorRate * VELOCITY_MULTIPLIER_MAX) {
        return {
          ok: false,
          reason: `velocity ${Math.round(newRate / priorRate)}× prior rate — needs fresh checkpoint`,
        };
      }
    }
  }

  // Engagement ratio guard — zero-engagement spike means bot injection.
  const engagement = (inputs.likes ?? 0) + (inputs.comments ?? 0);
  if (inputs.newViews >= 5_000 && engagement === 0) {
    return {
      ok: false,
      reason: 'high view count with zero likes/comments — bot pattern',
    };
  }

  return { ok: true, delta };
}

export function nextTrustExpiry(now: Date = new Date()): Date {
  return new Date(now.getTime() + TRUST_WINDOW_MS);
}
