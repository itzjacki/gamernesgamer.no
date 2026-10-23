import type { ArchiveTotals, SeasonView } from '../view-models';

/**
 * PURE. A game counts once it has confirmed results; its matches and power-up
 * uses are empty without them, so nothing unconfirmed is counted.
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
