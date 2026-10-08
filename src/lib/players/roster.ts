import type { Gamer } from '@/types/gamer';
import { seasonData } from '@/data/sesong';
import type { Season } from '@/data/sesong';

/**
 * PURE, no IO. The cross-season player roster derived from the STATIC season
 * content in src/data/sesong. This is the static-data counterpart to the
 * results layer's PlayerRef resolution: the player index and (later) the career
 * pages need an all-time list of players and a stable slug per player, but they
 * read no results, so they can't go through the DB-backed derive layer.
 *
 * `name` is the cross-season identity key (the same convention compose.ts uses
 * to join DB results to static gamers: "the static Gamer type has no slug; name
 * is its identity within a season roster"). A player recurs across seasons under
 * the same name even though nickname and portrait can change per season.
 */

/** One player across all seasons they appear in. */
export interface RosterPlayer {
  /** URL slug — matches the DB `player.slug` (see `playerSlug`). */
  slug: string;
  /** Display name and cross-season identity key (e.g. "Jørgen"). */
  name: string;
  /** Seasons the player appears in, ascending (e.g. ['01', '02', '04']). */
  seasons: Season[];
  /** The player's gamer entry from their most recent season (latest nickname/portrait). */
  latest: Gamer;
}

/**
 * Deterministic name → URL slug, matching the slugs seeded in the DB
 * (`player.slug`): lowercase, Norwegian characters transliterated to ASCII,
 * everything else collapsed to hyphens. Verified against supabase/seed.sql:
 * Jakob→jakob, Jørgen→jorgen, Tobias→tobias, William→william.
 *
 * This is a deliberate single source of truth for the mapping so the static
 * index and the DB stay in lockstep — if a future player's name doesn't
 * round-trip to their seeded slug, that's a seeding mismatch to fix here (or in
 * the seed), not something to paper over at the call site.
 */
export function playerSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/æ/g, 'ae')
    .replace(/ø/g, 'o')
    .replace(/å/g, 'a')
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '') // strip remaining combining diacritics
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/**
 * Every player who has ever competed, keyed by name across seasons, sorted by
 * number of seasons played (most-tenured first), then alphabetically. Each
 * player's `latest` gamer entry comes from their highest-numbered season, so the
 * index shows their current nickname and portrait.
 *
 * The one grouping seam the career pages reuse (name → appearances): callers
 * get a resolved RosterPlayer and never re-scan the per-season gamer lists.
 */
export function allPlayers(): RosterPlayer[] {
  // Seasons in ascending slug order ('01' < '02' < ...) so the last write to a
  // player's `latest` is their most recent season.
  const seasons = Object.keys(seasonData).sort() as Season[];

  const byName = new Map<string, RosterPlayer>();
  for (const season of seasons) {
    for (const gamer of seasonData[season].gamers) {
      const existing = byName.get(gamer.name);
      if (existing) {
        existing.seasons.push(season);
        existing.latest = gamer; // ascending order ⇒ latest season wins
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
