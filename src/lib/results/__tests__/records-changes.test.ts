import { describe, it, expect } from 'vitest';
import { assembleAllCareers } from '../derive/career';
import { deriveRecords } from '../derive/records';
import { diffRecords } from '../derive/records/changes';
import { composeRecordsView } from '../compose';
import type {
  CareerBoardRow,
  RecordEntry,
  RecordsView,
  TagCrown,
} from '../view-models';
import { s1Bundle } from './s1.fixtures';
import { s2Bundle } from './s2.fixtures';

/** Oracle: S1 → S1 + S2 (season facts in records.test.ts). */

const options = { minCrownGames: 3 };

const s1 = composeRecordsView(assembleAllCareers([s1Bundle]));
const s1s2 = composeRecordsView(assembleAllCareers([s1Bundle, s2Bundle]));
const diff = diffRecords(s1, s1s2, options);

const holders = (entries: RecordEntry[]) =>
  entries.map((e) => [e.player.slug, e.value]);
const changeOf = (key: string) => diff.records.find((r) => r.key === key);

const viewWith = (fields: Partial<RecordsView>): RecordsView => ({
  ...deriveRecords([]),
  ...fields,
});

const entry = (
  slug: string,
  rank: number,
  value: number,
  outOf?: number,
): RecordEntry => ({
  player: { slug, name: slug },
  rank,
  value,
  outOf,
  games: [],
});

const boardRow = (slug: string, rank: number): CareerBoardRow => ({
  player: { slug, name: slug },
  rank,
  placementPoints: 0,
  placements: [],
  championships: 0,
  gameWins: 0,
  averageGamePlacement: 0,
});

const crown = (entries: RecordEntry[]): TagCrown => ({
  tag: 'racing',
  entries,
});

describe('season changes over the S1 → S2 oracle', () => {
  it('leaves out a cumulative record whose holders only grew their total', () => {
    // Jørgen and Tobias shared most game wins on 3 after S1 and on 5 after S2.
    expect(changeOf('mostGameWins')).toBeUndefined();
  });

  it('extends a streak the same holder already had', () => {
    const streak = changeOf('longestTopThreeStreak')!;
    expect(streak.kind).toBe('improved');
    expect(holders(streak.before)).toEqual([['tobias', 5]]);
    expect(holders(streak.after)).toEqual([['tobias', 10]]);
  });

  it('marks records that had no holder before as new', () => {
    // Power-ups arrived in S2; home advantage needs four own picks.
    expect(changeOf('powerUpPoints')?.kind).toBe('new');
    expect(changeOf('powerUpPoints')?.before).toEqual([]);
    expect(changeOf('homeAdvantage')?.kind).toBe('new');
  });

  it('leaves out records whose holders and figure stayed put', () => {
    expect(changeOf('longestWinStreak')).toBeUndefined();
    expect(changeOf('bestSeason')).toBeUndefined();
  });

  it('reports no board movement when every placement repeated', () => {
    expect(diff.board).toEqual([]);
  });

  it('crowns a category once its holder reaches the minimum sample', () => {
    expect(diff.crowns.every((c) => c.kind === 'new')).toBe(true);
    expect(diff.crowns.map((c) => c.tag)).toContain('racing');
    for (const change of diff.crowns) {
      expect(change.after[0].outOf).toBeGreaterThanOrEqual(3);
    }
  });

  it('is empty when nothing changed', () => {
    expect(diffRecords(s1s2, s1s2, options)).toEqual({
      records: [],
      board: [],
      crowns: [],
    });
  });
});

