import { describe, expect, it } from 'vitest';

import { countdownTo, findUpcomingSeason } from '@/lib/upcoming-season';
import type { SeasonMeta } from '@/types/season-meta';

const meta = (overrides: Partial<SeasonMeta>): SeasonMeta => ({
  status: 'finished',
  start: '2025-12-13',
  end: '2025-12-14',
  revealGamerCards: false,
  revealGames: false,
  revealPowerups: false,
  ...overrides,
});

describe('countdownTo', () => {
  it('counts whole days to the start', () => {
    expect(countdownTo('2026-12-12', '2026-10-22')).toEqual({
      kind: 'days',
      days: 51,
    });
  });

  it('says one day the day before', () => {
    expect(countdownTo('2026-12-12', '2026-12-11')).toEqual({
      kind: 'days',
      days: 1,
    });
  });

  it('is unaffected by a DST change in between', () => {
    // Norway leaves summer time on 2026-10-25.
    expect(countdownTo('2026-10-26', '2026-10-24')).toEqual({
      kind: 'days',
      days: 2,
    });
  });

  it('counts across a year boundary', () => {
    expect(countdownTo('2027-01-02', '2026-12-31')).toEqual({
      kind: 'days',
      days: 2,
    });
  });

  it('is "today" on the start day', () => {
    expect(countdownTo('2026-12-12', '2026-12-12')).toEqual({
      kind: 'today',
    });
  });

  it('is null once the start has passed', () => {
    expect(countdownTo('2026-12-12', '2026-12-13')).toBeNull();
  });
});

describe('findUpcomingSeason', () => {
  it('finds the upcoming season', () => {
    const seasons = {
      '04': { meta: meta({}) },
      '05': { meta: meta({ status: 'upcoming', start: '2026-12-12' }) },
    };
    expect(findUpcomingSeason(seasons)?.slug).toBe('05');
  });

  it('is undefined when none is upcoming (all finished)', () => {
    expect(findUpcomingSeason({ '04': { meta: meta({}) } })).toBeUndefined();
  });

  it('is undefined while a season is live', () => {
    const seasons = {
      '04': { meta: meta({}) },
      '05': { meta: meta({ status: 'live', start: '2026-12-12' }) },
    };
    expect(findUpcomingSeason(seasons)).toBeUndefined();
  });

  it('picks the earliest start if several are upcoming', () => {
    const seasons = {
      '06': { meta: meta({ status: 'upcoming', start: '2027-06-01' }) },
      '05': { meta: meta({ status: 'upcoming', start: '2026-12-12' }) },
    };
    expect(findUpcomingSeason(seasons)?.slug).toBe('05');
  });
});
