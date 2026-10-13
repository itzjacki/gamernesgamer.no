import { describe, it, expect } from 'vitest';
import { assembleAllCareers } from '../derive/career';
import { deriveRecords } from '../derive/records';
import { placementPoints } from '../derive/records/board';
import { byValueDesc, rankEntries } from '../derive/records/rank';
import { longestStreak } from '../derive/records/streaks';
import { composeRecordsView } from '../compose';
import { assembleSeasonView } from '../derive';
import type {
  RecordEntry,
  RecordGameRow,
  RecordMatchRow,
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
      powerUpDelta: 0,
    });
    const players: RecordsPlayerInput[] = [
      {
        player: { slug: 'a', name: 'A' },
        seasons: [],
        games: [game(1, 2), game(1, 1), game(2, 1), game(2, 3)],
        matches: [],
      },
    ];
    const [entry] = deriveRecords(players).longestWinStreak;
    expect(entry.value).toBe(2);
    expect(entry.games.map((g) => g.seasonNumber)).toEqual([1, 2]);
  });
});

describe('top-three streak', () => {
  it('gives Tobias ten games in the top three, across the season boundary', () => {
    // S1 2,3,2,2,1,4,1,1 then S2 3,1,2,3,2,1,2,2 — everything after the 4th.
    const tobias = entryOf(view.longestTopThreeStreak, 'tobias');
    expect(tobias.value).toBe(10);
    expect(tobias.games.map((g) => g.seasonNumber)).toEqual([
      1, 1, 2, 2, 2, 2, 2, 2, 2, 2,
    ]);
  });
});

