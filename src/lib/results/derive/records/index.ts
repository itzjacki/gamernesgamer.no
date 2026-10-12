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

const isWin = (game: { placement: number }) => game.placement === 1;
const wins = (games: readonly { placement: number }[]) =>
  games.filter(isWin).length;
const mean = (games: readonly { placement: number }[]) =>
  games.reduce((sum, g) => sum + g.placement, 0) / games.length;

/** An average at the precision it is displayed with, so what reads equal ties. */
const shown = (average: number, decimals: number) =>
  Number(average.toFixed(decimals));

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
 * Ranked on tiebreaks won, then fewer lost. Players never part of one are left
 * out.
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
    (a, b) =>
      b.value - a.value ||
      (a.outOf ?? 0) - a.value - ((b.outOf ?? 0) - b.value),
  );
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
    homeTurf: winCount(players, (g) => g.ownPick),
    awayWins: winCount(players, (g) => !g.ownPick),
    titleSpecialist: titleSpecialist(players),
    tiebreaks: tiebreaks(players),
    tagCrowns: tagCrowns(players),
  };
}
