import type { TagStat } from '../../view-models';

/**
 * PURE. Groups one player's game results by tag. Each row arrives with its tags
 * already resolved — tags are static content, so the caller (compose) does that
 * join and this module imports no static data. The `result` payload is carried
 * through untouched; only its `placement` is read.
 *
 * - A game with several tags counts toward each of them; a game with none
 *   counts toward nothing.
 * - No minimum sample: every tag with at least one game is returned. Whether a
 *   tag has enough games to be ranked is the consuming component's decision.
 *
 * Output order is best first: lower average placement, then more games, then
 * more wins, then tag name (deterministic). Averages are compared at one
 * decimal — the precision they are shown at — so two tags that read the same
 * on the page count as tied and fall through to the tie-breaks. Within a tag,
 * `results` keep the input order.
 */
/** An average at the one decimal it is displayed with (matches toFixed(1)). */
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
