import { describe, it, expect } from 'vitest';
import { computePayoutForProof } from '@/lib/payouts';

describe('computePayoutForProof', () => {
  const base = {
    model: 'per_view' as const,
    cpv: 0.001,
    budget: 10,
    previousMaxViewsThisCreator: 0,
    totalAlreadyPaidOnCampaign: 0,
  };

  it('pays on delta, not on total, when resubmitting', () => {
    const first = computePayoutForProof({ ...base, newViews: 1000 });
    expect(first.amount).toBe(1); // 1000 * 0.001

    const second = computePayoutForProof({
      ...base,
      newViews: 5000,
      previousMaxViewsThisCreator: 1000,
      totalAlreadyPaidOnCampaign: 1,
    });
    // Only the new 4000 views should pay
    expect(second.amount).toBeCloseTo(4, 10);
  });

  it('pays zero when views have not increased', () => {
    const d = computePayoutForProof({
      ...base,
      newViews: 1000,
      previousMaxViewsThisCreator: 1000,
    });
    expect(d.amount).toBe(0);
    expect(d.reason).toMatch(/no new views/i);
  });

  it('caps payout at remaining budget', () => {
    const d = computePayoutForProof({
      ...base,
      budget: 5,
      newViews: 100_000,
      totalAlreadyPaidOnCampaign: 4,
    });
    expect(d.amount).toBe(1);
    expect(d.budgetExhausted).toBe(true);
  });

  it('returns 0 and defers for top_performer', () => {
    const d = computePayoutForProof({
      ...base,
      model: 'top_performer',
      newViews: 50_000,
    });
    expect(d.amount).toBe(0);
    expect(d.deferredToEnd).toBe(true);
    expect(d.reason).toMatch(/campaign end/i);
  });

  it('returns 0 and defers for split_top_n', () => {
    const d = computePayoutForProof({
      ...base,
      model: 'split_top_n',
      newViews: 50_000,
    });
    expect(d.deferredToEnd).toBe(true);
  });

  it('returns 0 and defers for equal_split', () => {
    const d = computePayoutForProof({
      ...base,
      model: 'equal_split',
      newViews: 50_000,
    });
    expect(d.deferredToEnd).toBe(true);
  });
});
