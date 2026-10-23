import type { Tables } from '../supabase/database.types';

/** Raw DB row types. They stay inside the module; components never see them. */
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
 * One season's raw rows as flat arrays; derivation does the nesting. `players`
 * lets derivation resolve season_player.id → name/slug without IO.
 */
export interface SeasonBundle {
  season: SeasonRow;
  roster: SeasonPlayerRow[];
  players: PlayerRow[];
  ladder: SeasonLadderRow[];
  games: GameRow[];
  gameResults: GameResultRow[];
  /** slug + is_curse live here, not on uses. */
  powerUps: PowerUpRow[];
  powerUpUses: PowerUpUseRow[];
  seasonResults: Tables<'season_result'>[];
  /** The link from a match to its game. */
  stages: StageRow[];
  matches: MatchRow[];
  matchGames: MatchGameRow[];
}
