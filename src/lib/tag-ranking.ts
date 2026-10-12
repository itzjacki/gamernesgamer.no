import type { TagStat } from '@/lib/results/view-models';

/**
 * A presentation rule, shared by the components that name a player's best or
 * worst tag (TagRecord, CareerLedger): a tag needs this many games before it is
 * ranked. Deliberately NOT applied in the results layer — `tagStats` arrive
 * unfiltered and each consumer decides what to do with the rest.
 */
export const MIN_RANKED_GAMES = 3;

/** Splits best-first stats into ranked and unranked, preserving their order. */
export function splitRanked<T extends string>(stats: TagStat<T>[]) {
  return {
    ranked: stats.filter((s) => s.games >= MIN_RANKED_GAMES),
    unranked: stats.filter((s) => s.games < MIN_RANKED_GAMES),
  };
}
