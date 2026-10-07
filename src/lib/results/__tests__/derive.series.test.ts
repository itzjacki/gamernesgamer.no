import { describe, it, expect } from 'vitest';
import { assembleSeasonView } from '../derive';
import { cumulativeSeries } from '../derive/series';
import { s1Bundle, s1ExpectedTotals } from './s1.fixtures';

/**
 * Asserts the cumulative points-over-games series against the verified S1
 * per-game matrix (working-docs/game-placements.md). The running totals must
 * reconcile with the season totals the standings test already pins
 * (24/20/20/16), and the x-axis must be the games in ordinal order.
 *
 * S1 per-game points (verified), in ordinal order sjakk..flat-out-2:
 *   tobias  : 3 2 3 3 4 1 4 4  -> cumulative 3 5 8 11 15 16 20 24
 *   jakob   : 2 3 2 4 1 3 3 2  -> cumulative 2 5 7 11 12 15 18 20
 *   jorgen  : 4 4 1 2 3 4 1 1  -> cumulative 4 8 9 11 14 18 19 20
 *   william : 1 1 4 1 2 2 2 3  -> cumulative 1 2 6 7  9 11 13 16
 */

const EXPECTED_CUMULATIVE: Record<string, number[]> = {
  tobias: [3, 5, 8, 11, 15, 16, 20, 24],
  jakob: [2, 5, 7, 11, 12, 15, 18, 20],
  jorgen: [4, 8, 9, 11, 14, 18, 19, 20],
  william: [1, 2, 6, 7, 9, 11, 13, 16],
};

describe('cumulativeSeries — Season 1', () => {
  const view = assembleSeasonView(s1Bundle);
  const series = view.series;

  it('produces one line per roster player', () => {
    expect(series.map((s) => s.player.slug).sort()).toEqual([
      'jakob',
      'jorgen',
      'tobias',
      'william',
    ]);
  });

  it('uses the games in ordinal order as the shared x-axis', () => {
    for (const line of series) {
      expect(line.points.map((p) => p.ordinal)).toEqual([
        1, 2, 3, 4, 5, 6, 7, 8,
      ]);
    }
  });

  it('matches the verified running totals for every player', () => {
    const bySlug = Object.fromEntries(
      series.map((s) => [s.player.slug, s.points.map((p) => p.total)]),
    );
    expect(bySlug.tobias).toEqual(EXPECTED_CUMULATIVE.tobias);
    expect(bySlug.jakob).toEqual(EXPECTED_CUMULATIVE.jakob);
    expect(bySlug.jorgen).toEqual(EXPECTED_CUMULATIVE.jorgen);
    expect(bySlug.william).toEqual(EXPECTED_CUMULATIVE.william);
  });

  it('ends each line on the authoritative season total', () => {
    const finalBySlug = Object.fromEntries(
      series.map((s) => [s.player.slug, s.points.at(-1)!.total]),
    );
    expect(finalBySlug.tobias).toBe(s1ExpectedTotals.tobias);
    expect(finalBySlug.jakob).toBe(s1ExpectedTotals.jakob);
    expect(finalBySlug.jorgen).toBe(s1ExpectedTotals.jorgen);
    expect(finalBySlug.william).toBe(s1ExpectedTotals.william);
  });

  it('is monotonically non-decreasing (points are never negative in S1)', () => {
    for (const line of series) {
      for (let i = 1; i < line.points.length; i++) {
        expect(line.points[i].total).toBeGreaterThanOrEqual(
          line.points[i - 1].total,
        );
      }
    }
  });

  it('returns empty lines when there are no games', () => {
    const empty = cumulativeSeries([], view.players);
    expect(empty).toHaveLength(view.players.length);
    for (const line of empty) {
      expect(line.points).toEqual([]);
    }
  });
});
