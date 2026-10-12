/**
 * PURE. The longest unbroken run of games that `qualifies`, from a list in play
 * order. Runs carry across season boundaries: the list is simply every game the
 * player played, so the last game of one season and the first of the next are
 * neighbours. When two runs are equally long the most recent one is returned.
 * Empty when no game qualifies.
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
