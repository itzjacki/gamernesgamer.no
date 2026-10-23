import type { TagStat } from '@/lib/results/view-models';

/**
 * Games a tag needs before it is ranked. A presentation rule: deliberately not
 * applied in the results layer, which returns `tagStats` unfiltered.
 */
export const MIN_RANKED_GAMES = 3;

export function splitRanked<T extends string>(stats: TagStat<T>[]) {
  return {
    ranked: stats.filter((s) => s.games >= MIN_RANKED_GAMES),
    unranked: stats.filter((s) => s.games < MIN_RANKED_GAMES),
  };
}
