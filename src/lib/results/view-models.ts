/**
 * The only result types a component should see: camelCase, players resolved,
 * pre-sorted. A component never resolves a season_player.id, sums points or
 * re-sorts standings; snake_case DB rows stay inside fetch/compose/derive.
 */

import type { GamerStats } from '@/types/gamer';
import type { Tag } from '@/types/tag';

export interface PlayerRef {
  /** season_player.id, not player.id — for keys/lookups, not display. */
  seasonPlayerId: string;
  slug: string;
  name: string;
}

/** Pre-ordered, pre-ranked. */
export interface SeasonStandingRow {
  player: PlayerRef;
  /** Authoritative — from season_result. */
  placement: number;
  /** Derived (sum of per-game points). Display only; never ranks. */
  totalPoints: number;
  isChampion: boolean;
  note: string | null;
}

/**
 * DB facts only — the display name/description are static content, joined in
 * compose by `slug`. Zero-delta uses are included.
 */
export interface PowerUpUseEntry {
  slug: string;
  /** Not used for colour; may inform copy. */
  isCurse: boolean;
  /** Signed; can be negative or 0. */
  pointsDelta: number;
}

export interface GamePlacementRow {
  player: PlayerRef;
  /** Authoritative — from game_result. */
  placement: number;
  ladderPoints: number;
  powerUpDelta: number;
  /** ladderPoints + powerUpDelta. */
  points: number;
  /**
   * Includes zero-delta uses; `powerUpDelta` is exactly the sum of their
   * `pointsDelta`. Empty array (never undefined) when none applied.
   */
  powerUpUses: PowerUpUseEntry[];
  note: string | null;
}

/**
 * Decided from the match's game rows (who won more); undecided matches are
 * absent. Ordered by stage, then leg, so repeat meetings appear in play order.
 */
export interface GameMatch {
  playerA: PlayerRef;
  playerB: PlayerRef;
  /** 1, 3 or 5. */
  bestOf: number;
  /** Never equal. */
  winsA: number;
  winsB: number;
  /** Bracket position (`F`, `GF`, `BR`, `SF1`, …); null in a round-robin. */
  slotId: string | null;
}

export interface GameSummary {
  /** Matches the static data key and route segment. */
  slug: string;
  ordinal: number;
  /** Ordered by placement. */
  results: GamePlacementRow[];
  matches: GameMatch[];
}

export interface CumulativePoint {
  ordinal: number;
  /** Running total through this game, inclusive. */
  total: number;
}

export interface PlayerSeries {
  player: PlayerRef;
  /** One per game, ordered by ordinal. */
  points: CumulativePoint[];
}

export interface SeasonView {
  seasonNumber: number;
  /** Zero-padded (e.g. "01"). */
  seasonSlug: string;
  players: PlayerRef[];
  /** Ordered by placement. */
  standings: SeasonStandingRow[];
  /** Ordered by game ordinal. */
  games: GameSummary[];
  /** Same order as `players`. Empty when the season has no results yet. */
  series: PlayerSeries[];
}

/* -------------------------------------------------------------------------- */
/* Player career (cross-season)                                               */
/* -------------------------------------------------------------------------- */

/*
 * derive/career emits the DB-only `Career*` shapes; compose joins static
 * content (nicknames, card art, game titles) into the `*View` shapes.
 */

export type TrophyKind =
  | 'season-gold'
  | 'season-silver'
  | 'season-bronze'
  | 'game-gold'; // won an individual game within a season

export interface CareerTrophy {
  kind: TrophyKind;
  seasonNumber: number;
  seasonSlug: string;
  /** game-gold only. */
  gameSlug?: string;
}

export interface CareerSeasonRow {
  seasonNumber: number;
  seasonSlug: string;
  /** Authoritative — from season_result. */
  placement: number;
  totalPoints: number;
  isChampion: boolean;
}

export interface CareerGameRow {
  seasonNumber: number;
  seasonSlug: string;
  gameSlug: string;
  /** Authoritative — from game_result. */
  placement: number;
  powerUpDelta: number;
  ordinal: number;
}

