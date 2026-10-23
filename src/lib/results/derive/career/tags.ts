import type { TagStat } from '../../view-models';

/*
 * Averages are compared at one decimal — the precision they are shown at — so
 * two tags that read the same on the page are tied and fall through to the
 * tie-breaks (more games, more wins, tag name).
 */
const shown = (average: number) => Number(average.toFixed(1));

export function deriveTagStats<
  T extends string,
  R extends { placement: number },
>(rows: { tags: readonly T[]; result: R }[]): TagStat<T, R>[] {
  const byTag = new Map<T, R[]>();

  for (const row of rows) {
    for (const tag of row.tags) {
      const results = byTag.get(tag) ?? [];
      results.push(row.result);
      byTag.set(tag, results);
    }
  }

  return [...byTag.entries()]
    .map(([tag, results]) => ({
      tag,
      games: results.length,
      wins: results.filter((r) => r.placement === 1).length,
      averagePlacement:
        results.reduce((sum, r) => sum + r.placement, 0) / results.length,
      results,
    }))
    .sort(
      (a, b) =>
        shown(a.averagePlacement) - shown(b.averagePlacement) ||
        b.games - a.games ||
        b.wins - a.wins ||
        a.tag.localeCompare(b.tag),
    );
}
