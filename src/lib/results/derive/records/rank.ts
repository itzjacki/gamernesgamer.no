import type { RecordEntry } from '../../view-models';

export type UnrankedEntry = Omit<RecordEntry, 'rank'>;

/**
 * Entries `compare` calls equal SHARE a rank (1, 1, 3) — a tie is never settled
 * by a key the reader can't see. Name order within a tie is only for
 * determinism.
 */
export function rankEntries(
  entries: UnrankedEntry[],
  compare: (a: UnrankedEntry, b: UnrankedEntry) => number,
): RecordEntry[] {
  const sorted = [...entries].sort(
    (a, b) => compare(a, b) || a.player.name.localeCompare(b.player.name),
  );

  const ranked: RecordEntry[] = [];
  sorted.forEach((entry, index) => {
    const previous = ranked[index - 1];
    const tied = previous !== undefined && compare(previous, entry) === 0;
    ranked.push({ ...entry, rank: tied ? previous.rank : index + 1 });
  });
  return ranked;
}

export const byValueDesc = (a: UnrankedEntry, b: UnrankedEntry) =>
  b.value - a.value;

/** Rate (`value` / `outOf`), then the larger sample. */
export const byRateDesc = (a: UnrankedEntry, b: UnrankedEntry) =>
  b.value / (b.outOf || 1) - a.value / (a.outOf || 1) ||
  (b.outOf ?? 0) - (a.outOf ?? 0);

export const withoutZeros = (entries: UnrankedEntry[]) =>
  entries.filter((e) => e.value > 0);
