import { describe, it, expect } from 'vitest';
import { assembleAllCareers } from '../derive/career';
import { deriveRecords } from '../derive/records';
import { placementPoints } from '../derive/records/board';
import { byValueDesc, rankEntries } from '../derive/records/rank';
import { longestStreak } from '../derive/records/streaks';
import { composeRecordsView } from '../compose';
import type {
  RecordEntry,
  RecordGameRow,
  RecordsPlayerInput,
} from '../view-models';
import { s1Bundle } from './s1.fixtures';
import { s2Bundle } from './s2.fixtures';

/**
 * Records over the verified S1 + S2 oracle (see career.test.ts for the season
 * numbers these follow from):
 *
 *   placements   S1 & S2:   tobias 1, jorgen 2, jakob 3, william 4
 *   season totals S1:       tobias 24, jakob 20, jorgen 20, william 16
 *   season totals S2:       tobias 39, jakob 32, jorgen 32, william 30
 *   game wins:              tobias 5, jorgen 5, jakob 3, william 3
 *   game placements (game-placements.md):
 *     tobias  S1 2,3,2,2,1,4,1,1   S2 3,1,2,3,2,1,2,2
 *     jakob   S1 3,2,3,1,4,2,2,3   S2 4,4,1,2,4,2,1,4
 */

const view = composeRecordsView(assembleAllCareers([s1Bundle, s2Bundle]));

const names = (entries: RecordEntry[]) => entries.map((e) => e.player.name);
const entryOf = (entries: RecordEntry[], slug: string) =>
  entries.find((e) => e.player.slug === slug)!;

describe('assembleAllCareers', () => {
  it('returns one career per rostered player, ordered by slug', () => {
    const careers = assembleAllCareers([s1Bundle, s2Bundle]);
    expect(careers.map((c) => c.slug)).toEqual([
      'jakob',
      'jorgen',
      'tobias',
      'william',
    ]);
  });
});

describe('career board', () => {
  it('scores 1st = 4 … 4th = 1, and never below 1', () => {
    expect([1, 2, 3, 4, 5].map(placementPoints)).toEqual([4, 3, 2, 1, 1]);
  });

  it('orders players by summed season placement-points', () => {
    expect(
      view.board.map((r) => [r.player.slug, r.rank, r.placementPoints]),
    ).toEqual([
      ['tobias', 1, 8],
      ['jorgen', 2, 6],
      ['jakob', 3, 4],
      ['william', 4, 2],
    ]);
  });

  it('carries the per-season placements, championships and game stats', () => {
    expect(view.seasons.map((s) => s.seasonNumber)).toEqual([1, 2]);
    const tobias = view.board[0];
    expect(tobias.placements).toEqual([1, 1]);
    expect(tobias.championships).toBe(2);
    expect(tobias.gameWins).toBe(5);
    expect(tobias.averageGamePlacement).toBe(2);
    expect(view.board[3].championships).toBe(0);
  });

  it('leaves a season the player did not play as null', () => {
    const solo = composeRecordsView(assembleAllCareers([s2Bundle]));
    expect(solo.seasons.map((s) => s.seasonNumber)).toEqual([2]);
    expect(solo.board[0].placements).toEqual([1]);
  });
});

describe('count records', () => {
  it('shares rank 1 between the two players on five game wins', () => {
    expect(
      view.mostGameWins.map((e) => [e.player.slug, e.rank, e.value]),
    ).toEqual([
      ['jorgen', 1, 5],
      ['tobias', 1, 5],
      ['jakob', 3, 3],
      ['william', 3, 3],
    ]);
  });

  it('lists the won games behind the count, in play order', () => {
    expect(
      entryOf(view.mostGameWins, 'tobias').games.map((g) => g.gameSlug),
    ).toEqual([
      'tetris',
      'trackmania',
      'flat-out-2',
      'curve-fever',
      'wreckfest',
    ]);
  });

  it('splits wins into own picks and other players’ picks', () => {
    // Tobias chose trackmania (S1) and wreckfest (S2) among his five wins.
    const home = entryOf(view.homeTurf, 'tobias');
    const away = entryOf(view.awayWins, 'tobias');
    expect(home.games.every((g) => g.ownPick)).toBe(true);
    expect(away.games.some((g) => g.ownPick)).toBe(false);
    expect(home.value + away.value).toBe(5);
    expect(home.outOf).toBe(4); // two picks per season
    expect(away.outOf).toBe(12);
  });
});

describe('streaks', () => {
  it('finds the longest run, preferring the most recent on a tie', () => {
    const run = longestStreak([1, 1, 2, 1, 1, 3, 1], (n) => n === 1);
    expect(run).toHaveLength(2);
    // Indexes 3–4, not 0–1: same length, later.
    expect(
      longestStreak(['a1', 'b1', 'c2', 'd1', 'e1'], (s) => s.endsWith('1')),
    ).toEqual(['d1', 'e1']);
  });

  it('returns nothing when no game qualifies', () => {
    expect(longestStreak([2, 3], (n) => n === 1)).toEqual([]);
  });

  it('gives Tobias a two-game win streak (the last two games of S1)', () => {
    const tobias = entryOf(view.longestWinStreak, 'tobias');
    expect(tobias.value).toBe(2);
    expect(tobias.games.map((g) => g.gameSlug)).toEqual([
      'trackmania',
      'flat-out-2',
    ]);
  });

  it('gives Tobias a four-game top-two streak at the end of S2', () => {
    // S2 placements 3,1,2,3,2,1,2,2 — the last four are all first or second.
    const tobias = entryOf(view.longestTopTwoStreak, 'tobias');
    expect(tobias.value).toBe(4);
    expect(tobias.games.every((g) => g.seasonNumber === 2)).toBe(true);
  });

  it('runs a streak across a season boundary', () => {
    const game = (seasonNumber: number, placement: number): RecordGameRow => ({
      seasonNumber,
      seasonSlug: String(seasonNumber).padStart(2, '0'),
      gameSlug: `g${seasonNumber}-${placement}`,
      gameTitle: 'Game',
      placement,
      ownPick: false,
      titleId: 't',
      titleName: 'T',
      tags: [],
    });
    const players: RecordsPlayerInput[] = [
      {
        player: { slug: 'a', name: 'A' },
        seasons: [],
        games: [game(1, 2), game(1, 1), game(2, 1), game(2, 3)],
      },
    ];
    const [entry] = deriveRecords(players).longestWinStreak;
    expect(entry.value).toBe(2);
    expect(entry.games.map((g) => g.seasonNumber)).toEqual([1, 2]);
  });
});

