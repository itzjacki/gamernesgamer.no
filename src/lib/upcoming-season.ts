import { daysBetween } from '@/lib/site-state';
import type { IsoDate, SeasonMeta } from '@/types/season-meta';

/** Pure: `today` is passed in. Seasons store days only, so counts are whole days. */

/** `days` is always ≥ 1; the start day itself is `today`. */
export type Countdown = { kind: 'days'; days: number } | { kind: 'today' };

/** `null` once the start has passed, even if status hasn't been flipped yet. */
export function countdownTo(start: IsoDate, today: IsoDate): Countdown | null {
  const days = daysBetween(today, start);
  if (days < 0) return null;
  if (days === 0) return { kind: 'today' };
  return { kind: 'days', days };
}

/** If more than one is `upcoming` (not expected), the earliest start wins. */
export function findUpcomingSeason<Slug extends string>(
  seasons: Record<Slug, { meta: SeasonMeta }>,
): { slug: Slug; meta: SeasonMeta } | undefined {
  return (Object.keys(seasons) as Slug[])
    .map((slug) => ({ slug, meta: seasons[slug].meta }))
    .filter(({ meta }) => meta.status === 'upcoming')
    .sort((a, b) => a.meta.start.localeCompare(b.meta.start))[0];
}
