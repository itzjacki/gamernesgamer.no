/**
 * View-models: hand-authored, camelCase shapes that pages/components consume.
 *
 * These are the ONLY result types a component should see. Generated snake_case
 * DB row types stay inside the module (fetch/compose/derive). The boundary here
 * is deliberately the snake→camel boundary AND the FK-id→resolved-player
 * boundary: a component never resolves a season_player.id, never sums points,
 * never re-sorts standings.
 *
 * Scope: season standings + per-game points matrix (season/game views) and the
 * cross-season player career (career views, further down). H2H group tables,
 * rounds detail, and brackets are deliberately absent until their data/need lands.
 */

import type { GamerStats } from '@/types/gamer';

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

/* -------------------------------------------------------------------------- */
/* Player career (cross-season)                                               */
/* -------------------------------------------------------------------------- */

/**
 * Career view-models. Unlike the season/game views (one season), these span
 * ALL seasons a player competed in. The pure derivation (derive/career) emits
 * the DB-only `Career*` shapes below; compose joins static src/data/sesong
 * (nicknames, card art, game titles) to produce the composed `*View` shapes a
 * page consumes. Same split as the season model.
 *
 * Scope: ONE player's career. The all-time board (/records) will reuse the
 * ledger + trophy COUNTS derivation across all players, but those composed,
 * page-shaped types stay career-only until /records is a real second caller
 * (extract-on-second-use).
 */

/** Which kind of trophy — drives both the icon and the hover label template. */
export type TrophyKind =
  | 'season-gold' // GG season winner (placement 1)
  | 'season-silver' // GG season 2nd
  | 'season-bronze' // GG season 3rd
  | 'game-gold'; // won an individual game within a season

/**
 * One trophy on the shelf — a DB-derived fact. Carries the keys needed to
 * render a hover label and link out; the human-facing game TITLE is joined in
 * compose (game-gold only). Season trophies need no title join (the label is
 * just the season number).
 */
export interface CareerTrophy {
  kind: TrophyKind;
  /** Season this was won in (1-indexed) — for the label and the season link. */
  seasonNumber: number;
  /** Zero-padded season slug for the season-page link (e.g. "02"). */
  seasonSlug: string;
  /** For game-gold only: the game slug (title joined in compose, links out). */
  gameSlug?: string;
}

/** One season in the player's record — their final placement that season. */
export interface CareerSeasonRow {
  seasonNumber: number;
  seasonSlug: string;
  /** Authoritative final placement that season (from season_result). */
  placement: number;
  /** Derived total season points that season. */
  totalPoints: number;
  /** True when placement === 1. */
  isChampion: boolean;
}

/** Flat career totals — the ledger readout. */
export interface CareerLedger {
  /** Seasons the player competed in. */
  seasonsPlayed: number;
  /** Mean of final season placements, raw (unrounded). Display with toFixed(1). */
  averagePlacement: number;
  /** Sum of every season's total points. */
  careerPoints: number;
  /** Best (lowest-placement; tiebreak = closeness) season's number. */
  bestSeasonNumber: number;
  /** Worst season's number. Equals bestSeasonNumber for a single-season player. */
  worstSeasonNumber: number;
}

/**
 * The DB-only career aggregate. Pure derivation output — stable keys and
 * numbers, NO names/images/titles (those are composed). `slug`/`name` come from
 * the cross-season player identity (player.slug/name), which the derivation
 * resolves from the roster rows, so they're DB facts, not static content.
 */
export interface CareerStats {
  slug: string;
  name: string;
  ledger: CareerLedger;
  /** One row per season played, ascending by season number. */
  seasons: CareerSeasonRow[];
  /**
   * Trophies, pre-sorted for display: season trophies first (by season, then
   * gold→silver→bronze), then game-gold (by season, then game ordinal).
   */
  trophies: CareerTrophy[];
}

/* -------- composed (static content joined) -------- */

/** A trophy with its human-facing label parts resolved (game title joined). */
export interface CareerTrophyView extends CareerTrophy {
  /** For game-gold: the static game title (e.g. "Trackmania"). Undefined for season trophies. */
  gameTitle?: string;
}

/** One per-season FIFA card for the gallery, with a season plaque. */
export interface CareerCard {
  seasonNumber: number;
  seasonSlug: string;
  /** Per-season gamer content (nickname/image/stats vary per season). */
  nickname: string;
  imagePath: string;
  stats?: GamerStats;
}

/** The nameplate hero. Isolated so the OG card can export this exact shape. */
export interface CareerHero {
  name: string;
  /** Latest season's nickname. */
  nickname: string;
  /**
   * Hero portrait. A dedicated hero image when present, else the latest card
   * art as a fallback. `heroImageIsFallback` tells the UI/OG which it got.
   */
  imagePath: string;
  heroImageIsFallback: boolean;
}

/** Everything the career page renders from. One multi-season pass produces this. */
export interface CareerView {
  slug: string;
  hero: CareerHero;
  ledger: CareerLedger;
  seasons: CareerSeasonRow[];
  trophies: CareerTrophyView[];
  /** All per-season cards, ascending by season (the FUTBIN-style gallery). */
  cards: CareerCard[];
}
