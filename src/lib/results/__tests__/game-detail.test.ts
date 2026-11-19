import { describe, it, expect } from 'vitest';
import type { RoundsBundle, SeasonBundle } from '../raw';
import type {
  BracketStageView,
  RoundRobinStageView,
  RoundsStageView,
} from '../view-models';
import { assembleGameDetail, gameRoundsStageIds } from '../derive/game-detail';
import { rankPoints } from '../derive/rounds';
import { s1Bundle, slugBySeasonPlayerId } from './s1.fixtures';

/*
 * Real seeded stage data (supabase/seed.sql), hung on S1's games so the
 * fixture has a roster and confirmed results. Hosts: sjakk and OSRS carry
 * their own data; skyrim carries S4 Ratz Instagib, pokemon S3 War Thunder's
 * bracket, trackmania S2 Total War, tetris S4 Trombone Champ's finals.
 */

const TS = '2026-10-03T22:11:45+00:00';
const sp = Object.fromEntries(
  Object.entries(slugBySeasonPlayerId).map(([id, slug]) => [slug, id]),
) as Record<'jakob' | 'jorgen' | 'tobias' | 'william', string>;
const gameId = (slug: string) =>
  s1Bundle.games.find((g) => g.slug === slug)!.id;

type Name = keyof typeof sp;
type Kind = SeasonBundle['stages'][number]['kind'];

const stages: SeasonBundle['stages'] = [];
const matches: SeasonBundle['matches'] = [];
const matchGames: SeasonBundle['matchGames'] = [];
const rounds: RoundsBundle['rounds'] = [];
const roundResults: RoundsBundle['roundResults'] = [];

function stage(
  game: string,
  ordinal: number,
  kind: Kind,
  aggregation: 'sum' | 'rank-then-sum' | null = null,
) {
  const id = `${game}-stage-${ordinal}`;
  stages.push({ id, game_id: gameId(game), ordinal, kind, aggregation });
  return id;
}

let matchSeq = 0;
function match(
  stageId: string,
  slot: string | null,
  len: 'bo1' | 'bo3' | 'bo5',
  a: Name,
  b: Name,
  scoresA: number[],
  scoresB: number[],
  leg = 1,
) {
  const id = `match-${++matchSeq}`;
  matches.push({
    id,
    stage_id: stageId,
    slot_id: slot,
    series_len: len,
    player_a: sp[a],
    player_b: sp[b],
    leg,
  });
  scoresA.forEach((scoreA, i) =>
    matchGames.push({
      match_id: id,
      game_number: i + 1,
      score_a: scoreA,
      score_b: scoresB[i],
      tiebreak_winner: null,
      created_at: TS,
      updated_at: TS,
    }),
  );
}

let roundSeq = 0;
function round(stageId: string, label: string, scores: Record<Name, number>) {
  const id = `round-${++roundSeq}`;
  rounds.push({
    id,
    stage_id: stageId,
    ordinal: rounds.filter((r) => r.stage_id === stageId).length + 1,
    label,
  });
  for (const [name, raw] of Object.entries(scores)) {
    roundResults.push({
      round_id: id,
      season_player_id: sp[name as Name],
      raw_score: raw,
      created_at: TS,
      updated_at: TS,
    });
  }
}

// S1 Sjakk: round-robin → single-elim, win-loss bo1.
let s = stage('sjakk', 1, 'round-robin');
match(s, null, 'bo1', 'tobias', 'jakob', [1], [0]);
match(s, null, 'bo1', 'jorgen', 'william', [1], [0]);
match(s, null, 'bo1', 'jorgen', 'jakob', [1], [0]);
match(s, null, 'bo1', 'tobias', 'william', [1], [0]);
match(s, null, 'bo1', 'jakob', 'william', [1], [0]);
match(s, null, 'bo1', 'tobias', 'jorgen', [1], [0]);
s = stage('sjakk', 2, 'single-elim');
match(s, 'SF1', 'bo1', 'tobias', 'william', [1], [0]);
match(s, 'SF2', 'bo1', 'jorgen', 'jakob', [1], [0]);
match(s, 'BR', 'bo1', 'jakob', 'william', [1], [0]);
match(s, 'F', 'bo1', 'jorgen', 'tobias', [1], [0]);