describe('holder changes', () => {
  const change = (before: RecordEntry[], after: RecordEntry[]) =>
    diffRecords(
      viewWith({ mostGameWins: before }),
      viewWith({ mostGameWins: after }),
      options,
    ).records[0];

  it('calls a record taken when a new holder replaces the old one', () => {
    const c = change(
      [entry('a', 1, 5), entry('b', 2, 4)],
      [entry('b', 1, 6), entry('a', 2, 5)],
    );
    expect(c.kind).toBe('taken');
    expect(holders(c.before)).toEqual([['a', 5]]);
    expect(holders(c.after)).toEqual([['b', 6]]);
  });

  it('calls a record tied when a new co-holder joins every old one', () => {
    const c = change(
      [entry('a', 1, 5), entry('b', 2, 4)],
      [entry('a', 1, 5), entry('b', 1, 5)],
    );
    expect(c.kind).toBe('tied');
    expect(c.after).toHaveLength(2);
  });

  it('calls a record untied when one of its holders pulls clear', () => {
    const c = change(
      [entry('a', 1, 5), entry('b', 1, 5)],
      [entry('a', 1, 6), entry('b', 2, 5)],
    );
    expect(c.kind).toBe('untied');
    expect(holders(c.after)).toEqual([['a', 6]]);
  });

  it('calls a shared record taken when one holder leaves and another joins', () => {
    const c = change(
      [entry('a', 1, 5), entry('b', 1, 5), entry('c', 3, 4)],
      [entry('a', 1, 6), entry('c', 1, 6), entry('b', 3, 5)],
    );
    expect(c.kind).toBe('taken');
  });

  it('never calls a cumulative record improved, only a change of holder', () => {
    for (const key of [
      'mostGameWins',
      'homeTurf',
      'awayWins',
      'winsLeader',
      'totalPoints',
      'powerUpPoints',
    ] as const) {
      const grew = diffRecords(
        viewWith({ [key]: [entry('a', 1, 5), entry('b', 2, 4)] }),
        viewWith({ [key]: [entry('a', 1, 9), entry('b', 2, 8)] }),
        options,
      );
      expect(grew.records).toEqual([]);
      const tied = diffRecords(
        viewWith({ [key]: [entry('a', 1, 5), entry('b', 2, 4)] }),
        viewWith({ [key]: [entry('a', 1, 9), entry('b', 1, 9)] }),
        options,
      );
      expect(tied.records.map((r) => [r.key, r.kind])).toEqual([[key, 'tied']]);
    }
  });

  it('still calls a feat count improved when its holder adds to it', () => {
    const better = diffRecords(
      viewWith({ flawlessGames: [entry('a', 1, 2)] }),
      viewWith({ flawlessGames: [entry('a', 1, 3)] }),
      options,
    );
    expect(better.records.map((r) => [r.key, r.kind])).toEqual([
      ['flawlessGames', 'improved'],
    ]);
  });

  it('ignores the same holder with a worse or equal figure', () => {
    expect(change([entry('a', 1, 5)], [entry('a', 1, 5)])).toBeUndefined();
    const worse = diffRecords(
      viewWith({ bestSeason: [entry('a', 1, 1.5)] }),
      viewWith({ bestSeason: [entry('a', 1, 1.75)] }),
      options,
    );
    expect(worse.records).toEqual([]);
  });

  it('reads a lower average as better', () => {
    const better = diffRecords(
      viewWith({ seasonCloser: [entry('a', 1, 1.75)] }),
      viewWith({ seasonCloser: [entry('a', 1, 1.5)] }),
      options,
    );
    expect(better.records.map((r) => [r.key, r.kind])).toEqual([
      ['seasonCloser', 'improved'],
    ]);
  });

  it('compares averages at the two decimals they are shown with', () => {
    const same = diffRecords(
      viewWith({ seasonCloser: [entry('a', 1, 1.501)] }),
      viewWith({ seasonCloser: [entry('a', 1, 1.499)] }),
      options,
    );
    expect(same.records).toEqual([]);
  });

  it('compares rate records on the rate, not the count', () => {
    // 4 of 5 (80%) → 5 of 8 (63%): more wins, but a worse record.
    const worse = diffRecords(
      viewWith({ matchWins: [entry('a', 1, 4, 5)] }),
      viewWith({ matchWins: [entry('a', 1, 5, 8)] }),
      options,
    );
    expect(worse.records).toEqual([]);
    const better = diffRecords(
      viewWith({ matchWins: [entry('a', 1, 4, 5)] }),
      viewWith({ matchWins: [entry('a', 1, 9, 10)] }),
      options,
    );
    expect(better.records[0].kind).toBe('improved');
  });

  it('marks whether the new figure beats the old one', () => {
    const beaten = change(
      [entry('a', 1, 5), entry('b', 2, 4)],
      [entry('b', 1, 6), entry('a', 2, 5)],
    );
    expect(beaten.better).toBe(true);
    // 3 of 5 (60%) held by a; a drops to 3 of 8 and b leads on 1 of 2 (50%).
    const handedDown = diffRecords(
      viewWith({ matchWins: [entry('a', 1, 3, 5), entry('b', 2, 0, 1)] }),
      viewWith({ matchWins: [entry('b', 1, 1, 2), entry('a', 2, 3, 8)] }),
      options,
    ).records[0];
    expect(handedDown.kind).toBe('taken');
    expect(handedDown.better).toBe(false);
  });

  it('holds the rivalry record by the pair, whichever side leads it', () => {
    const pair = (lead: string, other: string, gap: number): RecordEntry => ({
      ...entry(lead, 1, gap),
      partner: { slug: other, name: other },
    });
    const flipped = diffRecords(
      viewWith({ rivalries: [pair('a', 'b', 1)] }),
      viewWith({ rivalries: [pair('b', 'a', 1)] }),
      options,
    );
    expect(flipped.records).toEqual([]);
    const closer = diffRecords(
      viewWith({ rivalries: [pair('a', 'b', 1)] }),
      viewWith({ rivalries: [pair('b', 'a', 0)] }),
      options,
    );
    expect(closer.records[0].kind).toBe('improved');
  });
});

