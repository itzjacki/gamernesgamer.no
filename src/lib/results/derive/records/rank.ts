import type { RecordEntry } from '../../view-models';

/** A record line before it has been ranked against the others. */
export type UnrankedEntry = Omit<RecordEntry, 'rank'>;

/**
 * PURE. Sorts best first by `compare` and assigns 1-based ranks. Entries that
 * `compare` calls equal SHARE a rank (1, 1, 3) — a tie stays a tie rather than
 * being settled by a key the reader can't see. Within a tie the order is by
 * player name, only so the output is deterministic.
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

/** Higher `value` first — the ordering of every plain count record. */
export const byValueDesc = (a: UnrankedEntry, b: UnrankedEntry) =>
  b.value - a.value;

/** `value` as a share of `outOf`, higher first; then the larger sample. */
export const byRateDesc = (a: UnrankedEntry, b: UnrankedEntry) =>
  b.value / (b.outOf || 1) - a.value / (a.outOf || 1) ||
  (b.outOf ?? 0) - (a.outOf ?? 0);

/** Count records name who did something, not who didn't: drop the zeros. */
export const withoutZeros = (entries: UnrankedEntry[]) =>
  entries.filter((e) => e.value > 0);
