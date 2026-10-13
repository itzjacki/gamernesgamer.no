import type { Tables } from '../supabase/database.types';

/**
 * Raw row aliases over the generated DB types. These stay inside the module —
 * fetch.ts produces them, derive/** consumes them, components never see them.
 */
export type SeasonRow = Tables<'season'>;
export type SeasonPlayerRow = Tables<'season_player'>;
export type PlayerRow = Tables<'player'>;
export type SeasonLadderRow = Tables<'season_ladder'>;
export type GameRow = Tables<'game'>;
export type GameResultRow = Tables<'game_result'>;
export type PowerUpRow = Tables<'power_up'>;
export type PowerUpUseRow = Tables<'power_up_use'>;
export type StageRow = Tables<'stage'>;
export type MatchRow = Tables<'match'>;
export type MatchGameRow = Tables<'match_game'>;

/**
 * One season's worth of raw rows, fetched in a single pass. Flat arrays — the
 * derivation layer does the nesting. The H2H tables (stage, match, match_game)
 * are included for the match records; the rounds tables (round, round_result)
 * are added when their derivations land.
 *
 * `players` are the player identity rows for this season's roster (joined in
 * fetch so derivation can resolve season_player.id → name/slug without IO).
 */
export interface SeasonBundle {
  season: SeasonRow;
  roster: SeasonPlayerRow[];
  players: PlayerRow[];
  ladder: SeasonLadderRow[];
  games: GameRow[];
  gameResults: GameResultRow[];
  /** Power-up anchors for the season — slug + is_curse live here, not on uses. */
  powerUps: PowerUpRow[];
  powerUpUses: PowerUpUseRow[];
  seasonResults: Tables<'season_result'>[];
  /** Every stage of the season's games — the link from a match to its game. */
  stages: StageRow[];
  /** Head-to-head matches, and the game rows that decide them. */
  matches: MatchRow[];
  matchGames: MatchGameRow[];
}
