import { describe, it, expect } from 'vitest';
import { verify } from '@/lib/reclaim/verify';
import type { VerifiedEngagement } from '@/lib/reclaim/types';

const baseEngagement: VerifiedEngagement = {
  platform: 'instagram',
  handle: 'avakim',
  ownerHandle: 'avakim',
  postUrl: 'https://instagram.com/p/abc',
  views: 1000,
  postCreatedAt: Math.floor(Date.now() / 1000),
  likes: 50,
  comments: 10,
  caption: 'Loving the new #brewandbloom oat milk latte @brewandbloom dial.to/...',
  rawProof: {},
  verifiedAt: new Date(),
};

const baseCtx = {
  linkedHandle: 'avakim',
  campaignStartsAt: new Date(Date.now() - 86_400_000),
  bannedCreator: false,
  previousProofsForThisCampaign: 0,
  previousViewsForThisCampaign: 0,
  requiredHashtag: '#brewandbloom',
  requiredMention: '@brewandbloom',
  requiredPhrase: undefined,
  campaignId: '7945a002-caca-48f9-847f-bf80bd995b5a',
};

describe('verify()', () => {
  it('accepts a clean proof', () => {
    expect(verify(baseEngagement, baseCtx).severity).toBe('ok');
  });

  it('blocks banned wallets immediately', () => {
    const v = verify(baseEngagement, { ...baseCtx, bannedCreator: true });
    expect(v.severity).toBe('severe');
  });

  it('rejects when post owner does not match session user', () => {
    const v = verify(
      { ...baseEngagement, ownerHandle: 'mrbeast' },
      baseCtx,
    );
    expect(v.severity).toBe('severe');
    expect(v.disqualificationReason).toMatch(/content you do not own/);
  });

  it('rejects when session handle does not match onboarding-linked handle', () => {
    const v = verify(baseEngagement, { ...baseCtx, linkedHandle: 'someone-else' });
    expect(v.severity).toBe('severe');
  });

  it('rejects posts created before the campaign started', () => {
    const v = verify(
      {
        ...baseEngagement,
        postCreatedAt: Math.floor((Date.now() - 30 * 86_400_000) / 1000),
      },
      baseCtx,
    );
    expect(v.severity).toBe('reject');
    expect(v.disqualificationReason).toMatch(/old\/recycled posts/);
  });

  it('rejects when post caption is missing the required hashtag', () => {
    const v = verify(
      { ...baseEngagement, caption: 'plain caption @brewandbloom' },
      baseCtx,
    );
    expect(v.severity).toBe('reject');
    expect(v.reason).toMatch(/hashtag/);
  });

  it('rejects when post caption is missing the required mention', () => {
    const v = verify(
      { ...baseEngagement, caption: 'plain #brewandbloom no mention' },
      baseCtx,
    );
    expect(v.severity).toBe('reject');
    expect(v.reason).toMatch(/mention/);
  });

  it('flags suspicious first-proof velocity', () => {
    const v = verify(
      { ...baseEngagement, views: 250_000 },
      baseCtx,
    );
    expect(v.severity).toBe('warn');
  });

  it('flags zero-engagement bot-farm pattern', () => {
    const v = verify(
      { ...baseEngagement, views: 20_000, likes: 0, comments: 0 },
      baseCtx,
    );
    expect(v.severity).toBe('warn');
  });

  it('rejects a view-count that drops vs a prior proof', () => {
    const v = verify(
      { ...baseEngagement, views: 500 },
      { ...baseCtx, previousViewsForThisCampaign: 1000 },
    );
    expect(v.severity).toBe('reject');
  });
});
