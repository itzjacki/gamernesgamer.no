import type { SeasonLadderRow, GameResultRow, PowerUpUseRow } from '../raw';

/**
 * PURE. No IO, no Supabase, no async. Season-points derivation.
 *
 * Points for a (game, player) = season_ladder[placement]
 *   + SUM(power_up_use.points_delta WHERE affected_season_player_id = player).
 * The ladder is season-wide. Points are season-local by construction — this
 * module never sums across seasons (cross-season normalization is a separate,
 * deferred concern).
 */

/** Map placement → ladder points for one season. */
export function ladderByPlacement(
  ladder: SeasonLadderRow[],
): Map<number, number> {
  const map = new Map<number, number>();
  for (const row of ladder) {
    map.set(row.placement, row.points);
  }
  return map;
}

/**
 * Net power-up delta per affected season_player, for a single game.
 * Returns a Map keyed by affected_season_player_id. Players with no power-up
 * effect are absent (callers default to 0).
 */
export function powerUpDeltaByPlayer(
  powerUpUsesForGame: PowerUpUseRow[],
): Map<string, number> {
  const map = new Map<string, number>();
  for (const use of powerUpUsesForGame) {
    const prev = map.get(use.affected_season_player_id) ?? 0;
    map.set(use.affected_season_player_id, prev + use.points_delta);
  }
  return map;
}

export interface GamePoints {
  seasonPlayerId: string;
  placement: number;
  ladderPoints: number;
  powerUpDelta: number;
  points: number;
}

/**
 * Compute each player's points for one game from its game_result rows + the
 * ladder + that game's power-up uses. Throws if a placement has no ladder row
 * (a silent null here would corrupt totals — fail loud instead).
 */
export function gamePoints(
  gameResults: GameResultRow[],
  ladder: Map<number, number>,
  powerUpUsesForGame: PowerUpUseRow[],
): GamePoints[] {
  const deltas = powerUpDeltaByPlayer(powerUpUsesForGame);

  return gameResults.map((gr) => {
    const ladderPoints = ladder.get(gr.placement);
    if (ladderPoints === undefined) {
      throw new Error(
        `No season_ladder row for placement ${gr.placement}; cannot derive points.`,
      );
    }
    const powerUpDelta = deltas.get(gr.season_player_id) ?? 0;
    return {
      seasonPlayerId: gr.season_player_id,
      placement: gr.placement,
      ladderPoints,
      powerUpDelta,
      points: ladderPoints + powerUpDelta,
    };
  });
}
