import type { IsoDate, SeasonMeta } from '@/types/season-meta';

/**
 * Drives the front page. Announcing a season (`upcoming`) ends a just-crowned
 * window early; `justCrowned` counts `JUST_CROWNED_DAYS` from the season's `end`.
 */
export type SiteState = 'upcoming' | 'live' | 'justCrowned' | 'dormant';

export const SITE_STATES: SiteState[] = [
  'upcoming',
  'live',
  'justCrowned',
  'dormant',
];

/** Hard-coded until it is set from the admin panel. */
export const JUST_CROWNED_DAYS = 42;

export function todayInNorway(): IsoDate {
  // en-CA formats as YYYY-MM-DD.
  return new Date().toLocaleDateString('en-CA', {
    timeZone: 'Europe/Oslo',
  }) as IsoDate;
}

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
