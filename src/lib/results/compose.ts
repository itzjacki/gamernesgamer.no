import type { Game } from '@/types/game';
import type { Gamer } from '@/types/gamer';
import type { PowerUp } from '@/types/power-up';
import type { Tag } from '@/types/tag';
import { seasonData, isSeason } from '@/data/sesong';
import { titles } from '@/data/titles';
import type { SeasonData } from '@/data/sesong';
import type {
  SeasonView,
  GamePlacementRow,
  PlayerRef,
  CareerStats,
  CareerView,
  CareerCard,
  CareerTrophyView,
  RecordGameRow,
  RecordsPlayerInput,
  RecordsView,
  PairView,
  PairSummary,
} from './view-models';
import { deriveTagStats } from './derive/career/tags';
import { deriveRecords } from './derive/records';
import { derivePair } from './derive/pair';

/**
 * PURE. The one seam where DB results meet static src/data/sesong content;
 * derive/ must not import static data. Join keys: game slug, player NAME (the
 * static Gamer has no slug), and seasonSlug === seasonData key. A missing
 * static match is a bug, so the resolvers throw rather than drop.
 */

export interface ComposedStandingRow {
  player: PlayerRef;
  gamer: Gamer;
  placement: number;
  totalPoints: number;
  isChampion: boolean;
  note: string | null;
}

export interface ComposedGameSummary {
  game: Game;
  ordinal: number;
  results: ComposedGamePlacementRow[];
}

export interface ComposedPowerUpUse {
  slug: string;
  isCurse: boolean;
  pointsDelta: number;
  name: string;
  description: string;
}

export interface ComposedGamePlacementRow {
  player: PlayerRef;
  placement: number;
  ladderPoints: number;
  powerUpDelta: number;
  points: number;
  powerUpUses: ComposedPowerUpUse[];
  note: string | null;
}

export interface ComposedSeasonView {
  seasonNumber: number;
  seasonSlug: string;
  standings: ComposedStandingRow[];
  games: ComposedGameSummary[];
}

function seasonContent(seasonSlug: string) {
  if (!isSeason(seasonSlug)) {
    throw new Error(
      `No static season content for season "${seasonSlug}". Expected a key in src/data/sesong.`,
    );
  }
  return seasonData[seasonSlug];
}

function gameBySlug(games: readonly Game[]): Map<string, Game> {
  const map = new Map<string, Game>();
  for (const g of games) map.set(g.slug, g);
  return map;
}

function gamerByName(gamers: readonly Gamer[]): Map<string, Gamer> {
  const map = new Map<string, Gamer>();
  for (const g of gamers) map.set(g.name, g);
  return map;
}

function requireGame(map: Map<string, Game>, slug: string): Game {
  const game = map.get(slug);
  if (!game) {
    throw new Error(
      `No static game content for slug "${slug}". Every seeded game must have a matching entry in src/data/sesong/<NN>/games.ts.`,
    );
  }
  return game;
}

/** The instance's genre tags override its title's; format tags are added. */
function gameTags(game: Game): Tag[] {
  return [
    ...(game.genreTags ?? titles[game.titleId].genreTags),
    ...game.formatTags,
  ];
}

function requireGamer(map: Map<string, Gamer>, name: string): Gamer {
  const gamer = map.get(name);
  if (!gamer) {
    throw new Error(
      `No static gamer content for "${name}". Every roster player must have a matching entry in src/data/sesong/<NN>/gamers.ts.`,
    );
  }
  return gamer;
}

/** Power-ups AND curses merged — both are `power_up` rows in the DB. */
function powerUpBySlug(content: SeasonData): Map<string, PowerUp> {
  const map = new Map<string, PowerUp>();
  for (const pu of content.powerUps ?? []) map.set(pu.slug, pu);
  for (const curse of content.curses ?? []) map.set(curse.slug, curse);
  return map;
}

function requirePowerUp(map: Map<string, PowerUp>, slug: string): PowerUp {
  const powerUp = map.get(slug);
  if (!powerUp) {
    throw new Error(
      `No static power-up content for slug "${slug}". Every seeded power-up must have a matching entry (with that slug) in src/data/sesong/<NN>/power-ups.ts.`,
    );
  }
  return powerUp;
}

function composeResults(
  results: GamePlacementRow[],
  powerUps: Map<string, PowerUp>,
): ComposedGamePlacementRow[] {
  return results.map((r) => ({
    player: r.player,
    placement: r.placement,
    ladderPoints: r.ladderPoints,
    powerUpDelta: r.powerUpDelta,
    points: r.points,
    note: r.note,
    powerUpUses: r.powerUpUses.map((use) => {
      const content = requirePowerUp(powerUps, use.slug);
      return {
        slug: use.slug,
        isCurse: use.isCurse,
        pointsDelta: use.pointsDelta,
        name: content.name,
        description: content.description,
      };
    }),
  }));
}

export function composeSeasonView(view: SeasonView): ComposedSeasonView {
  const content = seasonContent(view.seasonSlug);
  const games = gameBySlug(content.games);
  const gamers = gamerByName(content.gamers);
  const powerUps = powerUpBySlug(content);

  return {
    seasonNumber: view.seasonNumber,
    seasonSlug: view.seasonSlug,
    standings: view.standings.map((s) => ({
      player: s.player,
      gamer: requireGamer(gamers, s.player.name),
      placement: s.placement,
      totalPoints: s.totalPoints,
      isChampion: s.isChampion,
      note: s.note,
    })),
    games: view.games.map((g) => ({
      game: requireGame(games, g.slug),
      ordinal: g.ordinal,
      results: composeResults(g.results, powerUps),
    })),
  };
}

