import type { IsoDate, SeasonMeta } from '@/types/season-meta';

/**
 * Display formatting for a season's structured dates (`SeasonMeta.start` /
 * `end`). Norwegian numeric style, day first: "13.12.2025". Pure string work —
 * no Date objects, so no time zone can shift a day.
 */

/** "2025-12-13" → "13.12.2025". */
export function formatDay(date: IsoDate): string {
  const [year, month, day] = date.split('-');
  return `${day}.${month}.${year}`;
}

/** "13.12.2025 – 14.12.2025", or one date for a one-day season. */
export function formatSeasonDates({ start, end }: SeasonMeta): string {
  return start === end
    ? formatDay(start)
    : `${formatDay(start)} – ${formatDay(end)}`;
}
