import type {
  RecordEntry,
  RecordGameRow,
  RecordSeason,
  RecordTiebreak,
  RecordsPlayerInput,
  RecordsView,
  TagCrown,
} from '../../view-models';
import type { Tag } from '@/types/tag';
import { deriveTagStats } from '../career/tags';
import { deriveCareerBoard } from './board';
import { groupBy, isWin, mean, seasonRef, shown, wins } from './helpers';
import { deriveMatchRecords } from './match-records';
import {
  byRateDesc,
  byValueDesc,
  rankEntries,
  withoutZeros,
  type UnrankedEntry,
} from './rank';
import { rivalries } from './rivalries';
import { longestStreak } from './streaks';

/**
 * PURE. Every record on /records, from all players' careers. No IO, and no
 * static data: each game row arrives with its title, tags and own-pick flag
 * already joined (compose does that), the same arrangement as `deriveTagStats`.
 *
 * Placements are read, never re-derived. Every record is a best-first list
 * with shared ranks (see `rankEntries`). Count records drop players whose count
 * is zero — a record names who did something, not who didn't.
 *
 * This file holds the records built on game placements and season totals, and
 * assembles the view. The match records live in `match-records.ts`, the pair
 * record in `rivalries.ts`.
 */

/** A title must have been played this often before it can have a specialist. */
const MIN_TITLE_GAMES = 2;

/** Own picks before a home advantage means anything. */
const MIN_OWN_PICKS = 4;
/** Seasons played before a first- or last-game average means anything. */
const MIN_EDGE_SEASONS = 3;
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
          season: seasonRef(season),
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
    const byTitle = groupBy(games, (g) => g.titleId);

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
          season: seasonRef(season),
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
  // Play order across the whole archive: season first, then game ordinal.
  const keyOf = (g: RecordGameRow) => g.seasonNumber * 1000 + g.ordinal;
  const gamesBy = players.map(
    (p) => new Map(p.games.map((g) => [keyOf(g), g])),
  );
  const timeline = [
    ...new Set(gamesBy.flatMap((games) => [...games.keys()])),
  ].sort((a, b) => a - b);

  const tally = new Map(players.map((p) => [p.player.slug, 0]));
  const led = new Map(
    players.map((p) => [
      p.player.slug,
      { games: [] as RecordGameRow[], sole: 0 },
    ]),
  );

  for (const key of timeline) {
    const rows = players.map((p, i) => ({
      slug: p.player.slug,
      game: gamesBy[i].get(key),
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
      season: seasonRef(s),
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
      const entry = {
        player,
        value: stat.averagePlacement,
        outOf: stat.games,
        games: stat.results,
      };
      const entries = byTag.get(stat.tag);
      if (entries) entries.push(entry);
      else byTag.set(stat.tag, [entry]);
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
      seasonBySlug.set(s.seasonSlug, seasonRef(s));
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
    ...deriveMatchRecords(players),
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
