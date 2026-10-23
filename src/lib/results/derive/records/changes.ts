import type {
  BoardMove,
  CrownChange,
  HolderChangeKind,
  RecordChange,
  RecordEntry,
  RecordKey,
  RecordsDiff,
  RecordsView,
} from '../../view-models';
import { shown } from './helpers';

/*
 * PURE. A record's or crown's HOLDERS are its rank-1 entries, so a change in
 * who shares a tie is a change (see `HolderChangeKind`).
 */

/**
 * Which way a record's figure is better, for the `improved` check:
 * `higher`/`lower` compare `value`; `rate` compares `value / outOf`, because
 * those records rank on the share and `value` is only the numerator.
 *
 * Listed in `RecordsView` field order, which is the order changes come out in.
 * `satisfies` makes a new record field fail the build until it is listed here.
 */
const MEASURES = {
  mostGameWins: 'higher',
  bestSeason: 'lower',
  longestWinStreak: 'higher',
  longestTopTwoStreak: 'higher',
  longestTopThreeStreak: 'higher',
  homeTurf: 'higher',
  awayWins: 'higher',
  titleSpecialist: 'higher',
  tiebreaks: 'rate',
  matchWins: 'rate',
  matchSweeps: 'rate',
  matchDeciders: 'rate',
  finals: 'rate',
  flawlessGames: 'higher',
  opponentStreak: 'higher',
  homeAdvantage: 'higher',
  seasonCloser: 'lower',
  seasonOpener: 'lower',
  winsLeader: 'higher',
  rivalries: 'lower',
  totalPoints: 'higher',
  powerUpPoints: 'higher',
} as const satisfies Record<RecordKey, 'higher' | 'lower' | 'rate'>;

type Measure = (typeof MEASURES)[RecordKey];

/**
 * Career running totals grow for their holder almost every season, so a bigger
 * figure from the same holder is no news: these are never `improved`. Counts
 * of a specific feat, streaks, averages and rates don't belong here — a better
 * figure there is an event.
 */
const CUMULATIVE: ReadonlySet<RecordKey> = new Set<RecordKey>([
  'mostGameWins',
  'homeTurf',
  'awayWins',
  'winsLeader',
  'totalPoints',
  'powerUpPoints',
]);

/** The pair record is held by the PAIR, whichever of the two leads it. */
function holderKey(entry: RecordEntry): string {
  if (!entry.partner) return entry.player.slug;
  return [entry.player.slug, entry.partner.slug].sort().join('+');
}

const holdersOf = (entries: RecordEntry[]) =>
  entries.filter((e) => e.rank === 1);

/** Null when the holder set is unchanged or empty after. */
function holderChange(
  before: RecordEntry[],
  after: RecordEntry[],
): Exclude<HolderChangeKind, 'improved'> | null {
  if (after.length === 0) return null;
  if (before.length === 0) return 'new';

  const was = new Set(before.map(holderKey));
  const is = new Set(after.map(holderKey));
  const gained = [...is].some((key) => !was.has(key));
  const lost = [...was].some((key) => !is.has(key));

  if (gained && lost) return 'taken';
  if (gained) return 'tied';
  if (lost) return 'untied';
  return null;
}

/**
 * The figure a record compares, at the precision /records shows it (two
 * decimals; a whole percentage for rates), so an `improved` is always visible.
 */
function figure(entry: RecordEntry, measure: Measure): number {
  if (measure === 'rate') {
    return Math.round((entry.value / (entry.outOf || 1)) * 100);
  }
  return shown(entry.value, 2);
}

function isBetter(after: RecordEntry, before: RecordEntry, measure: Measure) {
  const a = figure(after, measure);
  const b = figure(before, measure);
  return measure === 'lower' ? a < b : a > b;
}

function recordChanges(before: RecordsView, after: RecordsView) {
  const changes: RecordChange[] = [];
  for (const key of Object.keys(MEASURES) as RecordKey[]) {
    const was = holdersOf(before[key]);
    const is = holdersOf(after[key]);
    const kind =
      holderChange(was, is) ??
      (is.length > 0 &&
      !CUMULATIVE.has(key) &&
      isBetter(is[0], was[0], MEASURES[key])
        ? 'improved'
        : null);
    const better =
      was.length > 0 && is.length > 0 && isBetter(is[0], was[0], MEASURES[key]);
    if (kind) changes.push({ key, kind, before: was, after: is, better });
  }
  return changes;
}

/** Includes newcomers to the board. */
function boardMoves(before: RecordsView, after: RecordsView): BoardMove[] {
  const rankBefore = new Map(before.board.map((r) => [r.player.slug, r.rank]));
  return after.board
    .map((row) => ({
      player: row.player,
      before: rankBefore.get(row.player.slug) ?? null,
      after: row.rank,
    }))
    .filter((move) => move.before !== move.after);
}

/**
 * A crown only counts once its holder has `minCrownGames` games under the tag,
 * so a crown that was unranked before is `new`.
 */
function crownChanges(
  before: RecordsView,
  after: RecordsView,
  minCrownGames: number,
): CrownChange[] {
  const rankedHolders = (entries: RecordEntry[] | undefined) => {
    const holders = holdersOf(entries ?? []);
    return (holders[0]?.outOf ?? 0) >= minCrownGames ? holders : [];
  };
  const crownBefore = new Map(before.tagCrowns.map((c) => [c.tag, c.entries]));

  return after.tagCrowns.flatMap((crown) => {
    const was = rankedHolders(crownBefore.get(crown.tag));
    const is = rankedHolders(crown.entries);
    const kind = holderChange(was, is);
    return kind ? [{ tag: crown.tag, kind, before: was, after: is }] : [];
  });
}

export interface DiffOptions {
  minCrownGames: number;
}

export function diffRecords(
  before: RecordsView,
  after: RecordsView,
  { minCrownGames }: DiffOptions,
): RecordsDiff {
  return {
    records: recordChanges(before, after),
    board: boardMoves(before, after),
    crowns: crownChanges(before, after, minCrownGames),
  };
}
