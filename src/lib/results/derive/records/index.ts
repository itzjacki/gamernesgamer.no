import type {
  RecordEntry,
  RecordGameRow,
  RecordMatchLine,
  RecordMatchRow,
  RecordSeason,
  RecordTiebreak,
  RecordsPlayerInput,
  RecordsView,
  TagCrown,
} from '../../view-models';
import type { Tag } from '@/types/tag';
import { deriveTagStats } from '../career/tags';
import { deriveCareerBoard } from './board';
import { byValueDesc, rankEntries, type UnrankedEntry } from './rank';
import { longestStreak } from './streaks';

/**
 * PURE. Every record on /records, from all players' careers. No IO, and no
 * static data: each game row arrives with its title, tags and own-pick flag
 * already joined (compose does that), the same arrangement as `deriveTagStats`.
 *
 * Placements are read, never re-derived. Every record is a best-first list
 * with shared ranks (see `rankEntries`). Count records drop players whose count
 * is zero — a record names who did something, not who didn't.
 */

/** A title must have been played this often before it can have a specialist. */
const MIN_TITLE_GAMES = 2;

/** Series that went the distance, before a player has a deciding-game record. */
const MIN_DECIDERS = 3;
/** Finals reached before a player has a finals record. */
const MIN_FINALS = 3;
/** Matches a player must have played in a game for it to count as flawless. */
const MIN_FLAWLESS_MATCHES = 3;
/** Own picks before a home advantage means anything. */
const MIN_OWN_PICKS = 4;
/** Seasons played before a first- or last-game average means anything. */
const MIN_EDGE_SEASONS = 3;
/** Final slots, least to most decisive: a reset grand final settles the game. */
const FINAL_SLOTS = ['F', 'GF', 'GF2'];

const isWin = (game: { placement: number }) => game.placement === 1;
const wins = (games: readonly { placement: number }[]) =>
  games.filter(isWin).length;
const mean = (games: readonly { placement: number }[]) =>
  games.reduce((sum, g) => sum + g.placement, 0) / games.length;

/** An average at the precision it is displayed with, so what reads equal ties. */
const shown = (average: number, decimals: number) =>
  Number(average.toFixed(decimals));

/** `value` as a share of `outOf`, higher first; then the larger sample. */
const byRateDesc = (a: UnrankedEntry, b: UnrankedEntry) =>
  b.value / (b.outOf || 1) - a.value / (a.outOf || 1) ||
  (b.outOf ?? 0) - (a.outOf ?? 0);

const withoutZeros = (entries: UnrankedEntry[]) =>
  entries.filter((e) => e.value > 0);

/** Wins among the games `counts` selects; `outOf` is how many it selected. */
function winCount(
  players: RecordsPlayerInput[],
  counts: (game: RecordGameRow) => boolean,
): RecordEntry[] {
  const entries = players.map(({ player, games }) => {
    const pool = games.filter(counts);
    const won = pool.filter(isWin);
    return { player, value: won.length, outOf: pool.length, games: won };
  });
  return rankEntries(withoutZeros(entries), byValueDesc);
}

function streak(
  players: RecordsPlayerInput[],
  qualifies: (game: RecordGameRow) => boolean,
): RecordEntry[] {
  const entries = players.map(({ player, games }) => {
    const run = longestStreak(games, qualifies);
    return { player, value: run.length, games: run };
  });
  return rankEntries(withoutZeros(entries), byValueDesc);
}

/**
 * Each player's best single season: the lowest average game placement (compared
 * at the two decimals it is shown with), then more game wins, then the earlier
 * season. Players are then ranked against each other on the same two keys.
 */
function bestSeason(players: RecordsPlayerInput[]): RecordEntry[] {
  const compare = (a: UnrankedEntry, b: UnrankedEntry) =>
    shown(a.value, 2) - shown(b.value, 2) || wins(b.games) - wins(a.games);

  const entries = players.flatMap(({ player, seasons, games }) => {
    const candidates = seasons
      .map((season) => {
        const played = games.filter(
          (g) => g.seasonNumber === season.seasonNumber,
        );
        return {
          player,
          value: played.length > 0 ? mean(played) : 0,
          outOf: played.length,
          season: {
            seasonNumber: season.seasonNumber,
            seasonSlug: season.seasonSlug,
          },
          games: played,
        };
      })
      .filter((c) => c.games.length > 0)
      .sort(
        (a, b) =>
          compare(a, b) || a.season.seasonNumber - b.season.seasonNumber,
      );
    return candidates.slice(0, 1);
  });

  return rankEntries(entries, compare);
}

/**
 * Most wins at one title, counting every instance of it (CS:GO and CS2 are one
 * title). Each player enters with their best title: more wins, then fewer games
 * (the better rate), then title name. Ranked on wins, then rate.
 */
