import type {
  PairCategory,
  PairGame,
  PairMatch,
  PairMatchTally,
  PairSeason,
  PairSide,
  PairStats,
  PairTally,
  RecordsPlayerInput,
} from '../view-models';
import type { Tag } from '@/types/tag';
import { gameKey, groupBy, seasonRef } from './records/helpers';
import { longestStreak } from './records/streaks';

/**
 * PURE. Everything /vs says about one pair, from the same per-player rows the
 * records read (game and match rows with title, tags and own-pick flag already
 * joined in compose). Every figure is over what the two shared: games both
 * played, seasons both finished, matches against each other.
 *
 * Nothing is normalised across seasons: the counts are of placements (who
 * finished ahead), and the only points figure is a margin WITHIN one season.
 *
 * Returns null when the two never shared a game (or are the same player).
 */
export function derivePair(
  a: RecordsPlayerInput,
  b: RecordsPlayerInput,
): PairStats | null {
  if (a.player.slug === b.player.slug) return null;

  const games = sharedGames(a, b);
  if (games.length === 0) return null;

  const seasons = sharedSeasons(a, b, games);
  const matches = pairMatches(a, b);

  return {
    a: a.player,
    b: b.player,
    seasons,
    seasonsAhead: {
      a: seasons.filter((s) => s.ahead === 'a').length,
      b: seasons.filter((s) => s.ahead === 'b').length,
    },
    finishedAhead: tally(games),
    matches: {
      ...matchTally(matches),
      byBestOf: [...groupBy(matches, (m) => m.bestOf)]
        .sort(([x], [y]) => x - y)
        .map(([bestOf, group]) => ({ bestOf, ...matchTally(group) })),
    },
    matchRuns: {
      current: currentMatchRun(matches),
      longest: {
        a: longestStreak(matches, (m) => m.winner === 'a'),
        b: longestStreak(matches, (m) => m.winner === 'b'),
      },
    },
    gameRuns: {
      current: currentGameRun(games),
      longest: {
        a: longestStreak(games, (g) => aheadIn(g) === 'a'),
        b: longestStreak(games, (g) => aheadIn(g) === 'b'),
      },
    },
    picks: {
      a: tally(games.filter((g) => g.pickedBy === 'a')),
      b: tally(games.filter((g) => g.pickedBy === 'b')),
      others: tally(games.filter((g) => g.pickedBy === null)),
    },
    categories: categories(games),
    moments: {
      bestSeason: {
        a: bestSeason(seasons, 'a'),
        b: bestSeason(seasons, 'b'),
      },
    },
  };
}

/** Every game both played, in the first player's play order. */
function sharedGames(a: RecordsPlayerInput, b: RecordsPlayerInput): PairGame[] {
  const theirs = new Map(b.games.map((g) => [gameKey(g), g]));
  return a.games.flatMap((mine): PairGame[] => {
    const other = theirs.get(gameKey(mine));
    if (!other) return [];
    return [
      {
        seasonNumber: mine.seasonNumber,
        seasonSlug: mine.seasonSlug,
        gameSlug: mine.gameSlug,
        gameTitle: mine.gameTitle,
        ordinal: mine.ordinal,
        a: mine.placement,
        b: other.placement,
        tags: mine.tags,
        pickedBy: mine.ownPick ? 'a' : other.ownPick ? 'b' : null,
      },
    ];
  });
}

/** Who finished ahead over `games`; equal placements count as level. */
function tally(games: PairGame[]): PairTally {
  return {
    a: games.filter((g) => g.a < g.b).length,
    b: games.filter((g) => g.b < g.a).length,
    level: games.filter((g) => g.a === g.b).length,
    games,
  };
}