/* -------------------------------------------------------------------------- */
/* Player career (cross-season)                                               */
/* -------------------------------------------------------------------------- */

/**
 * The hero uses the latest season's card art; a dedicated portrait, if any,
 * is swapped in by queries.ts so compose stays IO-free.
 */
export function composeCareerView(stats: CareerStats): CareerView {
  const cards: CareerCard[] = stats.seasons.map((row) => {
    const content = seasonContent(row.seasonSlug);
    const gamer = requireGamer(gamerByName(content.gamers), stats.name);
    return {
      seasonNumber: row.seasonNumber,
      seasonSlug: row.seasonSlug,
      nickname: gamer.nickname,
      imagePath: gamer.imagePath,
      stats: gamer.stats,
    };
  });

  const latest = cards[cards.length - 1];

  const trophies: CareerTrophyView[] = stats.trophies.map((t) => {
    if (t.kind !== 'game-gold') return t;
    const content = seasonContent(t.seasonSlug);
    const game = requireGame(gameBySlug(content.games), t.gameSlug!);
    return { ...t, gameTitle: game.title };
  });

  const taggedGames = stats.games.map((row) => {
    const content = seasonContent(row.seasonSlug);
    const game = requireGame(gameBySlug(content.games), row.gameSlug);
    return {
      tags: gameTags(game),
      result: {
        seasonNumber: row.seasonNumber,
        seasonSlug: row.seasonSlug,
        gameSlug: row.gameSlug,
        gameTitle: game.title,
        placement: row.placement,
        ownPick: game.chosenBy === stats.name,
      },
    };
  });

  return {
    slug: stats.slug,
    hero: {
      name: stats.name,
      nickname: latest.nickname,
      imagePath: latest.imagePath,
      heroImageIsFallback: true, // queries.ts flips this if a hero portrait exists
    },
    ledger: stats.ledger,
    seasons: stats.seasons,
    trophies,
    cards,
    tagStats: deriveTagStats(taggedGames),
    tagStatsWithoutOwnPicks: deriveTagStats(
      taggedGames.filter((g) => !g.result.ownPick),
    ),
  };
}

/* -------------------------------------------------------------------------- */
/* Records (all players, cross-season)                                        */
/* -------------------------------------------------------------------------- */

/** Shared by the records and the pair views, so both read the same rows. */
function recordsInputs(careers: CareerStats[]): RecordsPlayerInput[] {
  const indexes = new Map<string, Map<string, Game>>();
  const gameOf = (row: { seasonSlug: string; gameSlug: string }) => {
    let index = indexes.get(row.seasonSlug);
    if (!index) {
      index = gameBySlug(seasonContent(row.seasonSlug).games);
      indexes.set(row.seasonSlug, index);
    }
    return requireGame(index, row.gameSlug);
  };

  return careers.map((stats) => ({
    player: { slug: stats.slug, name: stats.name },
    seasons: stats.seasons,
    games: stats.games.map((row): RecordGameRow => {
      const game = gameOf(row);
      return {
        seasonNumber: row.seasonNumber,
        seasonSlug: row.seasonSlug,
        gameSlug: row.gameSlug,
        gameTitle: game.title,
        placement: row.placement,
        ownPick: game.chosenBy === stats.name,
        titleId: game.titleId,
        titleName: titles[game.titleId].name,
        tags: gameTags(game),
        powerUpDelta: row.powerUpDelta,
        ordinal: row.ordinal,
      };
    }),
    matches: stats.matches.map((row) => ({
      ...row,
      gameTitle: gameOf(row).title,
    })),
  }));
}

export function composeRecordsView(careers: CareerStats[]): RecordsView {
  return deriveRecords(recordsInputs(careers));
}

/* -------------------------------------------------------------------------- */
/* Pair (two players, head to head)                                           */
/* -------------------------------------------------------------------------- */

/**
 * `slugA` is side `a`. Uses the latest card art; queries.ts swaps in a hero
 * portrait. Null when either slug is unknown, they are the same player, or
 * they never shared a game.
 */
export function composePairView(
  careers: CareerStats[],
  slugA: string,
  slugB: string,
): PairView | null {
  const inputs = recordsInputs(careers);
  const a = inputs.find((p) => p.player.slug === slugA);
  const b = inputs.find((p) => p.player.slug === slugB);
  if (!a || !b) return null;

  const stats = derivePair(a, b);
  if (!stats) return null;

  const side = (input: RecordsPlayerInput) => {
    const latest = input.seasons[input.seasons.length - 1];
    const gamer = requireGamer(
      gamerByName(seasonContent(latest.seasonSlug).gamers),
      input.player.name,
    );
    return {
      ...input.player,
      nickname: gamer.nickname,
      imagePath: gamer.imagePath,
    };
  };

  return { ...stats, a: side(a), b: side(b) };
}

/** Opponents never shared a game with are left out. Empty for an unknown slug. */
export function composePairSummaries(
  careers: CareerStats[],
  slug: string,
): PairSummary[] {
  const inputs = recordsInputs(careers);
  const me = inputs.find((p) => p.player.slug === slug);
  if (!me) return [];

  return inputs
    .flatMap((other): PairSummary[] => {
      const pair = derivePair(me, other);
      if (!pair) return [];
      return [
        {
          opponent: other.player,
          ahead: pair.finishedAhead.a,
          behind: pair.finishedAhead.b,
          level: pair.finishedAhead.level,
          matchWins: pair.matches.a,
          matchLosses: pair.matches.b,
        },
      ];
    })
    .sort((x, y) => x.opponent.name.localeCompare(y.opponent.name, 'no'));
}
