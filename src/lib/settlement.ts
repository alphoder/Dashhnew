// Two-proof settlement helpers.
//
// Model
// -----
//   Proof #1 (join)   — submitted anytime before campaign endsAt
//                       · anchors ownership + baseline view count
//                       · no payout yet
//   Proof #2 (final)  — must land inside [endsAt, endsAt + settlementWindowDays]
//                       · captures final view count AFTER platform bot-rollbacks
//                         have had time to complete (~3-14 days is typical)
//                       · triggers the single on-chain payout
//
//   If proof #2 misses the window: forfeit. Funds redistribute to creators
//   who did submit (ranking-based models) or return to the brand (per_view).

import type {
  campaignsV2 as campaignsTable,
  participations as participationsTable,
} from './db/schema-v2';

export const DEFAULT_SETTLEMENT_WINDOW_DAYS = 7;

type Campaign = typeof campaignsTable.$inferSelect;
type Participation = typeof participationsTable.$inferSelect;

export type ProofKind = 'join' | 'final' | 'refused';

export interface ProofRouting {
  kind: ProofKind;
  /** If refused, the human-readable reason. */
  reason?: string;
}

/**
 * Decide whether the incoming proof is this participation's JOIN proof
 * (first submission, before endsAt) or FINAL proof (inside the settlement
 * window after endsAt). Returns `refused` if the proof can't be accepted
 * (campaign already settled, past window, etc).
 */
export function routeProofByWindow(
  campaign: Pick<Campaign, 'endsAt' | 'settlementWindowDays' | 'settledAt'>,
  participation: Pick<Participation, 'joinProofId' | 'finalProofId'>,
  now: Date = new Date(),
): ProofRouting {
  const endsAt = new Date(campaign.endsAt);
  const windowDays =
    campaign.settlementWindowDays ?? DEFAULT_SETTLEMENT_WINDOW_DAYS;
  const settlementDeadline = new Date(
    endsAt.getTime() + windowDays * 86_400_000,
  );

  if (campaign.settledAt) {
    return {
      kind: 'refused',
      reason: 'campaign already settled — payouts are final',
    };
  }

  // Before endsAt: join-window
  if (now < endsAt) {
    if (participation.joinProofId) {
      return {
        kind: 'refused',
        reason: 'join proof already submitted — the next proof is the final one, after campaign ends',
      };
    }
    return { kind: 'join' };
  }

  // After endsAt: settlement window
  if (now > settlementDeadline) {
    return {
      kind: 'refused',
      reason: `settlement window closed ${settlementDeadline.toISOString()} — payout forfeited`,
    };
  }

  if (!participation.joinProofId) {
    return {
      kind: 'refused',
      reason: 'no join proof was recorded during the campaign — cannot settle',
    };
  }
  if (participation.finalProofId) {
    return {
      kind: 'refused',
      reason: 'final proof already submitted — this participation is settled',
    };
  }
  return { kind: 'final' };
}

export function settlementDeadline(
  campaign: Pick<Campaign, 'endsAt' | 'settlementWindowDays'>,
): Date {
  const windowDays =
    campaign.settlementWindowDays ?? DEFAULT_SETTLEMENT_WINDOW_DAYS;
  return new Date(
    new Date(campaign.endsAt).getTime() + windowDays * 86_400_000,
  );
}

/** True if the campaign is past the settlement deadline and ready to be finalised. */
export function readyToSettle(
  campaign: Pick<Campaign, 'endsAt' | 'settlementWindowDays' | 'settledAt'>,
  now: Date = new Date(),
): boolean {
  if (campaign.settledAt) return false;
  return now > settlementDeadline(campaign);
}

/** True if a participation is inside the "please submit final proof" window. */
export function inFinalWindow(
  campaign: Pick<Campaign, 'endsAt' | 'settlementWindowDays' | 'settledAt'>,
  participation: Pick<Participation, 'finalProofId'>,
  now: Date = new Date(),
): boolean {
  if (campaign.settledAt) return false;
  if (participation.finalProofId) return false;
  const endsAt = new Date(campaign.endsAt);
  return now >= endsAt && now <= settlementDeadline(campaign);
}
