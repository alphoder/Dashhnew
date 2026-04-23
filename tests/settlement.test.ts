import { describe, it, expect } from 'vitest';
import {
  routeProofByWindow,
  settlementDeadline,
  readyToSettle,
  inFinalWindow,
  DEFAULT_SETTLEMENT_WINDOW_DAYS,
} from '@/lib/settlement';

const futureDate = (daysFromNow: number) =>
  new Date(Date.now() + daysFromNow * 86_400_000);

const baseCampaign = {
  endsAt: futureDate(5),
  settlementWindowDays: DEFAULT_SETTLEMENT_WINDOW_DAYS,
  settledAt: null as Date | null,
};

const emptyParticipation = { joinProofId: null, finalProofId: null };

describe('routeProofByWindow', () => {
  it('routes a first-time submission before endsAt as a join proof', () => {
    const r = routeProofByWindow(baseCampaign, emptyParticipation);
    expect(r.kind).toBe('join');
  });

  it('refuses a second join-window submission', () => {
    const r = routeProofByWindow(baseCampaign, {
      joinProofId: 'some-uuid',
      finalProofId: null,
    });
    expect(r.kind).toBe('refused');
    expect(r.reason).toMatch(/already submitted/i);
  });

  it('routes a submission inside the settlement window as a final proof', () => {
    const endedYesterday = futureDate(-1);
    const r = routeProofByWindow(
      { endsAt: endedYesterday, settlementWindowDays: 7, settledAt: null },
      { joinProofId: 'join-uuid', finalProofId: null },
    );
    expect(r.kind).toBe('final');
  });

  it('refuses a final submission when no join proof exists', () => {
    const endedYesterday = futureDate(-1);
    const r = routeProofByWindow(
      { endsAt: endedYesterday, settlementWindowDays: 7, settledAt: null },
      emptyParticipation,
    );
    expect(r.kind).toBe('refused');
    expect(r.reason).toMatch(/no join proof/i);
  });

  it('refuses a final submission past the window', () => {
    const endedLongAgo = futureDate(-30);
    const r = routeProofByWindow(
      { endsAt: endedLongAgo, settlementWindowDays: 7, settledAt: null },
      { joinProofId: 'join-uuid', finalProofId: null },
    );
    expect(r.kind).toBe('refused');
    expect(r.reason).toMatch(/window closed/i);
  });

  it('refuses anything once the campaign is marked settled', () => {
    const r = routeProofByWindow(
      { endsAt: futureDate(-10), settlementWindowDays: 7, settledAt: futureDate(-5) },
      emptyParticipation,
    );
    expect(r.kind).toBe('refused');
    expect(r.reason).toMatch(/already settled/i);
  });

  it('refuses a duplicate final proof', () => {
    const endedYesterday = futureDate(-1);
    const r = routeProofByWindow(
      { endsAt: endedYesterday, settlementWindowDays: 7, settledAt: null },
      { joinProofId: 'j', finalProofId: 'f' },
    );
    expect(r.kind).toBe('refused');
    expect(r.reason).toMatch(/final proof already submitted/i);
  });
});

describe('settlementDeadline', () => {
  it('adds settlementWindowDays to endsAt', () => {
    const endsAt = new Date('2025-04-10T00:00:00Z');
    const d = settlementDeadline({ endsAt, settlementWindowDays: 7 });
    expect(d.toISOString()).toBe('2025-04-17T00:00:00.000Z');
  });

  it('falls back to default window when unset', () => {
    const endsAt = new Date('2025-04-10T00:00:00Z');
    const d = settlementDeadline({ endsAt, settlementWindowDays: null as any });
    const deltaDays = (d.getTime() - endsAt.getTime()) / 86_400_000;
    expect(deltaDays).toBe(DEFAULT_SETTLEMENT_WINDOW_DAYS);
  });
});

describe('readyToSettle', () => {
  it('is true past the deadline', () => {
    expect(
      readyToSettle(
        { endsAt: futureDate(-10), settlementWindowDays: 7, settledAt: null },
        new Date(),
      ),
    ).toBe(true);
  });

  it('is false before the deadline', () => {
    expect(
      readyToSettle(
        { endsAt: futureDate(-1), settlementWindowDays: 7, settledAt: null },
        new Date(),
      ),
    ).toBe(false);
  });

  it('is false once already settled', () => {
    expect(
      readyToSettle(
        { endsAt: futureDate(-10), settlementWindowDays: 7, settledAt: futureDate(-1) },
        new Date(),
      ),
    ).toBe(false);
  });
});

describe('inFinalWindow', () => {
  it('is true during the window when no final proof exists', () => {
    const c = { endsAt: futureDate(-1), settlementWindowDays: 7, settledAt: null };
    const p = { finalProofId: null };
    expect(inFinalWindow(c, p)).toBe(true);
  });

  it('is false once the creator has posted the final proof', () => {
    const c = { endsAt: futureDate(-1), settlementWindowDays: 7, settledAt: null };
    const p = { finalProofId: 'already' };
    expect(inFinalWindow(c, p)).toBe(false);
  });
});
