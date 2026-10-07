import type { Game } from '@/types/game';
import type { Gamer } from '@/types/gamer';
import type { PowerUp } from '@/types/power-up';
import { seasonData, isSeason } from '@/data/sesong';
import type { SeasonData } from '@/data/sesong';
import type {
  SeasonView,
  GameView,
  GamePlacementRow,
  PlayerRef,
} from './view-models';

/**
 * PURE. No IO, no async, no React. Joins the DB-derived view-models
 * (slugs/names/placements/points) to the STATIC season content in
 * src/data/sesong (game title/thumbnail/chosenBy, gamer nickname/image).
 *
 * Why a separate step (not in derive/, not in fetch): derive/ is unit-tested
 * against DB fixtures and must not import the static TS data; fetch/ is IO.
 * compose is the one seam where the two halves meet — DB results on one side,
 * git-reviewed static content on the other — joined by the shared slug (games)
 * and name (players). Pages call this when they need both; a page that only
 * needs raw results can still use the plain view-models.
 *
 * Join keys:
 *  - game:   view-model `slug` === static Game.slug (the seed uses the static
 *            slug as game.slug by construction, so these always correspond).
 *  - player: PlayerRef.name === static Gamer.name (the static Gamer type has no
 *            slug; name is its identity within a season roster).
 *  - season: view-model `seasonSlug` (zero-padded, e.g. "02") === seasonData key.
 *
 * A missing static match is a real bug (every seeded game/player must have
 * static content), so the resolvers throw rather than silently drop — the same
 * fail-loud stance as derive/players.requireRef.
 */

/** A season standing row enriched with the player's static gamer content. */
export interface ComposedStandingRow {
  player: PlayerRef;
  gamer: Gamer;
  placement: number;
  totalPoints: number;
  isChampion: boolean;
  note: string | null;
}

/** A game summary enriched with its static game content. */
export interface ComposedGameSummary {
  game: Game;
  ordinal: number;
  /** Placement/points rows, each with power-up uses joined to static content. */
  results: ComposedGamePlacementRow[];
}

/**
 * A single power-up use with its static display content joined in by slug.
 * `name`/`description` come from src/data/sesong/<NN>/power-ups.ts; the rest is
 * carried through from the view-model's PowerUpUseEntry.
 */
export interface ComposedPowerUpUse {
  slug: string;
  isCurse: boolean;
  pointsDelta: number;
  /** Display name from static content (e.g. "Double Up"). */
  name: string;
  /** Static description — available for a richer popover/tooltip if wanted. */
  description: string;
}

/** A game-placement row with its power-up uses joined to static content. */
export interface ComposedGamePlacementRow {
  player: PlayerRef;
  placement: number;
  ladderPoints: number;
  powerUpDelta: number;
  points: number;
  powerUpUses: ComposedPowerUpUse[];
  note: string | null;
}

/** SeasonView joined to static content: gamer cards + game cards resolvable. */
export interface ComposedSeasonView {
  seasonNumber: number;
  seasonSlug: string;
  standings: ComposedStandingRow[];
  games: ComposedGameSummary[];
}

/** GameView joined to its static game content. */
export interface ComposedGameView {
  seasonNumber: number;
  seasonSlug: string;
  game: Game;
  ordinal: number;
  results: ComposedGamePlacementRow[];
}

/** Resolve a season's static content block or throw (unknown season = bug). */
function seasonContent(seasonSlug: string) {
  if (!isSeason(seasonSlug)) {
    throw new Error(
      `No static season content for season "${seasonSlug}". Expected a key in src/data/sesong.`,
    );
  }
  return seasonData[seasonSlug];
}

/** Build a slug→Game map for one season's static games. */
function gameBySlug(games: readonly Game[]): Map<string, Game> {
  const map = new Map<string, Game>();
  for (const g of games) map.set(g.slug, g);
  return map;
}

/** Build a name→Gamer map for one season's static gamers. */
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

function requireGamer(map: Map<string, Gamer>, name: string): Gamer {
  const gamer = map.get(name);
  if (!gamer) {
    throw new Error(
      `No static gamer content for "${name}". Every roster player must have a matching entry in src/data/sesong/<NN>/gamers.ts.`,
    );
  }
  return gamer;
}

/**
 * Build a slug→PowerUp map for one season's static power-ups AND curses merged
 * (both are `power_up` rows in the DB). Slugs are unique within a season (DB
 * enforces `UNIQUE (season_id, slug)`). A season with no power-ups file (S1)
 * yields an empty map, which is fine — such a season has no uses to resolve.
 */
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

/** Join a view-model game-placement row's power-up uses to static content. */
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

/** Join a full SeasonView to its static season content. */
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

/** Join a single GameView to its static game content. */
export function composeGameView(view: GameView): ComposedGameView {
  const content = seasonContent(view.seasonSlug);
  const game = requireGame(gameBySlug(content.games), view.slug);
  const powerUps = powerUpBySlug(content);

  return {
    seasonNumber: view.seasonNumber,
    seasonSlug: view.seasonSlug,
    game,
    ordinal: view.ordinal,
    results: composeResults(view.results, powerUps),
  };
}