describe('best single season', () => {
  it('enters each player once, with their best season average', () => {
    expect(view.bestSeason).toHaveLength(4);
    // Tobias averages 2.0 in both seasons (16 / 8); S1 has three wins to S2's two.
    const tobias = entryOf(view.bestSeason, 'tobias');
    expect(tobias.value).toBe(2);
    expect(tobias.outOf).toBe(8);
    expect(tobias.season?.seasonNumber).toBe(1);
    // Jakob: S1 20 / 8 = 2.5 beats S2 22 / 8 = 2.75.
    const jakob = entryOf(view.bestSeason, 'jakob');
    expect(jakob.value).toBe(2.5);
    expect(jakob.season?.seasonNumber).toBe(1);
  });

  it('ranks best first', () => {
    const values = view.bestSeason.map((e) => e.value);
    expect(values).toEqual([...values].sort((a, b) => a - b));
  });
});

describe('tiebreak record', () => {
  it('credits Jørgen with both points ties against Jakob', () => {
    // 20–20 in S1 and 32–32 in S2; Jørgen placed 2nd both times.
    expect(names(view.tiebreaks)).toEqual(['Jørgen', 'Jakob']);
    const jorgen = view.tiebreaks[0];
    expect([jorgen.rank, jorgen.value, jorgen.outOf]).toEqual([1, 2, 2]);
    expect(
      jorgen.tiebreaks?.map((t) => [
        t.season.seasonNumber,
        t.opponent.name,
        t.won,
      ]),
    ).toEqual([
      [1, 'Jakob', true],
      [2, 'Jakob', true],
    ]);
    const jakob = view.tiebreaks[1];
    expect([jakob.rank, jakob.value, jakob.outOf]).toEqual([2, 0, 2]);
  });
});

describe('title specialist', () => {
  it('needs a title played at least twice (none is, across S1 + S2)', () => {
    expect(view.titleSpecialist).toEqual([]);
  });

  it('counts wins across every instance of a title', () => {
    const game = (
      seasonNumber: number,
      titleId: string,
      placement: number,
    ): RecordGameRow => ({
      seasonNumber,
      seasonSlug: String(seasonNumber).padStart(2, '0'),
      gameSlug: `${titleId}-${seasonNumber}`,
      gameTitle: titleId,
      placement,
      ownPick: false,
      titleId,
      titleName: titleId.toUpperCase(),
      tags: [],
    });
    const players: RecordsPlayerInput[] = [
      {
        player: { slug: 'a', name: 'A' },
        seasons: [],
        // Two wins in two at "cs"; a lone win at "solo" does not count.
        games: [game(1, 'cs', 1), game(2, 'cs', 1), game(1, 'solo', 1)],
      },
      {
        player: { slug: 'b', name: 'B' },
        seasons: [],
        games: [game(1, 'cs', 2), game(2, 'cs', 3)],
      },
    ];
    const entries = deriveRecords(players).titleSpecialist;
    expect(entries).toHaveLength(1); // B has no win at a repeated title
    expect(entries[0]).toMatchObject({
      player: { slug: 'a' },
      rank: 1,
      value: 2,
      outOf: 2,
      title: { id: 'cs', name: 'CS' },
    });
  });
});

describe('tag crowns', () => {
  it('crowns Tobias in racing (three wins in three)', () => {
    const racing = view.tagCrowns.find((c) => c.tag === 'racing')!;
    const [holder] = racing.entries;
    expect(holder.player.slug).toBe('tobias');
    expect([holder.rank, holder.value, holder.outOf]).toEqual([1, 1, 3]);
    expect(racing.entries).toHaveLength(4);
  });

  it('lists every tag, unfiltered, largest sample first', () => {
    const samples = view.tagCrowns.map((c) => c.entries[0].outOf ?? 0);
    expect(samples).toEqual([...samples].sort((a, b) => b - a));
    expect(samples[samples.length - 1]).toBeLessThan(3);
  });
});

describe('rankEntries', () => {
  const entry = (name: string, value: number) => ({
    player: { slug: name, name },
    value,
    games: [],
  });

  it('shares a rank on a tie and skips the next one', () => {
    const ranked = rankEntries(
      [entry('c', 1), entry('b', 3), entry('a', 3), entry('d', 2)],
      byValueDesc,
    );
    expect(ranked.map((e) => [e.player.name, e.rank])).toEqual([
      ['a', 1],
      ['b', 1],
      ['d', 3],
      ['c', 4],
    ]);
  });
});
