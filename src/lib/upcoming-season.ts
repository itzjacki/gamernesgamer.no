import { daysBetween } from '@/lib/site-state';
import type { IsoDate, SeasonMeta } from '@/types/season-meta';

/**
 * The upcoming season and the days left until it starts, for the front page's
 * upcoming state. Pure: today is passed in (`todayInNorway()` from
 * `@/lib/site-state`), so it is testable without a clock.
 *
 * Seasons store calendar days only (no time of day), so the countdown is in
 * whole days.
 */

export type Countdown =
  /** The season starts in `days` days (always ≥ 1). */
  | { kind: 'days'; days: number }
  /** The season starts today. */
  | { kind: 'today' };

/**
 * The countdown to `start` from `today`, or `null` once the start has passed
 * (the season is running or over, even if its status hasn't been flipped yet).
 */
export function countdownTo(start: IsoDate, today: IsoDate): Countdown | null {
  const days = daysBetween(today, start);
  if (days < 0) return null;
  if (days === 0) return { kind: 'today' };
  return { kind: 'days', days };
}

/**
 * The season registered as `upcoming`, or `undefined` if there is none. If more
 * than one is (not expected), the one starting first wins.
 */
export function findUpcomingSeason<Slug extends string>(
  seasons: Record<Slug, { meta: SeasonMeta }>,
): { slug: Slug; meta: SeasonMeta } | undefined {
  return (Object.keys(seasons) as Slug[])
    .map((slug) => ({ slug, meta: seasons[slug].meta }))
    .filter(({ meta }) => meta.status === 'upcoming')
    .sort((a, b) => a.meta.start.localeCompare(b.meta.start))[0];
}