// S1 OSRS: rounds, sum; Jakob and Jørgen level on 13.
s = stage('old-school-runescape', 1, 'rounds', 'sum');
round(s, 'Runde 1', { jakob: 6, jorgen: 4, tobias: 2, william: 1 });
round(s, 'Runde 2', { jakob: 1, jorgen: 6, tobias: 4, william: 2 });
round(s, 'Runde 3', { jakob: 6, jorgen: 3, tobias: 1, william: 3 });

// S4 Ratz Instagib: rank-then-sum with ties in matches 2 and 5.
s = stage('the-elder-scrolls-v-skyrim', 1, 'rounds', 'rank-then-sum');
round(s, 'Match 1', { jakob: 50, jorgen: 34, tobias: 43, william: 35 });
round(s, 'Match 2', { jakob: 45, jorgen: 31, tobias: 45, william: 51 });
round(s, 'Match 3', { jakob: 48, jorgen: 24, tobias: 39, william: 34 });
round(s, 'Match 4', { jakob: 41, jorgen: 32, tobias: 58, william: 50 });
round(s, 'Match 5', { jakob: 48, jorgen: 23, tobias: 38, william: 23 });
round(s, 'Match 6', { jakob: 44, jorgen: 29, tobias: 49, william: 63 });

// S3 War Thunder: series stored as one row; GF and GF2 are leg 2 and 3.
s = stage('pokemon-showdown', 1, 'double-elim-reset');
match(s, 'WB-SF1', 'bo3', 'jakob', 'william', [2], [0]);
match(s, 'WB-SF2', 'bo3', 'tobias', 'jorgen', [2], [0]);
match(s, 'WB-F', 'bo3', 'tobias', 'jakob', [2], [1]);
match(s, 'LB-R1', 'bo3', 'jorgen', 'william', [2], [0]);
match(s, 'LB-F', 'bo5', 'jakob', 'jorgen', [3], [0]);
match(s, 'GF', 'bo5', 'jakob', 'tobias', [3], [0], 2);
match(s, 'GF2', 'bo5', 'jakob', 'tobias', [3], [0], 3);

// S2 Total War: the winners-side survivor won GF, so GF2 was not played.
s = stage('trackmania', 1, 'double-elim-reset');
match(s, 'WB-SF1', 'bo1', 'jakob', 'william', [1], [0]);
match(s, 'WB-SF2', 'bo1', 'tobias', 'jorgen', [1], [0]);
match(s, 'WB-F', 'bo1', 'jakob', 'tobias', [1], [0]);
match(s, 'LB-R1', 'bo1', 'jorgen', 'william', [1], [0]);
match(s, 'LB-F', 'bo1', 'tobias', 'jorgen', [1], [0], 2);
match(s, 'GF', 'bo1', 'jakob', 'tobias', [1], [0], 2);

// S4 Trombone finals: bo3 with real song scores per game.
s = stage('tetris', 2, 'final-bronze');
match(
  s,
  'BR',
  'bo3',
  'jorgen',
  'william',
  [4476780, 8216200, 4743920],
  [3894250, 8247330, 3596130],
);
match(
  s,
  'F',
  'bo3',
  'tobias',
  'jakob',
  [11647874, 7223040],
  [9874820, 5641210],
);

const bundle: SeasonBundle = { ...s1Bundle, stages, matches, matchGames };
const roundsBundle: RoundsBundle = { rounds, roundResults };
const detail = (slug: string) => assembleGameDetail(bundle, roundsBundle, slug);
const names = (refs: { slug: string }[]) => refs.map((r) => r.slug);

describe('rankPoints', () => {
  it('gives a tie the higher points (competition ranking)', () => {
    expect(rankPoints([45, 31, 45, 51])).toEqual([3, 1, 3, 4]);
    expect(rankPoints([48, 23, 38, 23])).toEqual([4, 2, 3, 2]);
  });
});

