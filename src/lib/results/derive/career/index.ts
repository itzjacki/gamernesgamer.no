import type { SeasonBundle } from '../../raw';
import type {
  SeasonView,
  CareerStats,
  CareerSeasonRow,
} from '../../view-models';
import { assembleSeasonView } from '../index';
import { deriveLedger } from './ledger';
import { deriveTrophies } from './trophies';

/**
 * PURE. Assembles ONE player's cross-season career from the raw per-season
 * bundles. No IO, no async — the function the career unit tests exercise.
 *
 * The career layer never re-derives placements or points: it runs the existing
 * per-season assembler on each bundle and reads the authoritative SeasonView
 * (season_result placements, derived totals, per-game golds). So season and
 * career numbers agree by construction.
 *
 * A player is identified by `slug` (cross-season player identity). Only seasons
 * the player actually competed in contribute rows. Returns null when the slug
 * matches no roster in any season (caller maps to notFound()).
 */
export function assembleCareer(
  bundles: SeasonBundle[],
  slug: string,
): CareerStats | null {
  const views: SeasonView[] = bundles
    .map(assembleSeasonView)
    .sort((a, b) => a.seasonNumber - b.seasonNumber);

  // Per-season rows for THIS player, plus the season-internal "closeness"
  // (player points / field-max points) used only as the best/worst tiebreak.
  const seasons: CareerSeasonRow[] = [];
  const closenessBySeason = new Map<number, number>();
  let name: string | null = null;

  for (const view of views) {
    const standing = view.standings.find((s) => s.player.slug === slug);
    if (!standing) continue; // player didn't compete this season

    name = standing.player.name;
    seasons.push({
      seasonNumber: view.seasonNumber,
      seasonSlug: view.seasonSlug,
      placement: standing.placement,
      totalPoints: standing.totalPoints,
      isChampion: standing.isChampion,
    });

    const fieldMax = Math.max(0, ...view.standings.map((s) => s.totalPoints));
    closenessBySeason.set(
      view.seasonNumber,
      fieldMax > 0 ? standing.totalPoints / fieldMax : 0,
    );
  }

  if (seasons.length === 0 || name === null) return null;

  return {
    slug,
    name,
    ledger: deriveLedger(seasons, closenessBySeason),
    seasons,
    trophies: deriveTrophies(slug, views),
  };
}
