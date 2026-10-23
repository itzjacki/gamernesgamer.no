import type {
  CareerGameRow,
  CareerLedger,
  CareerSeasonRow,
} from '../../view-models';

/**
 * PURE. Averages are over seasons/games actually played. Best/worst season is
 * by placement, then "closeness" (season points as a fraction of that season's
 * max — closer to the leader is better), then the earlier season.
 */
export function deriveLedger(
  seasons: CareerSeasonRow[],
  closenessBySeason: Map<number, number>,
  games: CareerGameRow[],
): CareerLedger {
  if (seasons.length === 0) {
    throw new Error('deriveLedger: a career must have at least one season.');
  }

  const seasonsPlayed = seasons.length;
  const averagePlacement =
    seasons.reduce((sum, s) => sum + s.placement, 0) / seasonsPlayed;
  const averageGamePlacement =
    games.length > 0
      ? games.reduce((sum, g) => sum + g.placement, 0) / games.length
      : 0;
  const careerPoints = seasons.reduce((sum, s) => sum + s.totalPoints, 0);

  const closeness = (seasonNumber: number) =>
    closenessBySeason.get(seasonNumber) ?? 0;

  const best = [...seasons].sort(
    (a, b) =>
      a.placement - b.placement ||
      closeness(b.seasonNumber) - closeness(a.seasonNumber) ||
      a.seasonNumber - b.seasonNumber,
  )[0];

  const worst = [...seasons].sort(
    (a, b) =>
      b.placement - a.placement ||
      closeness(a.seasonNumber) - closeness(b.seasonNumber) ||
      a.seasonNumber - b.seasonNumber,
  )[0];

  return {
    seasonsPlayed,
    averagePlacement,
    averageGamePlacement,
    careerPoints,
    bestSeasonNumber: best.seasonNumber,
    worstSeasonNumber: worst.seasonNumber,
  };
}
