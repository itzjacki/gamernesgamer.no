import type { CareerLedger, CareerSeasonRow } from '../../view-models';

/**
 * PURE. Flat career totals from one player's per-season rows.
 *
 * - seasonsPlayed: number of seasons the player competed in (rows present).
 * - averagePlacement: mean of final season placements over PARTICIPATED seasons
 *   only (a season the player didn't play is not a "missing" value — it's not
 *   counted). Stored raw; the UI rounds (toFixed(1)).
 * - careerPoints: sum of every season's total points.
 * - best/worst season: primary key is placement (lower = better). TIEBREAK is
 *   "closeness" — the player's season points as a fraction of the max points any
 *   player scored that season (how close to the leader): higher closeness is the
 *   better season. Final deterministic tiebreak: earlier season number. For a
 *   single-season player best === worst (the UI collapses the two).
 *
 * `closenessBySeason` carries the precomputed fraction per season number — the
 * caller derives it (it needs the field max, which is season-internal), so this
 * module stays a pure function of the rows + that map.
 */
export function deriveLedger(
  seasons: CareerSeasonRow[],
  closenessBySeason: Map<number, number>,
): CareerLedger {
  if (seasons.length === 0) {
    throw new Error('deriveLedger: a career must have at least one season.');
  }

  const seasonsPlayed = seasons.length;
  const averagePlacement =
    seasons.reduce((sum, s) => sum + s.placement, 0) / seasonsPlayed;
  const careerPoints = seasons.reduce((sum, s) => sum + s.totalPoints, 0);

  const closeness = (seasonNumber: number) =>
    closenessBySeason.get(seasonNumber) ?? 0;

  // Best: lower placement wins; tie → higher closeness; tie → earlier season.
  const best = [...seasons].sort(
    (a, b) =>
      a.placement - b.placement ||
      closeness(b.seasonNumber) - closeness(a.seasonNumber) ||
      a.seasonNumber - b.seasonNumber,
  )[0];

  // Worst: higher placement wins; tie → lower closeness; tie → earlier season.
  const worst = [...seasons].sort(
    (a, b) =>
      b.placement - a.placement ||
      closeness(a.seasonNumber) - closeness(b.seasonNumber) ||
      a.seasonNumber - b.seasonNumber,
  )[0];

  return {
    seasonsPlayed,
    averagePlacement,
    careerPoints,
    bestSeasonNumber: best.seasonNumber,
    worstSeasonNumber: worst.seasonNumber,
  };
}
