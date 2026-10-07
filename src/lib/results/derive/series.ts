import type {
  GameSummary,
  PlayerRef,
  PlayerSeries,
  CumulativePoint,
} from '../view-models';

/**
 * PURE. No IO, no async. Builds each player's cumulative season-points line
 * across the games, in ordinal order — the data behind the points-over-games
 * chart (the narrative "race": who led, who collapsed, the comeback).
 *
 * Operates on the already-derived GameSummary[] (not raw rows): a player's
 * contribution to a game is `GamePlacementRow.points` (ladder + power-up delta,
 * already resolved). Running-sums those in ordinal order.
 *
 * Contract:
 *  - `games` need not be pre-sorted; this sorts a copy by ordinal.
 *  - One point per game per player, so every line has the same length and the
 *    same x-axis (ordinals) — the chart can assume aligned series.
 *  - A player absent from a game's results contributes 0 that game (their line
 *    stays flat), rather than breaking the series. In practice every roster
 *    player places in every game, but this keeps the derivation total.
 *  - Players with no games yet get an empty `points` array.
 */
export function cumulativeSeries(
  games: GameSummary[],
  players: PlayerRef[],
): PlayerSeries[] {
  const ordered = [...games].sort((a, b) => a.ordinal - b.ordinal);

  return players.map((player) => {
    let running = 0;
    const points: CumulativePoint[] = ordered.map((game) => {
      const row = game.results.find(
        (r) => r.player.seasonPlayerId === player.seasonPlayerId,
      );
      running += row?.points ?? 0;
      return { ordinal: game.ordinal, total: running };
    });
    return { player, points };
  });
}