/** From the player's side. */
export interface CareerMatchRow {
  seasonNumber: number;
  seasonSlug: string;
  gameSlug: string;
  /** 1, 3 or 5. */
  bestOf: number;
  gamesWon: number;
  gamesLost: number;
  won: boolean;
  opponent: { slug: string; name: string };
  /** Bracket position (`F`, `GF`, `BR`, `SF1`, …); null in a round-robin. */
  slotId: string | null;
}

export interface TagGameResult {
  seasonNumber: number;
  seasonSlug: string;
  gameSlug: string;
  gameTitle: string;
  /** Authoritative — from game_result. */
  placement: number;
  /** The player chose this game themselves (static `chosenBy`). */
  ownPick: boolean;
}

/**
 * No minimum sample is applied — a tag with one game is still listed. Which
 * tags are meaningful enough to rank is the consuming component's call.
 */
export interface TagStat<
  T extends string,
  R extends { placement: number } = TagGameResult,
> {
  tag: T;
  games: number;
  wins: number;
  /** Raw (unrounded); lower is better. */
  averagePlacement: number;
  /** Chronological. */
  results: R[];
}

export interface CareerLedger {
  seasonsPlayed: number;
  /** Mean final season placement, raw (unrounded). */
  averagePlacement: number;
  /** Mean over every game played, raw. 0 when no game results exist yet. */
  averageGamePlacement: number;
  careerPoints: number;
  /** Lowest placement; tiebreak = closeness. */
  bestSeasonNumber: number;
  /** Equals bestSeasonNumber for a single-season player. */
  worstSeasonNumber: number;
}

/**
 * No names/images/titles (those are composed). `slug`/`name` are the
 * cross-season player identity — DB facts, not static content.
 */
export interface CareerStats {
  slug: string;
  name: string;
  ledger: CareerLedger;
  /** Ascending by season. */
  seasons: CareerSeasonRow[];
  /**
   * Season trophies first (gold→silver→bronze, then by season), then game-gold
   * (by season, then game ordinal).
   */
  trophies: CareerTrophy[];
  /** Ascending by season, then game ordinal. */
  games: CareerGameRow[];
  /** Same ordering as `games`. */
  matches: CareerMatchRow[];
}

/* -------- composed (static content joined) -------- */

export interface CareerTrophyView extends CareerTrophy {
  /** game-gold only. */
  gameTitle?: string;
}

/** Nickname, image and stats vary per season. */
export interface CareerCard {
  seasonNumber: number;
  seasonSlug: string;
  nickname: string;
  imagePath: string;
  stats?: GamerStats;
}

/** Isolated so the OG card can export this exact shape. */
export interface CareerHero {
  name: string;
  /** Latest season's. */
  nickname: string;
  /** The dedicated hero image when present, else the latest card art. */
  imagePath: string;
  heroImageIsFallback: boolean;
}

export interface CareerView {
  slug: string;
  hero: CareerHero;
  ledger: CareerLedger;
  seasons: CareerSeasonRow[];
  trophies: CareerTrophyView[];
  /** Ascending by season. */
  cards: CareerCard[];
  /** Best first; genre and format tags rank together. Unfiltered. */
  tagStats: TagStat<Tag>[];
  /**
   * Own picks left out — people pick what they are good at, which skews the
   * full list.
   */
  tagStatsWithoutOwnPicks: TagStat<Tag>[];
}

/* -------------------------------------------------------------------------- */
/* Records (all players, cross-season)                                        */
/* -------------------------------------------------------------------------- */

/*
 * Everything normalizes off placement, never raw points (ladders differ per
 * season) — except `totalPoints` and `powerUpPoints`, which sum raw points on
 * purpose. Each record is a best-first list with shared ranks: a tie is two
 * rank-1 entries, never a hidden tiebreak.
 */

export interface RecordPlayer {
  slug: string;
  name: string;
}

export interface RecordSeason {
  seasonNumber: number;
  seasonSlug: string;
}

