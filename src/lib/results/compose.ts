import type { Game } from '@/types/game';
import type { Gamer } from '@/types/gamer';
import { seasonData, isSeason } from '@/data/sesong';
import type {
  SeasonView,
  GameView,
  GameSummary,
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
  /** The derived placement/points rows, unchanged from the view-model. */
  results: GameSummary['results'];
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
  results: GameView['results'];
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

/** Join a full SeasonView to its static season content. */
export function composeSeasonView(view: SeasonView): ComposedSeasonView {
  const content = seasonContent(view.seasonSlug);
  const games = gameBySlug(content.games);
  const gamers = gamerByName(content.gamers);

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
      results: g.results,
    })),
  };
}

/** Join a single GameView to its static game content. */
export function composeGameView(view: GameView): ComposedGameView {
  const content = seasonContent(view.seasonSlug);
  const game = requireGame(gameBySlug(content.games), view.slug);

  return {
    seasonNumber: view.seasonNumber,
    seasonSlug: view.seasonSlug,
    game,
    ordinal: view.ordinal,
    results: view.results,
  };
}
