import type { IsoDate, SeasonMeta } from '@/types/season-meta';

/**
 * The site's state, driving the front page. Exactly one at a time:
 *
 * - `upcoming` — the next season is registered (`status: 'upcoming'`). This
 *   ends a just-crowned window early: announcing a season moves the site on.
 * - `live` — a season is running (`status: 'live'`).
 * - `justCrowned` — a season finished within the last `JUST_CROWNED_DAYS`
 *   (counted from its `end`).
 * - `dormant` — everything else.
 */
export type SiteState = 'upcoming' | 'live' | 'justCrowned' | 'dormant';

export const SITE_STATES: SiteState[] = [
  'upcoming',
  'live',
  'justCrowned',
  'dormant',
];

/** The just-crowned window. Hard-coded until it is set from the admin panel. */
export const JUST_CROWNED_DAYS = 42;

/** Today in Norway as `YYYY-MM-DD` (the same calendar as `SeasonMeta`). */
export function todayInNorway(): IsoDate {
  // en-CA formats as YYYY-MM-DD.
  return new Date().toLocaleDateString('en-CA', {
    timeZone: 'Europe/Oslo',
  }) as IsoDate;
}

/** Whole days from `from` to `to`; both are calendar dates, so no zone applies. */
export function daysBetween(from: IsoDate, to: IsoDate): number {
  return Math.round((Date.parse(to) - Date.parse(from)) / 86_400_000);
}

export function deriveSiteState(
  metas: SeasonMeta[],
  today: IsoDate,
): SiteState {
  if (metas.some((meta) => meta.status === 'live')) return 'live';
  if (metas.some((meta) => meta.status === 'upcoming')) return 'upcoming';

  const lastEnd = metas
    .filter((meta) => meta.status === 'finished')
    .map((meta) => meta.end)
    .sort()
    .at(-1);
  if (lastEnd && daysBetween(lastEnd, today) <= JUST_CROWNED_DAYS) {
    return 'justCrowned';
  }
  return 'dormant';
}

export function isSiteState(value: string | undefined): value is SiteState {
  return SITE_STATES.includes(value as SiteState);
}