/** Static facts joined in compose, so the derivation imports no static data. */
export interface RecordGameRow extends TagGameResult {
  /** The cross-season title this instance belongs to (CS:GO and CS2 are one). */
  titleId: string;
  titleName: string;
  tags: Tag[];
  powerUpDelta: number;
  ordinal: number;
}

export interface RecordEntryGame extends TagGameResult {
  /** Absent on tag-crown entries. */
  powerUpDelta?: number;
}

export interface RecordSeasonPoints {
  season: RecordSeason;
  points: number;
}

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

export interface RecordsPlayerInput {
  player: RecordPlayer;
  /** Ascending. */
  seasons: CareerSeasonRow[];
  /** Ascending by season, then game ordinal (play order). */
  games: RecordGameRow[];
  /** Same ordering as `games`. */
  matches: RecordMatchRow[];
}

/** A season where two players tied on points and placement split them. */
export interface RecordTiebreak {
  season: RecordSeason;
  opponent: RecordPlayer;
  won: boolean;
}

/**
 * The optional fields are one or two per kind of record, and nothing in the
 * type says which record sets which. If more record kinds are added, split
 * this into a discriminated union rather than adding more optionals.
 */
export interface RecordEntry {
  player: RecordPlayer;
  /** 1-based. Ties share a rank (1, 1, 3). */
  rank: number;
  value: number;
  /** The sample behind `value`, for "x of y" records and averages. */
  outOf?: number;
  /** Best single season. */
  season?: RecordSeason;
  /** Title specialist. */
  title?: { id: string; name: string };
  /** Tiebreak record; ascending. */
  tiebreaks?: RecordTiebreak[];
  /** Total points record; ascending. */
  seasonPoints?: RecordSeasonPoints[];
  /** Match records; play order. */
  matchLines?: RecordMatchLine[];
  /** Opponent streak; play order. */
  matches?: RecordMatchRow[];
  /** Opponent streak. */
  opponent?: RecordPlayer;
  /** Home advantage: average placement in own picks vs everyone else's. */
  split?: { own: number; others: number };
  /** Closest rivalry: the other half of the pair; `player` is the first. */
  partner?: RecordPlayer;
  /**
   * Closest rivalry: games `player` finished ahead of `partner` and the
   * reverse, plus how often the two took first and second and how that split.
   */
  pair?: {
    ahead: number;
    behind: number;
    oneTwo: number;
    oneTwoFirst: number;
    seasons: { season: RecordSeason; ahead: number; behind: number }[];
  };
  /** Play order. Empty when not game-based. */
  games: RecordEntryGame[];
}

export interface TagCrown {
  tag: Tag;
  /** `value` is the average placement, `outOf` the games played under the tag. */
  entries: RecordEntry[];
}

export interface CareerBoardRow {
  player: RecordPlayer;
  /** 1-based; shared only when every ordering key is equal. */
  rank: number;
  /** Sum of season placement-points (1st = 4 … 4th = 1). The ordering key. */
  placementPoints: number;
  /** Aligned with `RecordsView.seasons`; null = did not play. */
  placements: (number | null)[];
  championships: number;
  gameWins: number;
  /** Raw. 0 when none. */
  averageGamePlacement: number;
}

