import { describe, it, expect } from 'vitest';
import { assembleSeasonView, assembleGameView } from '../derive';
import { composeSeasonView, composeGameView } from '../compose';
import { s2Bundle } from './s2.fixtures';

/**
 * compose.ts is the seam between DB-derived view-models and the STATIC
 * src/data/sesong content. These tests join the real S2 derivation output to
 * the real S2 static data (games.ts / gamers.ts) — so they also guard that the
 * seeded slugs/names actually line up with the static content. Unlike the
 * derive tests, importing static data here is intended: this is the one layer
 * that bridges the two.
 */

describe('composeSeasonView — Season 2', () => {
  const view = composeSeasonView(assembleSeasonView(s2Bundle));

  it('keeps the derived standings order and points', () => {
    expect(view.standings.map((s) => s.player.slug)).toEqual([
      'tobias',
      'jorgen',
      'jakob',
      'william',
    ]);
    expect(view.standings.map((s) => s.totalPoints)).toEqual([39, 32, 32, 30]);
  });

  it('attaches each player’s static gamer content by name', () => {
    const tobias = view.standings.find((s) => s.player.slug === 'tobias')!;
    // From src/data/sesong/02/gamers.ts
    expect(tobias.gamer.name).toBe('Tobias');
    expect(tobias.gamer.nickname).toBe('"The Maestro"');
    expect(tobias.gamer.imagePath).toContain('/images/gamers/2/');
    // Every standing resolves a gamer.
    for (const row of view.standings) {
      expect(row.gamer.name).toBe(row.player.name);
    }
  });

  it('attaches each game’s static content by slug, preserving ordinal order', () => {
    expect(view.games.map((g) => g.game.slug)).toEqual([
      'hearthstone',
      'curve-fever',
      'the-sims-4',
      'warcraft-3',
      'poker',
      'wreckfest',
      'total-war-empire',
      'league-of-legends-02',
    ]);
    // Static titles come through (from games.ts).
    const hs = view.games.find((g) => g.game.slug === 'hearthstone')!;
    expect(hs.game.title).toBe('Hearthstone');
    const lol = view.games.find((g) => g.game.slug === 'league-of-legends-02')!;
    expect(lol.game.title).toBe('League of Legends');
    expect(lol.game.chosenBy).toBe('Jørgen');
  });

  it('preserves the derived per-game results untouched', () => {
    const tw = view.games.find((g) => g.game.slug === 'total-war-empire')!;
    const bySlug = Object.fromEntries(
      tw.results.map((r) => [r.player.slug, r.points]),
    );
    // ladder + power-ups, same as the derive tests.
    expect(bySlug).toEqual({ jakob: 7, jorgen: 2, tobias: 8, william: 3 });
  });

  it('marks the champion', () => {
    expect(
      view.standings.filter((s) => s.isChampion).map((s) => s.player.slug),
    ).toEqual(['tobias']);
  });
});

describe('composeGameView — Season 2', () => {
  it('joins a single game view to its static content', () => {
    const gv = assembleGameView(s2Bundle, 'wreckfest')!;
    const composed = composeGameView(gv);
    expect(composed.game.title).toBe('Wreckfest');
    expect(composed.game.chosenBy).toBe('Tobias');
    expect(composed.ordinal).toBe(6);
    expect(composed.results.map((r) => r.placement)).toEqual([1, 2, 3, 4]);
  });
});

describe('compose — fail-loud on missing static content', () => {
  it('throws when a game slug has no static entry', () => {
    const broken = {
      ...assembleSeasonView(s2Bundle),
      games: [
        {
          slug: 'nonexistent-game',
          ordinal: 1,
          results: [],
        },
      ],
    };
    expect(() => composeSeasonView(broken)).toThrow(/no static game content/i);
  });

  it('throws for an unknown season slug', () => {
    const broken = { ...assembleSeasonView(s2Bundle), seasonSlug: '99' };
    expect(() => composeSeasonView(broken)).toThrow(
      /no static season content/i,
    );
  });
});