describe('assembleGameDetail', () => {
  it('returns no stages for a game not in the DB', () => {
    expect(detail('no-such-game')).toEqual({ results: [], stages: [] });
  });

  it('returns no stages for a game without confirmed results', () => {
    const unconfirmed = {
      ...bundle,
      gameResults: bundle.gameResults.filter(
        (r) => r.game_id !== gameId('sjakk'),
      ),
    };
    expect(
      assembleGameDetail(unconfirmed, roundsBundle, 'sjakk').stages,
    ).toEqual([]);
    expect(gameRoundsStageIds(unconfirmed, 'sjakk')).toEqual([]);
    expect(gameRoundsStageIds(unconfirmed, 'old-school-runescape')).toEqual([
      'old-school-runescape-stage-1',
    ]);
  });

  it('builds the round-robin record and the bracket in stage order', () => {
    const [rr, bracket] = detail('sjakk').stages as [
      RoundRobinStageView,
      BracketStageView,
    ];
    expect(rr.kind).toBe('round-robin');
    expect(
      rr.standings.map((r) => [r.player.slug, r.wins, r.losses, r.rank]),
    ).toEqual([
      ['tobias', 3, 0, 1],
      ['jorgen', 2, 1, 2],
      ['jakob', 1, 2, 3],
      ['william', 0, 3, 4],
    ]);
    expect(rr.matches).toHaveLength(6);
    expect(rr.matches[0].score).toEqual({ a: 1, b: 0, byTiebreak: false });

    expect(bracket.kind).toBe('single-elim');
    expect(bracket.slots.map((x) => x.slotId)).toEqual([
      'SF1',
      'SF2',
      'F',
      'BR',
    ]);
    const final = bracket.slots.find((x) => x.slotId === 'F')!.match!;
    expect(final.winner === 'a' ? final.playerA.slug : final.playerB.slug).toBe(
      'jorgen',
    );
  });

  it('sums rounds and orders level totals by final placement', () => {
    const [rounds] = detail('old-school-runescape').stages as [RoundsStageView];
    expect(names(rounds.players)).toEqual([
      'jorgen',
      'jakob',
      'tobias',
      'william',
    ]);
    expect(rounds.totals).toEqual([13, 13, 7, 6]);
    expect(rounds.rounds.map((r) => r.label)).toEqual([
      'Runde 1',
      'Runde 2',
      'Runde 3',
    ]);
    expect(rounds.rounds[0].cells[0]).toEqual({ raw: 4, rankPoints: null });
  });

  it('awards rank points per round for rank-then-sum (Ratz totals)', () => {
    const [rounds] = detail('the-elder-scrolls-v-skyrim').stages as [
      RoundsStageView,
    ];
    const totals = Object.fromEntries(
      rounds.players.map((p, i) => [p.slug, rounds.totals[i]]),
    );
    expect(totals).toEqual({ jakob: 19, jorgen: 7, tobias: 19, william: 17 });
    const match2 = rounds.rounds[1].cells;
    const jakob = rounds.players.findIndex((p) => p.slug === 'jakob');
    expect(match2[jakob]).toEqual({ raw: 45, rankPoints: 3 });
  });

  it('reads one-row series and places rematches by slot (War Thunder)', () => {
    const [bracket] = detail('pokemon-showdown').stages as [BracketStageView];
    const slot = (id: string) =>
      bracket.slots.find((x) => x.slotId === id)!.match!;
    expect(slot('WB-F')).toMatchObject({
      winsA: 2,
      winsB: 1,
      winner: 'a',
      games: null,
    });
    expect(slot('GF')).toMatchObject({ leg: 2, winsA: 3, winsB: 0 });
    expect(slot('GF2')).toMatchObject({ leg: 3, bestOf: 5 });
    expect(bracket.decider).toBe('GF2');
  });

  it('keeps an unplayed grand-final reset as an empty slot (Total War)', () => {
    const [bracket] = detail('trackmania').stages as [BracketStageView];
    expect(bracket.slots.map((x) => x.slotId)).toContain('GF2');
    expect(bracket.slots.find((x) => x.slotId === 'GF2')!.match).toBeNull();
    expect(bracket.decider).toBe('GF');
  });

  it('keeps per-game scores for series with real scores (Trombone)', () => {
    const [bracket] = detail('tetris').stages as [BracketStageView];
    const bronze = bracket.slots.find((x) => x.slotId === 'BR')!.match!;
    expect(bronze).toMatchObject({ winsA: 2, winsB: 1, winner: 'a' });
    expect(bronze.games!.map((g) => g.winner)).toEqual(['a', 'b', 'a']);
    expect(bracket.slots.map((x) => x.slotId)).toEqual(['F', 'BR']);
  });

  it('throws on a slot the bracket template does not have', () => {
    const bad: SeasonBundle = {
      ...bundle,
      matches: bundle.matches.map((m) =>
        m.slot_id === 'SF1' ? { ...m, slot_id: 'LB-R1-1' } : m,
      ),
    };
    expect(() => assembleGameDetail(bad, roundsBundle, 'sjakk')).toThrow(
      /LB-R1-1/,
    );
  });
});