export interface RecordsView {
  /** Every season with results, ascending — the scope the records cover. */
  seasons: RecordSeason[];
  board: CareerBoardRow[];
  mostGameWins: RecordEntry[];
  /** Each player's best season by average game placement. */
  bestSeason: RecordEntry[];
  /** Streaks run in play order, across seasons. */
  longestWinStreak: RecordEntry[];
  longestTopTwoStreak: RecordEntry[];
  longestTopThreeStreak: RecordEntry[];
  /** Wins in games the player chose; `outOf` is how many they chose. */
  homeTurf: RecordEntry[];
  /** Wins in games someone else chose; `outOf` is how many of those they played. */
  awayWins: RecordEntry[];
  /** Most wins at one title the player has played at least twice. */
  titleSpecialist: RecordEntry[];
  /**
   * Points ties won (`value`) of those taken part in (`outOf`). Ranked on the
   * rate, then the larger sample.
   */
  tiebreaks: RecordEntry[];
  /** Won of played, ranked on the rate, then the larger sample. */
  matchWins: RecordEntry[];
  /** Among bo3/bo5 matches (`outOf`), those won without losing a game. */
  matchSweeps: RecordEntry[];
  /**
   * Series that went the full distance (2–1, 3–2), won of played. Needs a
   * minimum number of deciders.
   */
  matchDeciders: RecordEntry[];
  /**
   * Won of reached, one per game: a grand-final reset counts as one final,
   * decided by its last match.
   */
  finals: RecordEntry[];
  /** Games in which the player won every match (a minimum number applies). */
  flawlessGames: RecordEntry[];
  /** Each player's longest match-win run over ONE opponent, across seasons. */
  opponentStreak: RecordEntry[];
  /**
   * Average placement in others' picks minus in own picks (higher = bigger
   * boost at home). `outOf` and `games` are the own picks.
   */
  homeAdvantage: RecordEntry[];
  /** Last game of each season; `outOf` is seasons. */
  seasonCloser: RecordEntry[];
  /** First game of each season; `outOf` is seasons. */
  seasonOpener: RecordEntry[];
  /**
   * Who has the most game wins after each game in the archive. `value` counts
   * games led or shared the lead after, `outOf` those led alone.
   */
  winsLeader: RecordEntry[];
  /**
   * One entry per PAIR (`player` + `partner`), most level first. `value` is the
   * gap between the two (0 = level).
   */
  rivalries: RecordEntry[];
  /** Raw season points; `outOf` is seasons played. */
  totalPoints: RecordEntry[];
  /**
   * Net, can be negative; `outOf` is the games where power-ups moved the
   * player's score. Players never affected are left out.
   */
  powerUpPoints: RecordEntry[];
  /** Unfiltered — the consumer applies any minimum sample. */
  tagCrowns: TagCrown[];
  /**
   * Own picks left out — people pick what they are good at, which skews the
   * full list.
   */
  tagCrownsWithoutOwnPicks: TagCrown[];
}

/* -------------------------------------------------------------------------- */
/* Pair (two players, head to head)                                           */
/* -------------------------------------------------------------------------- */

/*
 * Every figure is over what the two shared — games both played, seasons both
 * finished, matches against each other — never either player's whole career.
 * `a` and `b` are in URL order; nothing here ranks one over the other.
 */

export type PairSide = 'a' | 'b';

export interface PairGame {
  seasonNumber: number;
  seasonSlug: string;
  gameSlug: string;
  gameTitle: string;
  ordinal: number;
  /** Each side's final placement. */
  a: number;
  b: number;
  tags: Tag[];
  /** null when someone else picked it. */
  pickedBy: PairSide | null;
}

/** `a`/`b` count games each finished ahead; `level` those placed the same. */
export interface PairTally {
  a: number;
  b: number;
  level: number;
  /** Play order. */
  games: PairGame[];
}

export interface PairMatch {
  seasonNumber: number;
  seasonSlug: string;
  gameSlug: string;
  gameTitle: string;
  /** 1, 3 or 5. */
  bestOf: number;
  /** Game rows each side won. */
  a: number;
  b: number;
  winner: PairSide;
  /** Bracket position (`F`, `GF`, `SF1`, …); null in a round-robin. */
  slotId: string | null;
}

/** Match wins each way; matches in play order. */
export interface PairMatchTally {
  a: number;
  b: number;
  matches: PairMatch[];
}

export interface PairSeason {
  season: RecordSeason;
  a: { placement: number; totalPoints: number };
  b: { placement: number; totalPoints: number };
  /** null if the placements are equal. */
  ahead: PairSide | null;
  tally: PairTally;
}

export interface PairCategory {
  tag: Tag;
  tally: PairTally;
}

