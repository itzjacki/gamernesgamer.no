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

/**
 * One season's worth of raw rows, fetched in a single pass. Flat arrays — the
 * derivation layer does the nesting. Only the tables the first slice needs are
 * included; H2H/rounds tables (match, match_game, round, round_result, stage)
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
}
