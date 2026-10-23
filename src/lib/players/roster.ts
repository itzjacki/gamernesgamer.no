import type { Gamer } from '@/types/gamer';
import { seasonData } from '@/data/sesong';
import type { Season } from '@/data/sesong';

/**
 * The cross-season player roster from static season content (no results, no
 * IO). `name` is the cross-season identity key; nickname and portrait may
 * change per season.
 */

export interface RosterPlayer {
  slug: string;
  name: string;
  /** Ascending. */
  seasons: Season[];
  /** Gamer entry from the most recent season (latest nickname/portrait). */
  latest: Gamer;
}

/**
 * Must produce the slugs seeded in the DB (`player.slug`). If a new player's
 * name doesn't round-trip, fix the seed or this mapping — not the call site.
 */
export function playerSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/æ/g, 'ae')
    .replace(/ø/g, 'o')
    .replace(/å/g, 'a')
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/** Sorted by seasons played (most first), then by name. */
export function allPlayers(): RosterPlayer[] {
  // Ascending, so the last write to `latest` is the most recent season.
  const seasons = Object.keys(seasonData).sort() as Season[];

  const byName = new Map<string, RosterPlayer>();
  for (const season of seasons) {
    for (const gamer of seasonData[season].gamers) {
      const existing = byName.get(gamer.name);
      if (existing) {
        existing.seasons.push(season);
        existing.latest = gamer;
      } else {
        byName.set(gamer.name, {
          slug: playerSlug(gamer.name),
          name: gamer.name,
          seasons: [season],
          latest: gamer,
        });
      }
    }
  }

  return [...byName.values()].sort(
    (a, b) =>
      b.seasons.length - a.seasons.length || a.name.localeCompare(b.name, 'no'),
  );
}
