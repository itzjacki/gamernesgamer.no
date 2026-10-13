import type {
  RecordEntry,
  RecordMatchLine,
  RecordMatchRow,
  RecordsPlayerInput,
  RecordsView,
} from '../../view-models';
import { gameKey, groupBy } from './helpers';
import { byRateDesc, byValueDesc, rankEntries, withoutZeros } from './rank';
import { longestStreak } from './streaks';

/**
 * PURE. The records built on head-to-head MATCHES (as opposed to a game's final
 * placements): win rate, sweeps, deciders, finals, flawless tournaments and the
 * longest run over one opponent. Matches arrive decided and in play order (see
 * `derive/matches.ts`), with the game's title already joined.
 */

/** Series that went the distance, before a player has a deciding-game record. */
const MIN_DECIDERS = 3;
/** Finals reached before a player has a finals record. */
const MIN_FINALS = 3;
/** Matches a player must have played in a game for it to count as flawless. */
const MIN_FLAWLESS_MATCHES = 3;
/** Final slots, least to most decisive: a reset grand final settles the game. */
const FINAL_SLOTS = ['F', 'GF', 'GF2'];

/** One line per game for a set of matches: how many of them `hits`. */
function linesPerGame(
  pool: RecordMatchRow[],
  hits: (match: RecordMatchRow) => boolean,
): RecordMatchLine[] {
  return [...groupBy(pool, gameKey).values()].map((matches) => ({
    seasonNumber: matches[0].seasonNumber,
    seasonSlug: matches[0].seasonSlug,
    gameSlug: matches[0].gameSlug,
    gameTitle: matches[0].gameTitle,
    count: matches.filter(hits).length,
    outOf: matches.length,
  }));
}

/**
 * A share-of-matches record: among the matches `select` picks (`outOf`), how
 * many `hits` (`value`). Ranked on the rate, then the larger sample. Players
 * with fewer than `minimum` selected matches are left out. `matchLines` breaks
 * it down per game.
 */
function matchRate(
  players: RecordsPlayerInput[],
  select: (matches: RecordMatchRow[]) => RecordMatchRow[],
  hits: (match: RecordMatchRow) => boolean,
  minimum = 1,
): RecordEntry[] {
  const entries = players.flatMap(({ player, matches }) => {
    const pool = select(matches);
    if (pool.length < minimum) return [];
    return [
      {
        player,
        value: pool.filter(hits).length,
        outOf: pool.length,
        matchLines: linesPerGame(pool, hits),
        games: [],
      },
    ];
  });
  return rankEntries(entries, byRateDesc);
}

/**
 * The match that settled each final a player reached: one per game. A final is
 * slot `F`; in a double elimination it is the grand final, and when that was
 * reset (`GF2`) the reset is the match that counts.
 */
function decidingFinals(matches: RecordMatchRow[]): RecordMatchRow[] {
  const byGame = new Map<string, RecordMatchRow>();
  for (const match of matches) {
    const weight = FINAL_SLOTS.indexOf(match.slotId ?? '');
    if (weight < 0) continue;
    const key = gameKey(match);
    const current = byGame.get(key);
    if (!current || weight > FINAL_SLOTS.indexOf(current.slotId ?? '')) {
      byGame.set(key, match);
    }
  }
  return [...byGame.values()];
}

/**
 * Head-to-head games in which the player won every match they played, given at
 * least MIN_FLAWLESS_MATCHES of them (a lone final is not a tournament). Ranked
 * on the count; ties share the rank.
 */
function flawlessGames(players: RecordsPlayerInput[]): RecordEntry[] {
  const entries = players.map(({ player, matches }) => {
    const flawless = linesPerGame(matches, (m) => m.won).filter(
      (line) => line.outOf >= MIN_FLAWLESS_MATCHES && line.count === line.outOf,
    );
    return {
      player,
      value: flawless.length,
      matchLines: flawless,
      games: [],
    };
  });
  return rankEntries(withoutZeros(entries), byValueDesc);
}

/**
 * Each player's longest run of consecutive match wins over one opponent.
 * Matches arrive in play order (season, game, stage, leg), which is exactly
 * the order one pair met in. Between two equally long runs the later one wins.
 */
function opponentStreak(players: RecordsPlayerInput[]): RecordEntry[] {
  const entries = players.flatMap(({ player, matches }) => {
    const opponents = groupBy(matches, (m) => m.opponent.slug);

    let best: RecordMatchRow[] = [];
    for (const meetings of opponents.values()) {
      const run = longestStreak(meetings, (m) => m.won);
      const later =
        run.length === best.length &&
        run.length > 0 &&
        run[run.length - 1].seasonNumber > best[best.length - 1].seasonNumber;
      if (run.length > best.length || later) best = run;
    }
    if (best.length === 0) return [];

    return [
      {
        player,
        value: best.length,
        opponent: best[0].opponent,
        matches: best,
        games: [],
      },
    ];
  });
  return rankEntries(entries, byValueDesc);
}

export function deriveMatchRecords(
  players: RecordsPlayerInput[],
): Pick<
  RecordsView,
  | 'matchWins'
  | 'matchSweeps'
  | 'matchDeciders'
  | 'finals'
  | 'flawlessGames'
  | 'opponentStreak'
> {
  return {
    matchWins: matchRate(
      players,
      (matches) => matches,
      (m) => m.won,
    ),
    // A sweep needs a series: a bo1 win is always "to nil".
    matchSweeps: matchRate(
      players,
      (matches) => matches.filter((m) => m.bestOf > 1),
      (m) => m.won && m.gamesLost === 0,
    ),
    // A decider is a series that used every game it could: 2–1 or 3–2.
    matchDeciders: matchRate(
      players,
      (matches) =>
        matches.filter(
          (m) => m.bestOf > 1 && m.gamesWon + m.gamesLost === m.bestOf,
        ),
      (m) => m.won,
      MIN_DECIDERS,
    ),
    finals: matchRate(players, decidingFinals, (m) => m.won, MIN_FINALS),
    flawlessGames: flawlessGames(players),
    opponentStreak: opponentStreak(players),
  };
}
