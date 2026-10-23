import type {
  GameSummary,
  PlayerRef,
  PlayerSeries,
  CumulativePoint,
} from '../view-models';

/**
 * PURE. One point per game per player, so every line shares the same x-axis
 * and the chart can assume aligned series. A player absent from a game's
 * results contributes 0 there (the line stays flat) rather than breaking it.
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