export interface PairStats {
  a: RecordPlayer;
  b: RecordPlayer;
  /** Ascending. */
  seasons: PairSeason[];
  seasonsAhead: { a: number; b: number };
  finishedAhead: PairTally;
  matches: PairMatchTally & {
    byBestOf: ({ bestOf: number } & PairMatchTally)[];
  };
  matchRuns: {
    /** The run standing after their latest match; null when they never met. */
    current: { side: PairSide; matches: PairMatch[] } | null;
    /** The later one when two are equally long. */
    longest: { a: PairMatch[]; b: PairMatch[] };
  };
  gameRuns: {
    /** null when they placed level in their latest shared game (a level game breaks a run). */
    current: { side: PairSide; games: PairGame[] } | null;
    /** The later one when two are equally long. */
    longest: { a: PairGame[]; b: PairGame[] };
  };
  picks: { a: PairTally; b: PairTally; others: PairTally };
  /** Most level first. Unfiltered (no minimum sample). */
  categories: PairCategory[];
  moments: {
    /** By points margin; null if none. */
    bestSeason: { a: PairSeason | null; b: PairSeason | null };
  };
}

export interface PairPlayerView extends RecordPlayer {
  /** Latest season's. */
  nickname: string;
  /** The dedicated hero portrait when one exists, else the latest card art. */
  imagePath: string;
}

export interface PairView extends Omit<PairStats, 'a' | 'b'> {
  a: PairPlayerView;
  b: PairPlayerView;
}

/** One opponent's line in the career page's head-to-head list. */
export interface PairSummary {
  opponent: RecordPlayer;
  ahead: number;
  behind: number;
  level: number;
  matchWins: number;
  matchLosses: number;
}

/* -------------------------------------------------------------------------- */
/* Archive totals (front page)                                                */
/* -------------------------------------------------------------------------- */

export interface ArchiveTotals {
  /** Seasons with a confirmed season_result placement 1. */
  seasons: number;
  /** Games with at least one confirmed result. */
  games: number;
  /** Decided matches in those games. */
  matches: number;
  /** Includes zero-delta uses. */
  powerUpsFired: number;
}

/* -------------------------------------------------------------------------- */
/* Season changes (front page, just crowned)                                  */
/* -------------------------------------------------------------------------- */

export type RecordKey = {
  [K in keyof RecordsView]: RecordsView[K] extends RecordEntry[] ? K : never;
}[keyof RecordsView];

/**
 * How a record's or crown's holders (the rank-1 entries) changed:
 *
 * - `new` — nobody held it before.
 * - `taken` — a new holder appeared and an old holder dropped out.
 * - `tied` — every old holder still holds it, joined by someone new.
 * - `untied` — it was shared, and fewer of the same holders share it now.
 * - `improved` — the same holders, with a better figure (records only).
 */
export type HolderChangeKind = 'new' | 'taken' | 'tied' | 'untied' | 'improved';

export interface RecordChange {
  /** The consumer maps it to a label and a plate id. */
  key: RecordKey;
  kind: HolderChangeKind;
  /** Rank-1 entries; `before` is empty for `new`. */
  before: RecordEntry[];
  after: RecordEntry[];
  /**
   * Not implied by `taken`: a rate record changes hands when its holder's rate
   * drops below someone else's.
   */
  better: boolean;
}

export interface BoardMove {
  player: RecordPlayer;
  /** null when the player was not on the board yet. */
  before: number | null;
  after: number;
}

export interface CrownChange {
  tag: Tag;
  kind: Exclude<HolderChangeKind, 'improved'>;
  /** Rank-1 entries; `before` is empty for `new`. */
  before: RecordEntry[];
  after: RecordEntry[];
}

/** All lists may be empty. */
export interface RecordsDiff {
  /** In `RecordsView` field order. */
  records: RecordChange[];
  /** Best `after` rank first. */
  board: BoardMove[];
  /** In the after view's crown order (largest sample first). */
  crowns: CrownChange[];
}

/** The latest finished season's diff. */
export interface SeasonChanges extends RecordsDiff {
  season: RecordSeason;
}
