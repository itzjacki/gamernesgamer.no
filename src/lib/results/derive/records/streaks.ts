/**
 * `games` in play order. Runs carry across season boundaries. When two runs are
 * equally long the most recent one is returned.
 */
export function longestStreak<G>(
  games: readonly G[],
  qualifies: (game: G) => boolean,
): G[] {
  let best: G[] = [];
  let current: G[] = [];

  for (const game of games) {
    current = qualifies(game) ? [...current, game] : [];
    if (current.length > 0 && current.length >= best.length) best = current;
  }
  return best;
}
