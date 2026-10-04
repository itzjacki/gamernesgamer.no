import { describe, it, expect } from 'vitest';
import { assembleSeasonView, assembleGameView } from '../derive';
import {
  s2Bundle,
  s2ExpectedGamePoints,
  s2ExpectedPowerUpDeltas,
  s2ExpectedTotals,
} from './s2.fixtures';

/**
 * Season 2 is the first season with POWER-UPS and the first with a season-level
 * point TIE resolved by season_result (Jakob & Jørgen both 32). These assert
 * the derivation handles both — the arithmetic `next build` cannot catch.
 * Oracle numbers come from working-docs/game-placements.md + the Poeng sheet.
 */

describe('assembleSeasonView — Season 2', () => {
  const view = assembleSeasonView(s2Bundle);

  it('reports the correct season number and slug', () => {
    expect(view.seasonNumber).toBe(2);
    expect(view.seasonSlug).toBe('02');
  });

  it('derives the verified season point totals (32/32/39/30, incl. power-ups)', () => {
    const totalBySlug = Object.fromEntries(
      view.standings.map((s) => [s.player.slug, s.totalPoints]),
    );
    expect(totalBySlug.jakob).toBe(s2ExpectedTotals.jakob);
    expect(totalBySlug.jorgen).toBe(s2ExpectedTotals.jorgen);
    expect(totalBySlug.tobias).toBe(s2ExpectedTotals.tobias);
    expect(totalBySlug.william).toBe(s2ExpectedTotals.william);
  });

  it('resolves a season-level point tie by authoritative season_result, not points', () => {
    // Jakob and Jørgen both total 32; season_result ranks Jørgen 2nd, Jakob 3rd.
    const jakob = view.standings.find((s) => s.player.slug === 'jakob')!;
    const jorgen = view.standings.find((s) => s.player.slug === 'jorgen')!;
    expect(jakob.totalPoints).toBe(jorgen.totalPoints); // genuinely tied on points
    expect(jorgen.placement).toBe(2);
    expect(jakob.placement).toBe(3);
    // And the standings array is ordered by placement.
    expect(view.standings.map((s) => s.player.slug)).toEqual([
      'tobias', // 1st (39)
      'jorgen', // 2nd (32, tiebreak winner)
      'jakob', // 3rd (32)
      'william', // 4th (30)
    ]);
  });

  it('carries the season-level tiebreak note on Jørgen only', () => {
    const jorgen = view.standings.find((s) => s.player.slug === 'jorgen')!;
    expect(jorgen.note).toContain('Table Tennis World Tour');
    expect(
      view.standings.find((s) => s.player.slug === 'jakob')!.note,
    ).toBeNull();
  });

  it('derives each per-game points matrix exactly (ladder + power-ups)', () => {
    for (const game of view.games) {
      const expected = s2ExpectedGamePoints[game.slug];
      expect(expected, `missing expectation for ${game.slug}`).toBeDefined();
      const bySlug = Object.fromEntries(
        game.results.map((r) => [r.player.slug, r.points]),
      );
      expect(bySlug, game.slug).toEqual(expected);
    }
  });

  it('reports the per-row power-up delta, and points = ladderPoints + delta', () => {
    for (const game of view.games) {
      const expectedDeltas = s2ExpectedPowerUpDeltas[game.slug];
      expect(
        expectedDeltas,
        `missing delta expectation for ${game.slug}`,
      ).toBeDefined();
      for (const row of game.results) {
        expect(row.powerUpDelta, `${game.slug}/${row.player.slug} delta`).toBe(
          expectedDeltas[row.player.slug as keyof typeof expectedDeltas],
        );
        // The identity the whole points model rests on.
        expect(row.points, `${game.slug}/${row.player.slug} sum`).toBe(
          row.ladderPoints + row.powerUpDelta,
        );
      }
    }
  });

  it('sums multiple power-up deltas within one game (Wreckfest)', () => {
    // Wreckfest has three separate uses by three players; each is a single row
    // but confirms the per-player grouping is correct.
    const wf = view.games.find((g) => g.slug === 'wreckfest')!;
    const bySlug = Object.fromEntries(
      wf.results.map((r) => [r.player.slug, r]),
    );
    expect(bySlug.jakob.powerUpDelta).toBe(4); // Double Up on 2nd place (4→8)
    expect(bySlug.william.powerUpDelta).toBe(2); // Double Up on 3rd (2→4)
    expect(bySlug.jorgen.powerUpDelta).toBe(2); // Safety Net on 4th (1→3)
    expect(bySlug.tobias.powerUpDelta).toBe(0); // no power-up
  });

  it('treats a zero-delta power-up use as no points change (Gamba Time misses)', () => {
    // LoL: Jakob and Tobias both used Gamba Time for 0. Points must equal the
    // pure ladder (Jakob 4th → 1, Tobias 2nd → 4).
    const lol = view.games.find((g) => g.slug === 'league-of-legends-02')!;
    const bySlug = Object.fromEntries(
      lol.results.map((r) => [r.player.slug, r]),
    );
    expect(bySlug.jakob.powerUpDelta).toBe(0);
    expect(bySlug.jakob.points).toBe(bySlug.jakob.ladderPoints);
    expect(bySlug.tobias.powerUpDelta).toBe(0);
    expect(bySlug.tobias.points).toBe(bySlug.tobias.ladderPoints);
  });

  it('orders games by ordinal and each game result by placement', () => {
    expect(view.games.map((g) => g.ordinal)).toEqual([1, 2, 3, 4, 5, 6, 7, 8]);
    for (const game of view.games) {
      expect(game.results.map((r) => r.placement)).toEqual([1, 2, 3, 4]);
    }
  });
});

describe('assembleGameView — Season 2', () => {
  it('returns a game view with power-up deltas applied (Total War)', () => {
    const view = assembleGameView(s2Bundle, 'total-war-empire');
    expect(view).not.toBeNull();
    expect(view!.ordinal).toBe(7);
    const bySlug = Object.fromEntries(
      view!.results.map((r) => [r.player.slug, r]),
    );
    // Tobias 2nd (ladder 4) + Double Up 4 = 8; William 4th (ladder 1) + Safety Net 2 = 3.
    expect(bySlug.tobias.points).toBe(8);
    expect(bySlug.william.points).toBe(3);
    expect(bySlug.jakob.points).toBe(7); // 1st, no power-up
  });
});
