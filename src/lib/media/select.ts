import { MEDIA_KIND_ORDER, type MediaItemView } from './view-models';

/*
 * Pure selections over the resolved items, which arrive in rotation order
 * (created_at, id). No IO and no static data.
 */

/** Kind order first; within a kind the incoming order is kept. */
export function byKind(items: MediaItemView[]): MediaItemView[] {
  return [...items].sort(
    (a, b) =>
      MEDIA_KIND_ORDER.indexOf(a.kind) - MEDIA_KIND_ORDER.indexOf(b.kind),
  );
}

export function forSeason(
  items: MediaItemView[],
  season: number,
): MediaItemView[] {
  return items.filter((item) => item.season === season && !item.gameSlug);
}

export function forGame(
  items: MediaItemView[],
  season: number,
  gameSlug: string,
): MediaItemView[] {
  return items.filter(
    (item) => item.season === season && item.gameSlug === gameSlug,
  );
}

export function forPlayer(
  items: MediaItemView[],
  playerSlug: string,
): MediaItemView[] {
  return items.filter((item) => item.playerSlugs.includes(playerSlug));
}

export function forPair(
  items: MediaItemView[],
  a: string,
  b: string,
): MediaItemView[] {
  return items.filter(
    (item) => item.playerSlugs.includes(a) && item.playerSlugs.includes(b),
  );
}

/** One item per calendar day, the same for everyone; wraps. */
export function ofTheDay(
  items: MediaItemView[],
  dayNumber: number,
): MediaItemView | null {
  if (items.length === 0) return null;
  return items[dayNumber % items.length];
}
