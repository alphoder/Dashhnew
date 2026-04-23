import { describe, it, expect } from 'vitest';
import { canAutoVerify, AUTO_VERIFY_SPIKE_CAP } from '@/lib/trust';

describe('canAutoVerify', () => {
  const now = new Date('2025-04-23T12:00:00.000Z');
  const oneHourAgo = new Date('2025-04-23T11:00:00.000Z');

  it('allows small monotonic deltas', () => {
    const v = canAutoVerify({
      previousVerifiedViews: 1_000,
      previousVerifiedAt: oneHourAgo,
      newViews: 1_500,
      now,
    });
    expect(v.ok).toBe(true);
    if (v.ok) expect(v.delta).toBe(500);
  });

  it('treats zero-delta as a no-op ok', () => {
    const v = canAutoVerify({
      previousVerifiedViews: 1_000,
      previousVerifiedAt: oneHourAgo,
      newViews: 1_000,
      now,
    });
    expect(v.ok).toBe(true);
    if (v.ok) expect(v.delta).toBe(0);
  });

  it('rejects view drops', () => {
    const v = canAutoVerify({
      previousVerifiedViews: 5_000,
      previousVerifiedAt: oneHourAgo,
      newViews: 4_000,
      now,
    });
    expect(v.ok).toBe(false);
    if (!v.ok) expect(v.reason).toMatch(/decreased/i);
  });

  it('rejects spikes above the absolute cap', () => {
    const v = canAutoVerify({
      previousVerifiedViews: 1_000,
      previousVerifiedAt: oneHourAgo,
      newViews: 1_000 + AUTO_VERIFY_SPIKE_CAP + 1,
      now,
    });
    expect(v.ok).toBe(false);
    if (!v.ok) expect(v.reason).toMatch(/spike cap/i);
  });

  it('rejects high velocity relative to prior rate', () => {
    const v = canAutoVerify({
      previousVerifiedViews: 100,
      previousVerifiedAt: oneHourAgo, // prior rate: 100/hr
      newViews: 20_000, // 20,000 new views in 1hr = 200x prior
      now,
    });
    expect(v.ok).toBe(false);
    if (!v.ok) expect(v.reason).toMatch(/velocity/i);
  });

  it('flags zero-engagement spikes', () => {
    const v = canAutoVerify({
      previousVerifiedViews: 0,
      previousVerifiedAt: null,
      newViews: 10_000,
      likes: 0,
      comments: 0,
      now,
    });
    expect(v.ok).toBe(false);
    if (!v.ok) expect(v.reason).toMatch(/bot pattern/i);
  });
});
