import type { RecordSeason } from '../../view-models';

export const isWin = (game: { placement: number }) => game.placement === 1;

export const wins = (games: readonly { placement: number }[]) =>
  games.filter(isWin).length;

/** Mean placement. Callers guard against an empty list. */
export const mean = (games: readonly { placement: number }[]) =>
  games.reduce((sum, g) => sum + g.placement, 0) / games.length;

/** An average at the precision it is displayed with, so what reads equal ties. */
export const shown = (average: number, decimals: number) =>
  Number(average.toFixed(decimals));

export const seasonRef = (row: {
  seasonNumber: number;
  seasonSlug: string;
}): RecordSeason => ({
  seasonNumber: row.seasonNumber,
  seasonSlug: row.seasonSlug,
});

export const gameKey = (row: { seasonSlug: string; gameSlug: string }) =>
  `${row.seasonSlug}/${row.gameSlug}`;

/** Keeps first-seen key order and item order. */
export function groupBy<T, K>(
  items: readonly T[],
  keyOf: (item: T) => K,
): Map<K, T[]> {
  const groups = new Map<K, T[]>();
  for (const item of items) {
    const group = groups.get(keyOf(item));
    if (group) group.push(item);
    else groups.set(keyOf(item), [item]);
  }
  return groups;
}
