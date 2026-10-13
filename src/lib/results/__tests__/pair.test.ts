import { describe, it, expect } from 'vitest';
import { assembleAllCareers } from '../derive/career';
import { composePairSummaries, composePairView } from '../compose';
import { s1Bundle } from './s1.fixtures';
import { s2Bundle } from './s2.fixtures';

/**
 * The pair view over the verified S1 + S2 oracle (see records.test.ts):
 *
 *   season placements  S1 & S2:  tobias 1, jakob 3
 *   season totals      S1: tobias 24, jakob 20   S2: tobias 39, jakob 32
 *   game placements (game-placements.md):
 *     tobias  S1 2,3,2,2,1,4,1,1   S2 3,1,2,3,2,1,2,2
 *     jakob   S1 3,2,3,1,4,2,2,3   S2 4,4,1,2,4,2,1,4
 *
 *   ahead, game by game (T = tobias, J = jakob):
 *     S1 T J T J T J T T  (5–3)    S2 T T J J T T J T  (5–3)
 */

const careers = assembleAllCareers([s1Bundle, s2Bundle]);
const pair = composePairView(careers, 'tobias', 'jakob')!;
const mirrored = composePairView(careers, 'jakob', 'tobias')!;

describe('composePairView', () => {
  it('puts the first slug on side a', () => {
    expect([pair.a.slug, pair.b.slug]).toEqual(['tobias', 'jakob']);
    expect([mirrored.a.slug, mirrored.b.slug]).toEqual(['jakob', 'tobias']);
  });

  it('is null for an unknown player and for a player against themselves', () => {
    expect(composePairView(careers, 'tobias', 'nobody')).toBeNull();
    expect(composePairView(careers, 'tobias', 'tobias')).toBeNull();
  });

  it('counts who finished ahead over every shared game', () => {
    const { a, b, level, games } = pair.finishedAhead;
    expect([a, b, level, games.length]).toEqual([10, 6, 0, 16]);
  });

  it('mirrors when the order is swapped', () => {
    expect([mirrored.finishedAhead.a, mirrored.finishedAhead.b]).toEqual([
      6, 10,
    ]);
    expect(mirrored.seasonsAhead).toEqual({ a: 0, b: 2 });
    expect(mirrored.matches.a).toBe(pair.matches.b);
    expect(mirrored.matches.b).toBe(pair.matches.a);
  });

  it('lists the shared seasons with placements, points and the game tally', () => {
    expect(
      pair.seasons.map((s) => [
        s.season.seasonNumber,
        s.a.placement,
        s.b.placement,
        s.a.totalPoints,
        s.b.totalPoints,
        s.ahead,
        s.tally.a,
        s.tally.b,
      ]),
    ).toEqual([
      [1, 1, 3, 24, 20, 'a', 5, 3],
      [2, 1, 3, 39, 32, 'a', 5, 3],
    ]);
    expect(pair.seasonsAhead).toEqual({ a: 2, b: 0 });
  });

  it('splits the tally by whose pick the game was, covering every game', () => {
    const { a, b, others } = pair.picks;
    expect(a.games.length + b.games.length + others.games.length).toBe(16);
    expect(a.a + b.a + others.a).toBe(10);
    expect(a.b + b.b + others.b).toBe(6);
  });

  it('tallies each category over the shared games under it, most level first', () => {
    const gaps = pair.categories.map((c) => Math.abs(c.tally.a - c.tally.b));
    expect(gaps).toEqual([...gaps].sort((x, y) => x - y));
    for (const { tally } of pair.categories) {
      expect(tally.a + tally.b + tally.level).toBe(tally.games.length);
    }
  });

  it('keeps the match record consistent with its per-length split', () => {
    const { a, b, matches, byBestOf } = pair.matches;
    expect(a + b).toBe(matches.length);
    expect(byBestOf.reduce((sum, t) => sum + t.a, 0)).toBe(a);
    expect(byBestOf.reduce((sum, t) => sum + t.b, 0)).toBe(b);
    for (const group of byBestOf) {
      expect(group.matches.every((m) => m.bestOf === group.bestOf)).toBe(true);
    }
  });

  it('ends the current match run with their latest match', () => {
    const { current, longest } = pair.matchRuns;
    const last = pair.matches.matches[pair.matches.matches.length - 1];
    if (!last) {
      expect(current).toBeNull();
      return;
    }
    expect(current!.side).toBe(last.winner);
    expect(current!.matches.every((m) => m.winner === last.winner)).toBe(true);
    expect(current!.matches.length).toBeLessThanOrEqual(
      longest[last.winner].length,
    );
  });

  it('finds each side’s best season by points margin, or none', () => {
    // Tobias finished ahead both seasons: +4 in S1, +7 in S2.
    expect(pair.moments.bestSeason.a?.season.seasonNumber).toBe(2);
    expect(pair.moments.bestSeason.b).toBeNull();
  });

  it('finds each side’s longest run of games finishing ahead', () => {
    // Tobias: S1 games 7–8 into S2 games 1–2. Jakob: S2 games 3–4.
    const { a, b } = pair.gameRuns.longest;
    expect(a.map((g) => `${g.seasonNumber}:${g.ordinal}`)).toHaveLength(4);
    expect(a[0].seasonNumber).toBe(1);
    expect(a[3].seasonNumber).toBe(2);
    expect(b).toHaveLength(2);
    expect(b.every((g) => g.seasonNumber === 2)).toBe(true);
  });

  it('ends the current game run with their latest shared game', () => {
    // S2 ends J (game 7), T (game 8): Tobias is on a run of one.
    const { current } = pair.gameRuns;
    expect(current?.side).toBe('a');
    expect(current?.games).toHaveLength(1);
    expect(current?.games[0].seasonNumber).toBe(2);
    // From the other side it is the same run, belonging to side b.
    expect(mirrored.gameRuns.current?.side).toBe('b');
    expect(mirrored.gameRuns.current?.games).toHaveLength(1);
  });

  it('lists each side’s other opponents for the switcher', () => {
    expect(pair.a.opponents.map((o) => o.slug)).toEqual([
      'jakob',
      'jorgen',
      'william',
    ]);
  });
});

describe('composePairSummaries', () => {
  it('gives one line per opponent, from the player’s side', () => {
    const lines = composePairSummaries(careers, 'jakob');
    expect(lines.map((l) => l.opponent.slug)).toEqual([
      'jorgen',
      'tobias',
      'william',
    ]);
    const tobias = lines.find((l) => l.opponent.slug === 'tobias')!;
    expect([tobias.ahead, tobias.behind, tobias.level]).toEqual([6, 10, 0]);
    expect([tobias.matchWins, tobias.matchLosses]).toEqual([
      mirrored.matches.a,
      mirrored.matches.b,
    ]);
  });

  it('is empty for an unknown player', () => {
    expect(composePairSummaries(careers, 'nobody')).toEqual([]);
  });
});
