/**
 * View-models: hand-authored, camelCase shapes that pages/components consume.
 *
 * These are the ONLY result types a component should see. Generated snake_case
 * DB row types stay inside the module (fetch/compose/derive). The boundary here
 * is deliberately the snake→camel boundary AND the FK-id→resolved-player
 * boundary: a component never resolves a season_player.id, never sums points,
 * never re-sorts standings.
 *
 * Scope note (first slice): season standings + per-game points matrix only.
 * H2H group tables, rounds detail, brackets, and player-career shapes are
 * deliberately absent until their data/need lands.
 */

/**
 * A player resolved for display. Collapses season_player + player identity and
 * merges the static-data slug. `seasonPlayerId` is retained only as a stable
 * React key / lookup handle; components should display `name`.
 */
export interface PlayerRef {
  /** season_player.id — stable within a season. For keys/lookups, not display. */
  seasonPlayerId: string;
  /** player.slug — links to /spillere/[spiller] and static gamer data. */
  slug: string;
  /** player.name — the display name (e.g. "Jakob"). */
  name: string;
}

/** One player's line in the final season standings. Pre-ordered, pre-ranked. */
export interface SeasonStandingRow {
  player: PlayerRef;
  /** Final season placement (1 = champion). Authoritative — from season_result. */
  placement: number;
  /** Derived total season points (sum of per-game points). Display only. */
  totalPoints: number;
  /** True when placement === 1. Precomputed so markup needs no `=== 1`. */
  isChampion: boolean;
  /** Optional archived context (e.g. a tiebreak story). May be shown or not. */
  note: string | null;
}

/**
 * One power-up (or curse) applied to a player in a single game. DB facts only —
 * the display name/description are static content, joined later in compose by
 * `slug` (same raw-vs-composed split as games/gamers). Zero-delta uses ARE
 * included (a power-up can be activated with no net point effect).
 */
export interface PowerUpUseEntry {
  /** power_up.slug — the per-season join key to static content. */
  slug: string;
  /** True for curses (power_up.is_curse). Not used for colour; may inform copy. */
  isCurse: boolean;
  /** This single use's signed points effect (can be negative or 0). */
  pointsDelta: number;
}

/** One player's result in a single game: placement + derived points. */
export interface GamePlacementRow {
  player: PlayerRef;
  /** Final placement in this game (1 = winner). Authoritative — from game_result. */
  placement: number;
  /** Base ladder points for the placement. */
  ladderPoints: number;
  /** Net power-up adjustment applied to this player for this game (0 if none). */
  powerUpDelta: number;
  /** ladderPoints + powerUpDelta — the season points this game awarded. */
  points: number;
  /**
   * Every power-up/curse applied to this player in this game, incl. zero-delta
   * uses. `powerUpDelta` is exactly the sum of these entries' `pointsDelta`.
   * Empty array (never undefined) when none applied. Deterministically ordered.
   */
  powerUpUses: PowerUpUseEntry[];
  /** Optional archived context (e.g. a game-level tiebreak story). */
  note: string | null;
}

/** A game's row in the season overview: identity + its final placement table. */
export interface GameSummary {
  /** game.slug — matches static data key and route segment. */
  slug: string;
  /** Play order within the season (game.ordinal). */
  ordinal: number;
  /** Final placement + points per player, ordered by placement. */
  results: GamePlacementRow[];
}

/** One point on a player's cumulative-points line: their running total after a game. */
export interface CumulativePoint {
  /** The game's play order (game.ordinal) this total is measured after. */
  ordinal: number;
  /** The player's running season-points total through this game (inclusive). */
  total: number;
}

/**
 * One player's cumulative season-points line across the games, in ordinal
 * order. Drives the points-over-games chart — the narrative "race" view.
 */
export interface PlayerSeries {
  player: PlayerRef;
  /** Running totals, one per game, ordered by ordinal. */
  points: CumulativePoint[];
}

/** Everything the season page renders from. One fetch produces this. */
export interface SeasonView {
  /** season.number (1-indexed). */
  seasonNumber: number;
  /** Zero-padded slug used in routes/static data (e.g. "01"). */
  seasonSlug: string;
  /** Roster, resolved for display. */
  players: PlayerRef[];
  /** Final season standings, ordered by placement. */
  standings: SeasonStandingRow[];
  /** Per-game placement/points matrix, ordered by game ordinal. */
  games: GameSummary[];
  /**
   * Cumulative points-over-games series, one line per player (same order as
   * `players`). Each line has one point per game in ordinal order. Empty when
   * the season has no games/results yet.
   */
  series: PlayerSeries[];
}

/** Everything the game-detail page renders from (first slice: the result table). */
export interface GameView {
  seasonNumber: number;
  seasonSlug: string;
  slug: string;
  ordinal: number;
  /** Final placement + points per player, ordered by placement. */
  results: GamePlacementRow[];
}