describe('board movement', () => {
  it('lists rank changes and newcomers, best after-rank first', () => {
    const moves = diffRecords(
      viewWith({
        board: [boardRow('a', 1), boardRow('b', 2), boardRow('c', 3)],
      }),
      viewWith({
        board: [
          boardRow('b', 1),
          boardRow('a', 2),
          boardRow('c', 3),
          boardRow('d', 4),
        ],
      }),
      options,
    ).board;
    expect(moves.map((m) => [m.player.slug, m.before, m.after])).toEqual([
      ['b', 2, 1],
      ['a', 1, 2],
      ['d', null, 4],
    ]);
  });

  it('counts moving into a shared rank as movement, and staying in one as none', () => {
    const moves = diffRecords(
      viewWith({ board: [boardRow('a', 1), boardRow('b', 2)] }),
      viewWith({ board: [boardRow('a', 1), boardRow('b', 1)] }),
      options,
    ).board;
    expect(moves.map((m) => [m.player.slug, m.before, m.after])).toEqual([
      ['b', 2, 1],
    ]);
  });
});

describe('crown changes', () => {
  it('only counts a crown whose holder has the minimum sample', () => {
    const changes = (before: RecordEntry[], after: RecordEntry[]) =>
      diffRecords(
        viewWith({ tagCrowns: [crown(before)] }),
        viewWith({ tagCrowns: [crown(after)] }),
        options,
      ).crowns;

    // Below the minimum after: not a crown yet, so nothing to report.
    expect(changes([], [entry('a', 1, 1, 2)])).toEqual([]);
    // Unranked before, ranked now: a new crown.
    expect(
      changes([entry('a', 1, 1, 2)], [entry('a', 1, 1.5, 3)]).map(
        (c) => c.kind,
      ),
    ).toEqual(['new']);
    // A better average from the same holder is not a crown change.
    expect(changes([entry('a', 1, 2, 3)], [entry('a', 1, 1.5, 4)])).toEqual([]);
    // A new holder is.
    const taken = changes(
      [entry('a', 1, 2, 3), entry('b', 2, 2.5, 4)],
      [entry('b', 1, 1.8, 5), entry('a', 2, 2, 3)],
    );
    expect(taken.map((c) => [c.tag, c.kind])).toEqual([['racing', 'taken']]);
  });
});
