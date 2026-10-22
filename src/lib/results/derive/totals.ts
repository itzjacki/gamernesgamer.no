import type { ArchiveTotals, SeasonView } from '../view-models';

/**
 * PURE. The archive's running counts across every season's view. Reads only
 * what the season assembler already settled: a game counts once it has
 * confirmed results, and its matches and power-up uses come with it (both are
 * empty on a game without results), so nothing unconfirmed is counted.
 */
export function deriveArchiveTotals(views: SeasonView[]): ArchiveTotals {
  const games = views.flatMap((view) =>
    view.games.filter((game) => game.results.length > 0),
  );

  return {
    seasons: views.filter((view) => view.standings.some((r) => r.isChampion))
      .length,
    games: games.length,
    matches: games.reduce((sum, game) => sum + game.matches.length, 0),
    powerUpsFired: games.reduce(
      (sum, game) =>
        sum + game.results.reduce((n, row) => n + row.powerUpUses.length, 0),
      0,
    ),
  };
}