/** One row per season both have a final standing in, ascending. */
function sharedSeasons(
  a: RecordsPlayerInput,
  b: RecordsPlayerInput,
  games: PairGame[],
): PairSeason[] {
  const theirs = new Map(b.seasons.map((s) => [s.seasonNumber, s]));
  return a.seasons.flatMap((mine): PairSeason[] => {
    const other = theirs.get(mine.seasonNumber);
    if (!other) return [];
    return [
      {
        season: seasonRef(mine),
        a: { placement: mine.placement, totalPoints: mine.totalPoints },
        b: { placement: other.placement, totalPoints: other.totalPoints },
        // The stored placement decides, never the points: a points tie has
        // already been settled there.
        ahead:
          mine.placement === other.placement
            ? null
            : mine.placement < other.placement
              ? 'a'
              : 'b',
        tally: tally(games.filter((g) => g.seasonNumber === mine.seasonNumber)),
      },
    ];
  });
}

/** The two players' matches against each other, in play order. */
function pairMatches(
  a: RecordsPlayerInput,
  b: RecordsPlayerInput,
): PairMatch[] {
  return a.matches
    .filter((m) => m.opponent.slug === b.player.slug)
    .map((m) => ({
      seasonNumber: m.seasonNumber,
      seasonSlug: m.seasonSlug,
      gameSlug: m.gameSlug,
      gameTitle: m.gameTitle,
      bestOf: m.bestOf,
      a: m.gamesWon,
      b: m.gamesLost,
      winner: m.won ? 'a' : 'b',
      slotId: m.slotId,
    }));
}

/** One match counts as one, whatever its length. */
function matchTally(matches: PairMatch[]): PairMatchTally {
  return {
    a: matches.filter((m) => m.winner === 'a').length,
    b: matches.filter((m) => m.winner === 'b').length,
    matches,
  };
}

/** Who finished ahead in a shared game; null when the two placed level. */
const aheadIn = (game: PairGame): PairSide | null =>
  game.a === game.b ? null : game.a < game.b ? 'a' : 'b';

/**
 * The unbroken run that ends with the last item: who it belongs to and the
 * items in it. Null when the list is empty or its last item has no side.
 */
function trailingRun<T>(
  items: T[],
  sideOf: (item: T) => PairSide | null,
): { side: PairSide; run: T[] } | null {
  const last = items[items.length - 1];
  const side = last === undefined ? null : sideOf(last);
  if (side === null) return null;
  let start = items.length - 1;
  while (start > 0 && sideOf(items[start - 1]) === side) start -= 1;
  return { side, run: items.slice(start) };
}

/** The unbroken run of match wins that ends with their latest match. */
function currentMatchRun(
  matches: PairMatch[],
): { side: PairSide; matches: PairMatch[] } | null {
  const trailing = trailingRun(matches, (m) => m.winner);
  return trailing && { side: trailing.side, matches: trailing.run };
}

/** The unbroken run of games finished ahead that ends with their latest. */
function currentGameRun(
  games: PairGame[],
): { side: PairSide; games: PairGame[] } | null {
  const trailing = trailingRun(games, aheadIn);
  return trailing && { side: trailing.side, games: trailing.run };
}

/**
 * One tally per tag over the shared games carrying it, the most level first
 * (smallest gap), then the larger sample, then the tag name for determinism.
 */
function categories(games: PairGame[]): PairCategory[] {
  const byTag = new Map<Tag, PairGame[]>();
  for (const game of games) {
    for (const tag of game.tags) {
      byTag.set(tag, [...(byTag.get(tag) ?? []), game]);
    }
  }
  return [...byTag]
    .map(([tag, tagged]) => ({ tag, tally: tally(tagged) }))
    .sort(
      (x, y) =>
        Math.abs(x.tally.a - x.tally.b) - Math.abs(y.tally.a - y.tally.b) ||
        y.tally.games.length - x.tally.games.length ||
        x.tag.localeCompare(y.tag),
    );
}

/**
 * The season `side` finished ahead in with the largest points margin over the
 * other (the later season when two margins are equal). Null when `side` never
 * finished a season ahead.
 */
function bestSeason(seasons: PairSeason[], side: PairSide): PairSeason | null {
  const other: PairSide = side === 'a' ? 'b' : 'a';
  const margin = (s: PairSeason) => s[side].totalPoints - s[other].totalPoints;

  let best: PairSeason | null = null;
  for (const season of seasons) {
    if (season.ahead !== side) continue;
    if (!best || margin(season) >= margin(best)) best = season;
  }
  return best;
}