describe('points records', () => {
  it('sums raw season points over the career', () => {
    expect(
      view.totalPoints.map((e) => [e.player.slug, e.rank, e.value, e.outOf]),
    ).toEqual([
      ['tobias', 1, 63, 2],
      ['jakob', 2, 52, 2],
      ['jorgen', 2, 52, 2],
      ['william', 4, 46, 2],
    ]);
    expect(
      entryOf(view.totalPoints, 'tobias').seasonPoints?.map((l) => [
        l.season.seasonNumber,
        l.points,
      ]),
    ).toEqual([
      [1, 24],
      [2, 39],
    ]);
  });

  it('nets power-up points from the games they moved (none in S1)', () => {
    expect(view.powerUpPoints.length).toBeGreaterThan(0);
    for (const entry of view.powerUpPoints) {
      expect(entry.games.every((g) => g.seasonNumber === 2)).toBe(true);
      expect(entry.games.every((g) => g.powerUpDelta !== 0)).toBe(true);
      expect(entry.outOf).toBe(entry.games.length);
      expect(entry.value).toBe(
        entry.games.reduce((sum, g) => sum + (g.powerUpDelta ?? 0), 0),
      );
    }
    const values = view.powerUpPoints.map((e) => e.value);
    expect(values).toEqual([...values].sort((a, b) => b - a));
  });

  it('keeps a negative power-up net and drops players never affected', () => {
    const game = (slug: string, powerUpDelta: number): RecordGameRow => ({
      seasonNumber: 1,
      seasonSlug: '01',
      gameSlug: slug,
      gameTitle: slug,
      placement: 1,
      ownPick: false,
      titleId: slug,
      titleName: slug,
      tags: [],
      powerUpDelta,
    });
    const player = (name: string, games: RecordGameRow[]) => ({
      player: { slug: name, name },
      seasons: [],
      games,
      matches: [],
    });
    const entries = deriveRecords([
      player('a', [game('x', 3), game('y', -1), game('z', 0)]),
      player('b', [game('x', -2)]),
      player('c', [game('x', 0)]),
    ]).powerUpPoints;
    expect(
      entries.map((e) => [e.player.slug, e.rank, e.value, e.outOf]),
    ).toEqual([
      ['a', 1, 2, 2],
      ['b', 2, -2, 1],
    ]);
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

  it('ranks on the share won, sharing a rank at the same share', () => {
    const season = (totalPoints: number, placement: number) => ({
      seasonNumber: 1,
      seasonSlug: '01',
      placement,
      totalPoints,
      isChampion: placement === 1,
    });
    const player = (name: string, seasons: ReturnType<typeof season>[]) => ({
      player: { slug: name, name },
      seasons,
      games: [],
      matches: [],
    });
    // One season, two separate ties: a beats b on 10, c beats d on 5.
    const one = deriveRecords([
      player('a', [season(10, 1)]),
      player('b', [season(10, 2)]),
      player('c', [season(5, 3)]),
      player('d', [season(5, 4)]),
    ]).tiebreaks;
    expect(one.map((e) => [e.player.slug, e.rank, e.value, e.outOf])).toEqual([
      ['a', 1, 1, 1],
      ['c', 1, 1, 1],
      ['b', 3, 0, 1],
      ['d', 3, 0, 1],
    ]);
  });
});

describe('head-to-head matches', () => {
  const [jakob, jorgen] = s1Bundle.roster.map((r) => r.id);
  const game = s1Bundle.games[0];
  const TS = '2023-03-18T09:00:00+00:00';
  const match = (id: string, series_len: 'bo1' | 'bo3') => ({
    id,
    stage_id: 'stage-1',
    slot_id: null,
    player_a: jakob,
    player_b: jorgen,
    series_len,
    leg: 1,
  });
  const row = (
    match_id: string,
    game_number: number,
    score_a: number,
    score_b: number,
    tiebreak_winner: 'a' | 'b' | null = null,
  ) => ({
    match_id,
    game_number,
    score_a,
    score_b,
    tiebreak_winner,
    created_at: TS,
    updated_at: TS,
  });
  const withMatches = {
    ...s1Bundle,
    stages: [
      {
        id: 'stage-1',
        game_id: game.id,
        ordinal: 1,
        kind: 'round-robin' as const,
        aggregation: null,
      },
    ],
    matches: [
      match('m-sweep', 'bo3'),
      match('m-close', 'bo3'),
      match('m-draw', 'bo1'),
      match('m-open', 'bo3'),
      match('m-series', 'bo3'),
    ],
    matchGames: [
      row('m-sweep', 1, 1, 0),
      row('m-sweep', 2, 3, 1),
      row('m-close', 1, 0, 1),
      row('m-close', 2, 1, 0),
      row('m-close', 3, 0, 1),
      // A level game goes to the tiebreak winner.
      row('m-draw', 1, 2, 2, 'b'),
      // One game each: not decided, so not a match yet.
      row('m-open', 1, 1, 0),
      row('m-open', 2, 0, 1),
      // A lone row in a bo3 is the series score: 1–2, not one game won 2–1.
      row('m-series', 1, 1, 2),
    ],
  };

  it('decides a match on game rows won and drops undecided ones', () => {
    const summary = assembleSeasonView(withMatches).games.find(
      (g) => g.slug === game.slug,
    )!;
    expect(summary.matches.map((m) => [m.bestOf, m.winsA, m.winsB])).toEqual([
      [3, 2, 0],
      [3, 1, 2],
      [1, 0, 1],
      [3, 1, 2],
    ]);
    expect(assembleSeasonView(s1Bundle).games[0].matches).toEqual([]);
  });

  it('ranks match wins and sweeps on their rate', () => {
    const view = composeRecordsView(assembleAllCareers([withMatches]));
    // Jakob (side a) won one of four; Jørgen three of four.
    expect(
      view.matchWins.map((e) => [e.player.slug, e.rank, e.value, e.outOf]),
    ).toEqual([
      ['jorgen', 1, 3, 4],
      ['jakob', 2, 1, 4],
    ]);
    // Only the three bo3 matches count; Jakob swept one. Jørgen's two wins
    // were both 2–1 — the single-row series must not read as a sweep.
    expect(
      view.matchSweeps.map((e) => [e.player.slug, e.rank, e.value, e.outOf]),
    ).toEqual([
      ['jakob', 1, 1, 3],
      ['jorgen', 2, 0, 3],
    ]);
    expect(view.matchWins[0].matchLines).toEqual([
      expect.objectContaining({ gameSlug: game.slug, count: 3, outOf: 4 }),
    ]);
  });

  it('prefers the larger sample at the same rate, and skips players with no matches', () => {
    const m = (won: boolean): RecordMatchRow => ({
      seasonNumber: 1,
      seasonSlug: '01',
      gameSlug: 'g',
      gameTitle: 'G',
      bestOf: 1,
      gamesWon: won ? 1 : 0,
      gamesLost: won ? 0 : 1,
      won,
      opponent: { slug: 'x', name: 'X' },
      slotId: null,
    });
    const player = (name: string, matches: RecordMatchRow[]) => ({
      player: { slug: name, name },
      seasons: [],
      games: [],
      matches,
    });
    const records = deriveRecords([
      player('a', [m(true), m(false)]),
      player('b', [m(true), m(true), m(false), m(false)]),
      player('c', []),
    ]);
    expect(records.matchWins.map((e) => [e.player.slug, e.rank])).toEqual([
      ['b', 1],
      ['a', 2],
    ]);
    // No series longer than one game: nobody has a sweep record.
    expect(records.matchSweeps).toEqual([]);
  });
});

describe('match records built on single matches', () => {
  /** One match from a player's side: "2-1" = won two games, lost one. */
  const m = (
    score: string,
    over: Partial<RecordMatchRow> = {},
  ): RecordMatchRow => {
    const [gamesWon, gamesLost] = score.split('-').map(Number);
    return {
      seasonNumber: 1,
      seasonSlug: '01',
      gameSlug: 'g',
      gameTitle: 'G',
      bestOf: 3,
      gamesWon,
      gamesLost,
      won: gamesWon > gamesLost,
      opponent: { slug: 'x', name: 'X' },
      slotId: null,
      ...over,
    };
  };
  const player = (name: string, matches: RecordMatchRow[]) => ({
    player: { slug: name, name },
    seasons: [],
    games: [],
    matches,
  });
  const line = (e: RecordEntry) => [e.player.slug, e.rank, e.value, e.outOf];

  it('counts only series that went the distance as deciders, with a minimum', () => {
    const { matchDeciders } = deriveRecords([
      // Three deciders (two won); the 2-0 and the bo1 are not deciders.
      player('a', [
        m('2-1'),
        m('1-2'),
        m('2-1'),
        m('2-0'),
        m('1-0', { bestOf: 1 }),
      ]),
      // Only two deciders: below the minimum, so no entry.
      player('b', [m('2-1'), m('2-1')]),
      player('c', [m('3-2', { bestOf: 5 }), m('2-1'), m('2-1')]),
    ]);
    expect(matchDeciders.map(line)).toEqual([
      ['c', 1, 3, 3],
      ['a', 2, 2, 3],
    ]);
  });

  it('counts one final per game, settled by a grand-final reset', () => {
    const final = (score: string, gameSlug: string, slotId: string) =>
      m(score, { gameSlug, slotId });
    const { finals } = deriveRecords([
      player('a', [
        final('2-0', 'g1', 'F'),
        final('0-2', 'g2', 'F'),
        // Lost the grand final, won the reset: one final, won.
        final('1-2', 'g3', 'GF'),
        final('2-0', 'g3', 'GF2'),
        // A semi-final and a bronze final are not finals.
        m('2-0', { gameSlug: 'g4', slotId: 'SF1' }),
        m('2-0', { gameSlug: 'g4', slotId: 'BR' }),
      ]),
      player('b', [final('2-0', 'g1', 'F'), final('2-0', 'g2', 'F')]),
    ]);
    expect(finals.map(line)).toEqual([['a', 1, 2, 3]]);
  });

  it('calls a game flawless only with enough matches, all won', () => {
    const { flawlessGames } = deriveRecords([
      player('a', [
        m('1-0', { gameSlug: 'g1' }),
        m('1-0', { gameSlug: 'g1' }),
        m('1-0', { gameSlug: 'g1' }),
        // Two wins in two: too few matches.
        m('1-0', { gameSlug: 'g2' }),
        m('1-0', { gameSlug: 'g2' }),
      ]),
      player('b', [
        m('1-0', { gameSlug: 'g1' }),
        m('1-0', { gameSlug: 'g1' }),
        m('0-1', { gameSlug: 'g1' }),
      ]),
    ]);
    expect(flawlessGames.map((e) => [e.player.slug, e.value])).toEqual([
      ['a', 1],
    ]);
    expect(flawlessGames[0].matchLines).toEqual([
      expect.objectContaining({ gameSlug: 'g1', count: 3, outOf: 3 }),
    ]);
  });

  it('finds the longest run of wins over one opponent', () => {
    const vs = (slug: string, score: string, seasonNumber = 1) =>
      m(score, { opponent: { slug, name: slug.toUpperCase() }, seasonNumber });
    const { opponentStreak } = deriveRecords([
      player('a', [
        // Over x: win, win, loss, win — a run of two.
        vs('x', '2-0'),
        vs('y', '2-0'),
        vs('x', '2-1'),
        vs('y', '2-0'),
        vs('x', '0-2'),
        // Over y: three in a row, interleaved with the x matches.
        vs('y', '2-1', 2),
        vs('x', '2-0', 2),
      ]),
      player('b', [vs('x', '0-2')]),
    ]);
    expect(opponentStreak.map((e) => [e.player.slug, e.value])).toEqual([
      ['a', 3],
    ]);
    expect(opponentStreak[0].opponent).toEqual({ slug: 'y', name: 'Y' });
    expect(opponentStreak[0].matches).toHaveLength(3);
  });
});

describe('home advantage and the closer', () => {
  const game = (
    seasonNumber: number,
    placement: number,
    ownPick = false,
  ): RecordGameRow => ({
    seasonNumber,
    seasonSlug: String(seasonNumber).padStart(2, '0'),
    gameSlug: `g-${seasonNumber}-${placement}-${ownPick}`,
    gameTitle: 'G',
    placement,
    ownPick,
    titleId: 't',
    titleName: 'T',
    tags: [],
    powerUpDelta: 0,
  });
  const player = (name: string, games: RecordGameRow[]) => ({
    player: { slug: name, name },
    seasons: [],
    games,
    matches: [],
  });

  it('measures how much better a player places in their own picks', () => {
    const { homeAdvantage } = deriveRecords([
      // Own picks average 1.5, others' 3.5: two places better at home.
      player('a', [
        game(1, 1, true),
        game(1, 2, true),
        game(1, 1, true),
        game(1, 2, true),
        game(1, 3),
        game(1, 4),
      ]),
      // Three own picks: below the minimum.
      player('b', [
        game(1, 1, true),
        game(1, 1, true),
        game(1, 1, true),
        game(1, 4),
      ]),
    ]);
    expect(homeAdvantage).toHaveLength(1);
    expect(homeAdvantage[0]).toMatchObject({
      player: { slug: 'a' },
      value: 2,
      outOf: 4,
      split: { own: 1.5, others: 3.5 },
    });
    expect(homeAdvantage[0].games.every((g) => g.ownPick)).toBe(true);
  });

  it('gives everyone in the S1 + S2 oracle a home advantage entry', () => {
    // Two own picks per season, so four each — exactly the minimum.
    expect(view.homeAdvantage).toHaveLength(4);
    for (const entry of view.homeAdvantage) {
      expect(entry.value).toBeCloseTo(entry.split!.others - entry.split!.own);
    }
  });

  it('averages the last game of each season, needing three seasons', () => {
    const { seasonCloser } = deriveRecords([
      // Closers: 1, 2, 3 (the last game of each season).
      player('a', [game(1, 4), game(1, 1), game(2, 2), game(3, 4), game(3, 3)]),
      // Two seasons only: no entry.
      player('b', [game(1, 1), game(2, 1)]),
      player('c', [game(1, 1), game(2, 1), game(3, 2)]),
    ]);
    expect(
      seasonCloser.map((e) => [e.player.slug, e.rank, e.value, e.outOf]),
    ).toEqual([
      ['c', 1, 4 / 3, 3],
      ['a', 2, 2, 3],
    ]);
    // S1 + S2 alone is two seasons: nobody qualifies.
    expect(view.seasonCloser).toEqual([]);
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
      powerUpDelta: 0,
    });
    const players: RecordsPlayerInput[] = [
      {
        player: { slug: 'a', name: 'A' },
        seasons: [],
        // Two wins in two at "cs"; a lone win at "solo" does not count.
        games: [game(1, 'cs', 1), game(2, 'cs', 1), game(1, 'solo', 1)],
        matches: [],
      },
      {
        player: { slug: 'b', name: 'B' },
        seasons: [],
        games: [game(1, 'cs', 2), game(2, 'cs', 3)],
        matches: [],
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

  it('leaves every player’s own picks out of the second set of crowns', () => {
    for (const crown of view.tagCrownsWithoutOwnPicks) {
      for (const entry of crown.entries) {
        expect(entry.games.some((g) => g.ownPick)).toBe(false);
      }
    }
    // Tobias chose two of his three racing games (trackmania, wreckfest).
    const racing = view.tagCrownsWithoutOwnPicks.find(
      (c) => c.tag === 'racing',
    )!;
    const tobias = entryOf(racing.entries, 'tobias');
    expect(tobias.outOf).toBeLessThan(3);
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
