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
import type { Tag } from '@/types/tag';

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

/**
 * One decided head-to-head match inside a game. The outcome is derived from
 * the match's game rows (who won more of them); undecided matches are absent.
 * A game's matches are ordered by stage, then leg — so two meetings of the
 * same pair always appear in the order they were played.
 */
export interface GameMatch {
  playerA: PlayerRef;
  playerB: PlayerRef;
  /** The series length as a number: 1, 3 or 5. */
  bestOf: number;
  /** Game rows won by each side. Never equal. */
  winsA: number;
  winsB: number;
  /** Bracket position (`F`, `GF`, `BR`, `SF1`, …); null in a round-robin. */
  slotId: string | null;
}

/** A game's row in the season overview: identity + its final placement table. */
export interface GameSummary {
  /** game.slug — matches static data key and route segment. */
  slug: string;
  /** Play order within the season (game.ordinal). */
  ordinal: number;
  /** Final placement + points per player, ordered by placement. */
  results: GamePlacementRow[];
  /** Decided head-to-head matches in this game. Empty when it has none. */
  matches: GameMatch[];
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
 * Scope: ONE player's career. The all-players shapes /records renders from are
 * further down ("Records").
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

/** One game the player played — their final placement in it. */
export interface CareerGameRow {
  seasonNumber: number;
  seasonSlug: string;
  /** game.slug — the join key to static content (title, tags) in compose. */
  gameSlug: string;
  /** Authoritative final placement in this game (from game_result). */
  placement: number;
  /** Net power-up points this game gave or cost the player (0 if none). */
  powerUpDelta: number;
  /** Play order within the season (game.ordinal). */
  ordinal: number;
}

/** One head-to-head match the player played, from their side. */
export interface CareerMatchRow {
  seasonNumber: number;
  seasonSlug: string;
  /** game.slug of the game the match was part of. */
  gameSlug: string;
  /** The series length as a number: 1, 3 or 5. */
  bestOf: number;
  /** Game rows the player won and lost in the match. */
  gamesWon: number;
  gamesLost: number;
  /** True when the player won the match. */
  won: boolean;
  /** Who it was against. */
  opponent: { slug: string; name: string };
  /** Bracket position (`F`, `GF`, `BR`, `SF1`, …); null in a round-robin. */
  slotId: string | null;
}

/** One game behind a tag stat: which game, and where the player finished. */
export interface TagGameResult {
  seasonNumber: number;
  seasonSlug: string;
  /** game.slug — with seasonSlug, the route to the game page. */
  gameSlug: string;
  /** Static game title, joined in compose. */
  gameTitle: string;
  /** Authoritative final placement in this game (from game_result). */
  placement: number;
  /** True when the player chose this game themselves (static `chosenBy`). */
  ownPick: boolean;
}

/**
 * One tag's aggregate over the games a player played under it. No minimum
 * sample is applied here — a tag with a single game is still listed. Deciding
 * which tags are meaningful enough to rank is the consuming component's call.
 */
export interface TagStat<
  T extends string,
  R extends { placement: number } = TagGameResult,
> {
  tag: T;
  /** Games played under this tag (results.length). */
  games: number;
  /** How many of those the player won (placement 1). */
  wins: number;
  /** Mean game placement, raw (unrounded). Lower is better. Display with toFixed(1). */
  averagePlacement: number;
  /** The games themselves, in the order they were given (chronological). */
  results: R[];
}

/** Flat career totals — the ledger readout. */
export interface CareerLedger {
  /** Seasons the player competed in. */
  seasonsPlayed: number;
  /** Mean of final season placements, raw (unrounded). Display with toFixed(1). */
  averagePlacement: number;
  /**
   * Mean placement across every individual game played, raw (unrounded).
   * Display with toFixed(1). 0 when no game results exist yet.
   */
  averageGamePlacement: number;
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
  /** Every game the player played, ascending by season, then game ordinal. */
  games: CareerGameRow[];
  /** Every decided head-to-head match the player played, same ordering. */
  matches: CareerMatchRow[];
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
  /**
   * Per-tag aggregates over every game played, best first. Genre and format
   * tags rank together in one list. Unfiltered — every tag the player has a
   * game under is present.
   */
  tagStats: TagStat<Tag>[];
  /**
   * The same aggregates with the games the player chose themselves left out —
   * people pick what they are good at, which skews the full list.
   */
  tagStatsWithoutOwnPicks: TagStat<Tag>[];
}

/* -------------------------------------------------------------------------- */
/* Records (all players, cross-season)                                        */
/* -------------------------------------------------------------------------- */

/**
 * Records view-models. Where a career view is ONE player across seasons, these
 * compare ALL players. Everything normalizes off placement, never raw points
 * (ladders differ per season) — except the two points records (`totalPoints`,
 * `powerUpPoints`), which add up raw season points on purpose and so favour
 * the seasons with the larger ladders. Each record is a best-first list of
 * `RecordEntry` with shared ranks: a tie is two rank-1 entries, never a hidden
 * tiebreak.
 */

/** A player as the records name them — the cross-season identity. */
export interface RecordPlayer {
  slug: string;
  name: string;
}

/** A season a record or the board refers to. */
export interface RecordSeason {
  seasonNumber: number;
  seasonSlug: string;
}

/**
 * One game a player played, with the static facts the records need (title
 * identity and tags). Joined in compose, so the derivation imports no static
 * data — same arrangement as `deriveTagStats`.
 */
export interface RecordGameRow extends TagGameResult {
  /** The cross-season title this instance belongs to (CS:GO and CS2 are one). */
  titleId: string;
  titleName: string;
  tags: Tag[];
  /** Net power-up points this game gave or cost the player (0 if none). */
  powerUpDelta: number;
  /** Play order within the season (game.ordinal). */
  ordinal: number;
}

/** A game behind a record's figure. */
export interface RecordEntryGame extends TagGameResult {
  /** Net power-up points in this game. Absent on tag-crown entries. */
  powerUpDelta?: number;
}

/** One season's points total behind a career points figure. */
export interface RecordSeasonPoints {
  season: RecordSeason;
  points: number;
}

/** A match row with its game's title joined, as the records read it. */
export interface RecordMatchRow extends CareerMatchRow {
  gameTitle: string;
}

/** One game's share of a match record: `count` of its `outOf` matches. */
export interface RecordMatchLine {
  seasonNumber: number;
  seasonSlug: string;
  gameSlug: string;
  gameTitle: string;
  count: number;
  outOf: number;
}

/** One player's input to the records derivation. */
export interface RecordsPlayerInput {
  player: RecordPlayer;
  /** One row per season played, ascending. */
  seasons: CareerSeasonRow[];
  /** Every game played, ascending by season, then game ordinal (play order). */
  games: RecordGameRow[];
  /** Every decided head-to-head match played, same ordering. */
  matches: RecordMatchRow[];
}

/** One season where two players tied on points and placement split them. */
export interface RecordTiebreak {
  season: RecordSeason;
  opponent: RecordPlayer;
  /** True when this player got the better placement. */
  won: boolean;
}

/** One player's line in a record. */
export interface RecordEntry {
  player: RecordPlayer;
  /** 1-based. Entries that tie share a rank (1, 1, 3). */
  rank: number;
  /** The figure the record is about (a count, a streak length, an average). */
  value: number;
  /** The sample behind `value`, for "x of y" records and averages. */
  outOf?: number;
  /** The season the entry is about (best single season). */
  season?: RecordSeason;
  /** The title the entry is about (title specialist). */
  title?: { id: string; name: string };
  /** The seasons behind the entry (tiebreak record), ascending. */
  tiebreaks?: RecordTiebreak[];
  /** The per-season totals behind the entry (total points record), ascending. */
  seasonPoints?: RecordSeasonPoints[];
  /** The per-game breakdown behind the entry (match records), in play order. */
  matchLines?: RecordMatchLine[];
  /** The individual matches behind the entry (opponent streak), in play order. */
  matches?: RecordMatchRow[];
  /** The opponent the entry is about (opponent streak). */
  opponent?: RecordPlayer;
  /** Average placement in own picks and in everyone else's (home advantage). */
  split?: { own: number; others: number };
  /** The other half of a pair record (closest rivalry); `player` is the first. */
  partner?: RecordPlayer;
  /**
   * A pair's head-to-head finishing record (closest rivalry): games `player`
   * finished ahead of `partner` and the reverse, plus how often the two took
   * first and second between them and how those split.
   */
  pair?: {
    ahead: number;
    behind: number;
    oneTwo: number;
    oneTwoFirst: number;
    seasons: { season: RecordSeason; ahead: number; behind: number }[];
  };
  /** The games behind the figure, in play order. Empty when not game-based. */
  games: RecordEntryGame[];
}

/** Who is best at one tag: every player's average under it, best first. */
export interface TagCrown {
  tag: Tag;
  /** `value` is the average placement, `outOf` the games played under the tag. */
  entries: RecordEntry[];
}

/** One player's line on the all-time career board. */
export interface CareerBoardRow {
  player: RecordPlayer;
  /** 1-based; shared when every ordering key is equal. */
  rank: number;
  /** Sum of season placement-points (1st = 4 … 4th = 1). The ordering key. */
  placementPoints: number;
  /** Final placement per season, aligned with `RecordsView.seasons`; null = did not play. */
  placements: (number | null)[];
  /** Seasons won. */
  championships: number;
  /** Individual games won. */
  gameWins: number;
  /** Mean placement over every game played, raw. 0 when none. */
  averageGamePlacement: number;
}

/** Everything the /records page renders from. */
export interface RecordsView {
  /** Every season with results, ascending — the scope the records cover. */
  seasons: RecordSeason[];
  board: CareerBoardRow[];
  /** Games won. */
  mostGameWins: RecordEntry[];
  /** Each player's best season by average game placement. */
  bestSeason: RecordEntry[];
  /** Consecutive game wins in play order, running across seasons. */
  longestWinStreak: RecordEntry[];
  /** Consecutive games finishing first or second, same ordering. */
  longestTopTwoStreak: RecordEntry[];
  /** Consecutive games finishing in the top three, same ordering. */
  longestTopThreeStreak: RecordEntry[];
  /** Wins in games the player chose; `outOf` is how many they chose. */
  homeTurf: RecordEntry[];
  /** Wins in games someone else chose; `outOf` is how many of those they played. */
  awayWins: RecordEntry[];
  /** Most wins at one title the player has played at least twice. */
  titleSpecialist: RecordEntry[];
  /**
   * Points ties: `value` is how many the player won, `outOf` how many they were
   * part of. Ranked on the win RATE (value / outOf), then the larger sample.
   */
  tiebreaks: RecordEntry[];
  /**
   * Head-to-head matches: `value` is how many the player won, `outOf` how many
   * they played. Ranked on the win rate, then the larger sample.
   */
  matchWins: RecordEntry[];
  /**
   * Sweeps: among matches longer than one game (bo3/bo5, `outOf`), `value` is
   * how many the player won without losing a game. Ranked on that rate.
   */
  matchSweeps: RecordEntry[];
  /**
   * Deciders: series that went the full distance (2–1, 3–2). `value` won of
   * `outOf` played, ranked on the rate. Needs a minimum number of deciders.
   */
  matchDeciders: RecordEntry[];
  /**
   * Finals: `value` won of `outOf` reached, one per game (a grand-final reset
   * counts as one final, decided by its last match). Ranked on the rate.
   */
  finals: RecordEntry[];
  /**
   * Flawless tournaments: head-to-head games in which the player won every
   * match they played (a minimum number of matches applies).
   */
  flawlessGames: RecordEntry[];
  /**
   * Longest run of consecutive match wins over ONE opponent, across seasons.
   * Each player enters with their best; `opponent` names who it was against.
   */
  opponentStreak: RecordEntry[];
  /**
   * Home advantage: average placement in others' picks minus in own picks
   * (higher = a bigger boost at home). `split` carries both averages, `outOf`
   * the number of own picks, `games` the own picks.
   */
  homeAdvantage: RecordEntry[];
  /** Average placement in the last game of each season; `outOf` is seasons. */
  seasonCloser: RecordEntry[];
  /** Average placement in the FIRST game of each season; `outOf` is seasons. */
  seasonOpener: RecordEntry[];
  /**
   * Games as all-time wins leader: after each game in the archive, who has the
   * most game wins. `value` counts the games a player led or shared the lead
   * after, `outOf` those they led alone.
   */
  winsLeader: RecordEntry[];
  /**
   * Closest rivalry: one entry per PAIR (`player` + `partner`), most level
   * first. `value` is the gap between the two (0 = level); `pair` has the rest.
   */
  rivalries: RecordEntry[];
  /** Raw season points summed over the career; `outOf` is seasons played. */
  totalPoints: RecordEntry[];
  /**
   * Net power-up points over the career (can be negative); `outOf` is the games
   * where power-ups moved the player's score. Players never affected are left out.
   */
  powerUpPoints: RecordEntry[];
  /** One crown per tag, unfiltered — the consumer applies any minimum sample. */
  tagCrowns: TagCrown[];
  /**
   * The same crowns with every player's own game picks left out — people pick
   * what they are good at, which skews the full list.
   */
  tagCrownsWithoutOwnPicks: TagCrown[];
}

/* -------------------------------------------------------------------------- */
/* Pair (two players, head to head)                                           */
/* -------------------------------------------------------------------------- */

/**
 * Pair view-models: the /vs page. Where the records compare ALL players, these
 * describe ONE pair, and every figure is over what the two shared — games both
 * played, seasons both finished, matches against each other — never over
 * either player's whole career. The two sides are `a` and `b` in the order the
 * caller asked for them (the URL order); nothing here ranks one over the other.
 */

export type PairSide = 'a' | 'b';

/** One game both played, with both final placements. */
export interface PairGame {
  seasonNumber: number;
  seasonSlug: string;
  gameSlug: string;
  gameTitle: string;
  /** Play order within the season (game.ordinal). */
  ordinal: number;
  /** Each side's final placement in the game. */
  a: number;
  b: number;
  tags: Tag[];
  /** Which of the two chose the game; null when someone else did. */
  pickedBy: PairSide | null;
}

/**
 * Who finished ahead over a set of shared games: `a` and `b` count the games
 * each finished ahead of the other, `level` those where they placed the same.
 */
export interface PairTally {
  a: number;
  b: number;
  level: number;
  /** The games behind the tally, in play order. */
  games: PairGame[];
}

/** One head-to-head match between the two. */
export interface PairMatch {
  seasonNumber: number;
  seasonSlug: string;
  gameSlug: string;
  gameTitle: string;
  /** The series length as a number: 1, 3 or 5. */
  bestOf: number;
  /** Game rows each side won in the match. */
  a: number;
  b: number;
  winner: PairSide;
  /** Bracket position (`F`, `GF`, `SF1`, …); null in a round-robin. */
  slotId: string | null;
}

/** Match wins each way over a set of the pair's matches, in play order. */
export interface PairMatchTally {
  a: number;
  b: number;
  matches: PairMatch[];
}

/** One season both finished. */
export interface PairSeason {
  season: RecordSeason;
  a: { placement: number; totalPoints: number };
  b: { placement: number; totalPoints: number };
  /** Who got the better final placement; null if the two are equal. */
  ahead: PairSide | null;
  /** Who finished ahead, game by game, that season. */
  tally: PairTally;
}

/** One category (tag) over the games the two shared under it. */
export interface PairCategory {
  tag: Tag;
  tally: PairTally;
}

/** The pure pair derivation's output: DB facts plus the joined game rows. */
export interface PairStats {
  a: RecordPlayer;
  b: RecordPlayer;
  /** Every shared season, ascending. */
  seasons: PairSeason[];
  /** Seasons each finished ahead of the other in. */
  seasonsAhead: { a: number; b: number };
  /** Who finished ahead over every shared game. */
  finishedAhead: PairTally;
  /** Their matches against each other, with one sub-tally per series length. */
  matches: PairMatchTally & {
    byBestOf: ({ bestOf: number } & PairMatchTally)[];
  };
  /** Runs of consecutive match wins over the other. */
  matchRuns: {
    /** The run standing after their latest match; null when they never met. */
    current: { side: PairSide; matches: PairMatch[] } | null;
    /** Each side's longest (the later one when two are equally long). */
    longest: { a: PairMatch[]; b: PairMatch[] };
  };
  /** Runs of consecutive shared games finishing ahead of the other. */
  gameRuns: {
    /**
     * The run standing after their latest shared game; null when they placed
     * level in it (a level game breaks a run).
     */
    current: { side: PairSide; games: PairGame[] } | null;
    /** Each side's longest (the later one when two are equally long). */
    longest: { a: PairGame[]; b: PairGame[] };
  };
  /** Who finished ahead, split by whose pick the game was. */
  picks: { a: PairTally; b: PairTally; others: PairTally };
  /** One entry per tag, the most level first. Unfiltered (no minimum sample). */
  categories: PairCategory[];
  moments: {
    /** Each side's best season against the other, by points margin; null if none. */
    bestSeason: { a: PairSeason | null; b: PairSeason | null };
  };
}

/** One side of the /vs masthead. */
export interface PairPlayerView extends RecordPlayer {
  /** Latest season's nickname. */
  nickname: string;
  /** The dedicated hero portrait when one exists, else the latest card art. */
  imagePath: string;
  /** Everyone else this player has shared a game with (the pair switcher). */
  opponents: RecordPlayer[];
}

/** Everything the /vs page renders from. */
export interface PairView extends Omit<PairStats, 'a' | 'b'> {
  a: PairPlayerView;
  b: PairPlayerView;
}

/** One opponent's line in the career page's head-to-head list. */
export interface PairSummary {
  opponent: RecordPlayer;
  /** Shared games this player finished ahead in, behind in, and level in. */
  ahead: number;
  behind: number;
  level: number;
  /** Matches against the opponent won and lost. */
  matchWins: number;
  matchLosses: number;
}
