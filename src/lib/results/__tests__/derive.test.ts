import { describe, it, expect } from 'vitest';
import { assembleSeasonView, assembleGameView } from '../derive';
import {
  s1Bundle,
  s1ExpectedGamePoints,
  s1ExpectedTotals,
} from './s1.fixtures';

/**
 * These assert the pure derivation against the fully-verified S1 numbers from
 * working-docs/game-placements.md. If the arithmetic drifts, these fail — the
 * one gate `next build` cannot provide for silently-wrong points.
 */

describe('assembleSeasonView — Season 1', () => {
  const view = assembleSeasonView(s1Bundle);

  it('reports the correct season number and slug', () => {
    expect(view.seasonNumber).toBe(1);
    expect(view.seasonSlug).toBe('01');
  });

  it('resolves the full roster to PlayerRefs', () => {
    expect(view.players.map((p) => p.slug).sort()).toEqual([
      'jakob',
      'jorgen',
      'tobias',
      'william',
    ]);
  });

  it('orders standings by authoritative season_result placement', () => {
    expect(view.standings.map((s) => s.player.slug)).toEqual([
      'tobias', // 1st
      'jorgen', // 2nd (tiebreak over Jakob)
      'jakob', // 3rd
      'william', // 4th
    ]);
    expect(view.standings.map((s) => s.placement)).toEqual([1, 2, 3, 4]);
  });

  it('derives the verified season point totals (24/20/20/16)', () => {
    const totalBySlug = Object.fromEntries(
      view.standings.map((s) => [s.player.slug, s.totalPoints]),
    );
    expect(totalBySlug.tobias).toBe(s1ExpectedTotals.tobias);
    expect(totalBySlug.jakob).toBe(s1ExpectedTotals.jakob);
    expect(totalBySlug.jorgen).toBe(s1ExpectedTotals.jorgen);
    expect(totalBySlug.william).toBe(s1ExpectedTotals.william);
  });

  it('marks only the champion isChampion', () => {
    expect(
      view.standings.filter((s) => s.isChampion).map((s) => s.player.slug),
    ).toEqual(['tobias']);
  });

  it('preserves the season-level tiebreak note on Jørgen', () => {
    const jorgen = view.standings.find((s) => s.player.slug === 'jorgen')!;
    expect(jorgen.note).toContain('Gen 6');
    // Players without a note carry null, not an empty string.
    expect(
      view.standings.find((s) => s.player.slug === 'tobias')!.note,
    ).toBeNull();
  });

  it('derives each per-game points matrix exactly (game-placements.md)', () => {
    for (const game of view.games) {
      const expected = s1ExpectedGamePoints[game.slug];
      expect(expected, `missing expectation for ${game.slug}`).toBeDefined();
      const bySlug = Object.fromEntries(
        game.results.map((r) => [r.player.slug, r.points]),
      );
      expect(bySlug, game.slug).toEqual(expected);
    }
  });

  it('orders games by ordinal and each game result by placement', () => {
    expect(view.games.map((g) => g.ordinal)).toEqual([1, 2, 3, 4, 5, 6, 7, 8]);
    for (const game of view.games) {
      expect(game.results.map((r) => r.placement)).toEqual([1, 2, 3, 4]);
    }
  });

  it('preserves the game-level tiebreak note on OSRS (Jørgen 1st)', () => {
    const osrs = view.games.find((g) => g.slug === 'old-school-runescape')!;
    const winner = osrs.results[0];
    expect(winner.player.slug).toBe('jorgen');
    expect(winner.note).toContain('tiebreakeren');
  });

  it('reports zero power-up delta for S1 (no power-ups)', () => {
    for (const game of view.games) {
      for (const row of game.results) {
        expect(row.powerUpDelta).toBe(0);
        expect(row.points).toBe(row.ladderPoints);
      }
    }
  });
});

describe('assembleGameView — Season 1', () => {
  it('returns the game result table for a known slug', () => {
    const view = assembleGameView(s1Bundle, 'trackmania');
    expect(view).not.toBeNull();
    expect(view!.ordinal).toBe(7);
    expect(view!.results.map((r) => r.player.slug)).toEqual([
      'tobias', // 1st
      'jakob', // 2nd
      'william', // 3rd
      'jorgen', // 4th
    ]);
  });

  it('returns null for an unknown slug (→ notFound())', () => {
    expect(assembleGameView(s1Bundle, 'does-not-exist')).toBeNull();
  });
});
