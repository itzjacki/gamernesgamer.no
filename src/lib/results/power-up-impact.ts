import type { PlayerRef } from './view-models';
import type { ComposedSeasonView } from './compose';

/*
 * PURE. Each player's season points split into the ladder and power-ups (and
 * curses). Never re-ranks: placements come from season_result, since
 * tiebreaks can override totals.
 */

export interface PowerUpImpactRow {
  player: PlayerRef;
  /** Ladder points only. */
  basePoints: number;
  /** Signed net of every power-up and curse use. */
  powerUpPoints: number;
  totalPoints: number;
}

/**
 * Most base points first; level players keep the standings order. Null when
 * the season had no power-up or curse uses.
 */
export function derivePowerUpImpact(
  view: ComposedSeasonView,
): PowerUpImpactRow[] | null {
  const used = view.games.some((g) =>
    g.results.some((r) => r.powerUpUses.length > 0),
  );
  if (!used) return null;

  return (
    view.standings
      .map((s) => {
        const results = view.games.flatMap((g) =>
          g.results.filter(
            (r) => r.player.seasonPlayerId === s.player.seasonPlayerId,
          ),
        );
        return {
          player: s.player,
          basePoints: results.reduce((sum, r) => sum + r.ladderPoints, 0),
          powerUpPoints: results.reduce((sum, r) => sum + r.powerUpDelta, 0),
          totalPoints: s.totalPoints,
        };
      })
      // Stable, so level players keep the standings order.
      .sort((a, b) => b.basePoints - a.basePoints)
  );
}