function titleSpecialist(players: RecordsPlayerInput[]): RecordEntry[] {
  const compare = (a: UnrankedEntry, b: UnrankedEntry) =>
    b.value - a.value || (a.outOf ?? 0) - (b.outOf ?? 0);

  const entries = players.flatMap(({ player, games }) => {
    const byTitle = new Map<string, RecordGameRow[]>();
    for (const game of games) {
      byTitle.set(game.titleId, [...(byTitle.get(game.titleId) ?? []), game]);
    }

    const candidates = [...byTitle.values()]
      .filter((played) => played.length >= MIN_TITLE_GAMES)
      .map((played) => ({
        player,
        value: wins(played),
        outOf: played.length,
        title: { id: played[0].titleId, name: played[0].titleName },
        games: played,
      }))
      .sort(
        (a, b) => compare(a, b) || a.title.name.localeCompare(b.title.name),
      );
    return candidates.slice(0, 1);
  });

  return rankEntries(withoutZeros(entries), compare);
}

/**
 * Points ties that placement had to split: two players with the same season
 * total and different final placements. The better placement won the tiebreak.
 * Ranked on the share of tiebreaks won, then on having been in more of them.
 * Players never part of one are left out.
 */
function tiebreaks(players: RecordsPlayerInput[]): RecordEntry[] {
  const entries = players.map(({ player, seasons }) => {
    const faced: RecordTiebreak[] = [];
    for (const season of seasons) {
      for (const other of players) {
        if (other.player.slug === player.slug) continue;
        const theirs = other.seasons.find(
          (s) => s.seasonNumber === season.seasonNumber,
        );
        if (!theirs || theirs.totalPoints !== season.totalPoints) continue;
        if (theirs.placement === season.placement) continue;
        faced.push({
          season: {
            seasonNumber: season.seasonNumber,
            seasonSlug: season.seasonSlug,
          },
          opponent: other.player,
          won: season.placement < theirs.placement,
        });
      }
    }
    return {
      player,
      value: faced.filter((t) => t.won).length,
      outOf: faced.length,
      tiebreaks: faced,
      games: [],
    };
  });

  return rankEntries(
    entries.filter((e) => e.outOf > 0),
    byRateDesc,
  );
}

