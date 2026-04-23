import { describe, it, expect } from 'vitest';
import {
  PLATFORM_FEE_BPS,
  PLATFORM_FEE_PERCENT,
  TERMS_VERSION,
  buildTermsMessage,
} from '@/lib/terms';

describe('terms', () => {
  it('platform fee is 20%', () => {
    expect(PLATFORM_FEE_BPS).toBe(2000);
    expect(PLATFORM_FEE_PERCENT).toBe(20);
  });

  it('builds a deterministic signable message', () => {
    const issuedAt = '2025-04-23T12:00:00.000Z';
    const msg = buildTermsMessage({
      brandWallet: 'AAA',
      budget: 100,
      paymentModel: 'per_view',
      cpv: 0.1,
      issuedAt,
    });
    expect(msg).toContain(`DASHH Campaign Terms ${TERMS_VERSION}`);
    expect(msg).toContain('Wallet:        AAA');
    expect(msg).toContain('Budget:        100 SOL');
    expect(msg).toContain(`Platform fee:  ${PLATFORM_FEE_PERCENT}%`);
    expect(msg).toContain(`Issued at:     ${issuedAt}`);
  });

  it('notes topNCount for split_top_n', () => {
    const msg = buildTermsMessage({
      brandWallet: 'AAA',
      budget: 100,
      paymentModel: 'split_top_n',
      topNCount: 5,
      cpv: 0.1,
      issuedAt: '2025-04-23T12:00:00.000Z',
    });
    expect(msg).toContain('split_top_n (top 5)');
  });
});
