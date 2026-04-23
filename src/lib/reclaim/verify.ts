// Server-side verification pipeline that turns a parsed proof into a verdict.
// Runs every check the /api/v2/proofs route needs: ownership, post-age,
// velocity heuristics, ban status. Keep all rules in one place so the T&C
// and the code are always in sync.

import type { VerifiedEngagement } from './types';

export interface VerificationContext {
  linkedHandle: string | null;   // the creator's handle for this platform from profiles_v2
  campaignStartsAt: Date;
  bannedCreator: boolean;
  previousProofsForThisCampaign: number;
  previousViewsForThisCampaign: number;
  // Content-match rules — if any are set, the post caption/description must
  // contain the required marker or the proof is rejected.
  requiredHashtag?: string | null;
  requiredMention?: string | null;
  requiredPhrase?: string | null;
  campaignId?: string;
}

export type VerdictSeverity = 'ok' | 'warn' | 'reject' | 'severe';

export interface Verdict {
  severity: VerdictSeverity;
  reason: string | null;
  /** Suggested disqualification reason string (matches DISQUALIFICATION_REASONS). */
  disqualificationReason?: string;
}

const VIRAL_SPIKE_THRESHOLD = 100_000;
const BOT_RATIO_WARN = 500; // 1 engagement per 500 views is suspicious

function norm(s: string | undefined | null): string {
  return (s ?? '').replace(/^@/, '').toLowerCase().trim();
}

export function verify(
  engagement: VerifiedEngagement,
  ctx: VerificationContext,
): Verdict {
  // 0. Bans are terminal.
  if (ctx.bannedCreator) {
    return {
      severity: 'severe',
      reason: 'wallet is banned',
      disqualificationReason:
        'Wallet is currently banned from the protocol — join is denied.',
    };
  }

  // 1. Ownership cross-check — the authenticated session user must match
  //    the post owner (no submitting someone else's viral video).
  if (
    engagement.ownerHandle &&
    engagement.handle &&
    norm(engagement.ownerHandle) !== norm(engagement.handle)
  ) {
    return {
      severity: 'severe',
      reason: `post owner "${engagement.ownerHandle}" does not match session user "${engagement.handle}"`,
      disqualificationReason:
        'Submitting content you do not own — the post owner in the proof must match your verified social handle',
    };
  }

  // 2. Linked-handle cross-check — the session user must match the handle
  //    the creator declared during onboarding for this platform.
  if (ctx.linkedHandle && norm(ctx.linkedHandle) !== norm(engagement.handle)) {
    return {
      severity: 'severe',
      reason: `authenticated handle "${engagement.handle}" does not match onboarding-linked handle "${ctx.linkedHandle}"`,
      disqualificationReason:
        'Sybil behaviour — using multiple wallets or sock-puppet social accounts',
    };
  }

  // 2a. Content-match — the post must actually promote the campaign. If the
  //     brand specified a required hashtag / mention / phrase / blink URL,
  //     the caption must contain it or the proof is rejected. This stops
  //     creators from posting unrelated content and claiming the payout.
  const caption = (engagement.caption ?? '').toLowerCase();
  const missing: string[] = [];

  if (ctx.requiredHashtag) {
    const tag = ctx.requiredHashtag.toLowerCase().replace(/^#?/, '#');
    if (!caption.includes(tag)) missing.push(`hashtag ${tag}`);
  }
  if (ctx.requiredMention) {
    const m = ctx.requiredMention.toLowerCase().replace(/^@?/, '@');
    if (!caption.includes(m)) missing.push(`mention ${m}`);
  }
  if (ctx.requiredPhrase) {
    if (!caption.includes(ctx.requiredPhrase.toLowerCase())) {
      missing.push(`phrase "${ctx.requiredPhrase}"`);
    }
  }
  // Always require the campaign's Blink link to appear somewhere — that's
  // how viewers actually participate. If no explicit blinkId is configured,
  // fall back to the campaignId so the caption still has to reference it.
  if (ctx.campaignId) {
    const needle = ctx.campaignId.slice(0, 8).toLowerCase();
    if (
      !caption.includes(needle) &&
      !caption.includes('dial.to') &&
      !caption.includes('blinks.knowflow.study')
    ) {
      // Only warn on this — some brands are fine with organic promo without
      // the explicit Blink URL. Can be upgraded to "reject" per campaign.
      missing.push('Blink link or campaign reference');
    }
  }

  if (missing.length > 0) {
    const hard =
      !!ctx.requiredHashtag || !!ctx.requiredMention || !!ctx.requiredPhrase;
    return {
      severity: hard ? 'reject' : 'warn',
      reason: `post does not reference the campaign — missing ${missing.join(', ')}`,
      disqualificationReason:
        'Misrepresenting the brand, product, or campaign terms',
    };
  }

  // 3. Post-age check — post must have been created after the campaign started.
  if (engagement.postCreatedAt) {
    const postDate = new Date(
      engagement.postCreatedAt < 1e12
        ? engagement.postCreatedAt * 1000 // seconds → ms
        : engagement.postCreatedAt,
    );
    if (postDate < ctx.campaignStartsAt) {
      return {
        severity: 'reject',
        reason: `post dates from ${postDate.toISOString()} — before campaign start ${ctx.campaignStartsAt.toISOString()}`,
        disqualificationReason:
          'Submitting content published before the campaign started (old/recycled posts)',
      };
    }
  }

  // 4. Velocity guard — a massive spike on a first proof from an unknown
  //    creator is suspicious. Flag as warn; the server can decide to hold
  //    for community review rather than auto-verify.
  if (
    ctx.previousProofsForThisCampaign === 0 &&
    engagement.views > VIRAL_SPIKE_THRESHOLD
  ) {
    return {
      severity: 'warn',
      reason: `first proof exceeds ${VIRAL_SPIKE_THRESHOLD.toLocaleString()} views — unusual velocity`,
      disqualificationReason:
        'Impossible view velocity — spikes that exceed realistic human-engagement rates for your follower base',
    };
  }

  // 5. Engagement ratio — 0 likes/comments on 10k+ views is typical bot
  //    farm behaviour.
  const engagementTotal = (engagement.likes ?? 0) + (engagement.comments ?? 0);
  if (engagement.views >= 10_000 && engagementTotal === 0) {
    return {
      severity: 'warn',
      reason: `${engagement.views} views with zero likes/comments — bot-ratio red flag`,
      disqualificationReason:
        'Engagement-ratio mismatch (e.g. views without any likes or comments, indicative of farmed traffic)',
    };
  }
  if (
    engagement.views >= 1_000 &&
    engagementTotal > 0 &&
    engagement.views / engagementTotal > BOT_RATIO_WARN
  ) {
    return {
      severity: 'warn',
      reason: `views-to-engagement ratio ${Math.round(engagement.views / engagementTotal)} exceeds ${BOT_RATIO_WARN}`,
      disqualificationReason:
        'Engagement-ratio mismatch (e.g. views without any likes or comments, indicative of farmed traffic)',
    };
  }

  // 6. Non-increasing views — re-submitted proof can't decrease.
  if (
    ctx.previousViewsForThisCampaign > 0 &&
    engagement.views < ctx.previousViewsForThisCampaign
  ) {
    return {
      severity: 'reject',
      reason: `view count dropped from ${ctx.previousViewsForThisCampaign} to ${engagement.views}`,
      disqualificationReason:
        'Fabricated or manipulated engagement (bot traffic, view farms, click bots)',
    };
  }

  return { severity: 'ok', reason: null };
}