/** One line per game for a set of matches: how many of them `hits`. */
function linesPerGame(
  pool: RecordMatchRow[],
  hits: (match: RecordMatchRow) => boolean,
): RecordMatchLine[] {
  const lines = new Map<string, RecordMatchLine>();
  for (const match of pool) {
    const key = `${match.seasonSlug}/${match.gameSlug}`;
    const line = lines.get(key) ?? {
      seasonNumber: match.seasonNumber,
      seasonSlug: match.seasonSlug,
      gameSlug: match.gameSlug,
      gameTitle: match.gameTitle,
      count: 0,
      outOf: 0,
    };
    line.outOf += 1;
    if (hits(match)) line.count += 1;
    lines.set(key, line);
  }
  return [...lines.values()];
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
    const key = `${match.seasonSlug}/${match.gameSlug}`;
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
    const opponents = new Map<string, RecordMatchRow[]>();
    for (const match of matches) {
      opponents.set(match.opponent.slug, [
        ...(opponents.get(match.opponent.slug) ?? []),
        match,
      ]);
    }

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

/**
 * Home advantage: average placement in other people's picks minus the average
 * in one's own — how many places better a player finishes at home. Needs
 * MIN_OWN_PICKS own picks. Compared at the two decimals it is shown with, then
 * on more wins in own picks.
 */
function homeAdvantage(players: RecordsPlayerInput[]): RecordEntry[] {
  const entries = players.flatMap(({ player, games }) => {
    const own = games.filter((g) => g.ownPick);
    const others = games.filter((g) => !g.ownPick);
    if (own.length < MIN_OWN_PICKS || others.length === 0) return [];
    const split = { own: mean(own), others: mean(others) };
    return [
      {
        player,
        value: split.others - split.own,
        outOf: own.length,
        split,
        games: own,
      },
    ];
  });
  return rankEntries(
    entries,
    (a, b) =>
      shown(b.value, 2) - shown(a.value, 2) || wins(b.games) - wins(a.games),
  );
}

/**
 * The closer and the opener: average placement in the LAST (or FIRST) game of
 * each season played. Needs MIN_EDGE_SEASONS seasons. Compared at two decimals,
 * then on more wins.
 */
function seasonEdge(
  players: RecordsPlayerInput[],
  edge: 'first' | 'last',
): RecordEntry[] {
  const entries = players.flatMap(({ player, games }) => {
    // Games are in play order: keep the first row seen per season, or let
    // each later one overwrite it.
    const bySeason = new Map<number, RecordGameRow>();
    for (const game of games) {
      if (edge === 'last' || !bySeason.has(game.seasonNumber)) {
        bySeason.set(game.seasonNumber, game);
      }
    }
    const picked = [...bySeason.values()];
    if (picked.length < MIN_EDGE_SEASONS) return [];
    return [
      { player, value: mean(picked), outOf: picked.length, games: picked },
    ];
  });
  return rankEntries(
    entries,
    (a, b) =>
      shown(a.value, 2) - shown(b.value, 2) || wins(b.games) - wins(a.games),
  );
}

/**
 * Games as all-time wins leader. Walks every game of the archive in play order
 * with a running tally of game wins; after each game the player(s) with the
 * most wins lead. `value` counts the games a player led or shared the lead
 * after, `outOf` those they led alone. Ranked on the count, then the sole
 * count. `games` are the player's own rows for the games they led after.
 */
function winsLeader(players: RecordsPlayerInput[]): RecordEntry[] {
  const keyOf = (g: RecordGameRow) => g.seasonNumber * 1000 + g.ordinal;
  const timeline = [
    ...new Set(players.flatMap((p) => p.games.map(keyOf))),
  ].sort((a, b) => a - b);

  const tally = new Map(players.map((p) => [p.player.slug, 0]));
  const led = new Map(
    players.map((p) => [
      p.player.slug,
      { games: [] as RecordGameRow[], sole: 0 },
    ]),
  );

  for (const key of timeline) {
    const rows = players.map((p) => ({
      slug: p.player.slug,
      game: p.games.find((g) => keyOf(g) === key),
    }));
    for (const { slug, game } of rows) {
      if (game && isWin(game)) tally.set(slug, (tally.get(slug) ?? 0) + 1);
    }
    const most = Math.max(...tally.values());
    if (most === 0) continue;
    const leaders = rows.filter(({ slug }) => tally.get(slug) === most);
    for (const { slug, game } of leaders) {
      const entry = led.get(slug)!;
      if (game) entry.games.push(game);
      if (leaders.length === 1) entry.sole += 1;
    }
  }

  const entries = players.map(({ player }) => {
    const { games, sole } = led.get(player.slug)!;
    return { player, value: games.length, outOf: sole, games };
  });
  return rankEntries(
    withoutZeros(entries),
    (a, b) => b.value - a.value || (b.outOf ?? 0) - (a.outOf ?? 0),
  );
}

/**
 * Closest rivalry: for every pair, the games one finished ahead of the other
 * and the reverse, over the games both played. One entry per pair, the most
 * level first; pairs with the same gap share a rank. `player` is whoever is
 * ahead (the first by name when level).
 */
function rivalries(players: RecordsPlayerInput[]): RecordEntry[] {
  const keyOf = (g: RecordGameRow) => `${g.seasonSlug}/${g.gameSlug}`;
  const entries: UnrankedEntry[] = [];

  players.forEach((a, i) => {
    for (const b of players.slice(i + 1)) {
      const theirs = new Map(b.games.map((g) => [keyOf(g), g]));
      const seasons = new Map<
        number,
        { season: RecordSeason; first: number; second: number }
      >();
      let first = 0;
      let second = 0;
      let oneTwo = 0;
      let oneTwoFirst = 0;

      for (const mine of a.games) {
        const other = theirs.get(keyOf(mine));
        if (!other || mine.placement === other.placement) continue;
        const line = seasons.get(mine.seasonNumber) ?? {
          season: {
            seasonNumber: mine.seasonNumber,
            seasonSlug: mine.seasonSlug,
          },
          first: 0,
          second: 0,
        };
        if (mine.placement < other.placement) {
          first += 1;
          line.first += 1;
        } else {
          second += 1;
          line.second += 1;
        }
        seasons.set(mine.seasonNumber, line);
        if (Math.max(mine.placement, other.placement) === 2) {
          oneTwo += 1;
          if (mine.placement === 1) oneTwoFirst += 1;
        }
      }
      if (first + second === 0) continue;

      // Lead with whoever is ahead; `a` precedes `b` by name when level.
      const flip =
        second > first ||
        (second === first && b.player.name.localeCompare(a.player.name) < 0);
      entries.push({
        player: flip ? b.player : a.player,
        partner: flip ? a.player : b.player,
        value: Math.abs(first - second),
        outOf: first + second,
        pair: {
          ahead: flip ? second : first,
          behind: flip ? first : second,
          oneTwo,
          oneTwoFirst: flip ? oneTwo - oneTwoFirst : oneTwoFirst,
          seasons: [...seasons.values()].map((line) => ({
            season: line.season,
            ahead: flip ? line.second : line.first,
            behind: flip ? line.first : line.second,
          })),
        },
        games: [],
      });
    }
  });

  return rankEntries(entries, (x, y) => x.value - y.value);
}

/**
 * Raw season points summed over the career. The one place seasons are added
 * up as points rather than placements: ladders differ per season, so this
 * favours the seasons with more points on offer. Asked for as a plain total.
 */
function totalPoints(players: RecordsPlayerInput[]): RecordEntry[] {
  const entries = players.map(({ player, seasons }) => ({
    player,
    value: seasons.reduce((sum, s) => sum + s.totalPoints, 0),
    outOf: seasons.length,
    seasonPoints: seasons.map((s) => ({
      season: { seasonNumber: s.seasonNumber, seasonSlug: s.seasonSlug },
      points: s.totalPoints,
    })),
    games: [],
  }));
  return rankEntries(withoutZeros(entries), byValueDesc);
}

/**
 * Net power-up points over the career: the sum of every game's power-up delta
 * on the player's OWN score, whoever played the power-up (a curse from someone
 * else counts against them). The net can be negative, so nobody is dropped for
 * a low figure — only players no power-up ever moved are left out.
 */
function powerUpPoints(players: RecordsPlayerInput[]): RecordEntry[] {
  const entries = players.flatMap(({ player, games }) => {
    const moved = games.filter((g) => g.powerUpDelta !== 0);
    if (moved.length === 0) return [];
    return [
      {
        player,
        value: moved.reduce((sum, g) => sum + g.powerUpDelta, 0),
        outOf: moved.length,
        games: moved,
      },
    ];
  });
  return rankEntries(entries, byValueDesc);
}

/**
 * One crown per tag: every player's average placement under it, best first.
 * Averages are compared at one decimal (as `deriveTagStats` does), then on more
 * wins. Unfiltered — a tag with a single game is still listed; the consumer
 * decides what is enough to rank. Crowns are ordered by sample size, then tag.
 */
function tagCrowns(players: RecordsPlayerInput[]): TagCrown[] {
  const byTag = new Map<Tag, UnrankedEntry[]>();

  for (const { player, games } of players) {
    const stats = deriveTagStats(
      games.map((game) => ({ tags: game.tags, result: game })),
    );
    for (const stat of stats) {
      byTag.set(stat.tag, [
        ...(byTag.get(stat.tag) ?? []),
        {
          player,
          value: stat.averagePlacement,
          outOf: stat.games,
          games: stat.results,
        },
      ]);
    }
  }

  const sample = (crown: TagCrown) =>
    Math.max(...crown.entries.map((e) => e.outOf ?? 0));

  return [...byTag.entries()]
    .map(([tag, entries]) => ({
      tag,
      entries: rankEntries(
        entries,
        (a, b) =>
          shown(a.value, 1) - shown(b.value, 1) ||
          wins(b.games) - wins(a.games),
      ),
    }))
    .sort((a, b) => sample(b) - sample(a) || a.tag.localeCompare(b.tag));
}

export function deriveRecords(players: RecordsPlayerInput[]): RecordsView {
  const seasonBySlug = new Map<string, RecordSeason>();
  for (const { seasons } of players) {
    for (const s of seasons) {
      seasonBySlug.set(s.seasonSlug, {
        seasonNumber: s.seasonNumber,
        seasonSlug: s.seasonSlug,
      });
    }
  }
  const seasons = [...seasonBySlug.values()].sort(
    (a, b) => a.seasonNumber - b.seasonNumber,
  );

  return {
    seasons,
    board: deriveCareerBoard(players, seasons),
    mostGameWins: winCount(players, () => true),
    bestSeason: bestSeason(players),
    longestWinStreak: streak(players, isWin),
    longestTopTwoStreak: streak(players, (g) => g.placement <= 2),
    longestTopThreeStreak: streak(players, (g) => g.placement <= 3),
    homeTurf: winCount(players, (g) => g.ownPick),
    awayWins: winCount(players, (g) => !g.ownPick),
    titleSpecialist: titleSpecialist(players),
    tiebreaks: tiebreaks(players),
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
    homeAdvantage: homeAdvantage(players),
    seasonCloser: seasonEdge(players, 'last'),
    seasonOpener: seasonEdge(players, 'first'),
    winsLeader: winsLeader(players),
    rivalries: rivalries(players),
    totalPoints: totalPoints(players),
    powerUpPoints: powerUpPoints(players),
    tagCrowns: tagCrowns(players),
    tagCrownsWithoutOwnPicks: tagCrowns(
      players.map((p) => ({
        ...p,
        games: p.games.filter((g) => !g.ownPick),
      })),
    ),
  };
}
