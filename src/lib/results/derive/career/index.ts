import type { SeasonBundle } from '../../raw';
import type {
  SeasonView,
  CareerStats,
  CareerSeasonRow,
  CareerGameRow,
  CareerMatchRow,
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
  return careerFromViews(seasonViews(bundles), slug);
}

/**
 * PURE. Every player's career, for the pages that compare players (/records).
 * A player is anyone on a season roster with a final standing. Ordered by slug,
 * only so the output is deterministic — callers rank it themselves.
 */
export function assembleAllCareers(bundles: SeasonBundle[]): CareerStats[] {
  const views = seasonViews(bundles);
  const slugs = new Set(
    views.flatMap((view) => view.standings.map((s) => s.player.slug)),
  );
  return [...slugs]
    .sort()
    .map((slug) => careerFromViews(views, slug))
    .filter((career) => career !== null);
}

/** Every season's assembled view, ascending by season number. */
function seasonViews(bundles: SeasonBundle[]): SeasonView[] {
  return bundles
    .map(assembleSeasonView)
    .sort((a, b) => a.seasonNumber - b.seasonNumber);
}

/** One player's career from already-assembled, season-ascending views. */
function careerFromViews(
  views: SeasonView[],
  slug: string,
): CareerStats | null {
  // Per-season rows for THIS player, plus the season-internal "closeness"
  // (player points / field-max points) used only as the best/worst tiebreak.
  const seasons: CareerSeasonRow[] = [];
  const games: CareerGameRow[] = [];
  const matches: CareerMatchRow[] = [];
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

    // Games are already ordinal-ordered by the assembler.
    for (const g of view.games) {
      for (const m of g.matches) {
        const isA = m.playerA.slug === slug;
        if (!isA && m.playerB.slug !== slug) continue;
        const gamesWon = isA ? m.winsA : m.winsB;
        const gamesLost = isA ? m.winsB : m.winsA;
        matches.push({
          seasonNumber: view.seasonNumber,
          seasonSlug: view.seasonSlug,
          gameSlug: g.slug,
          bestOf: m.bestOf,
          gamesWon,
          gamesLost,
          won: gamesWon > gamesLost,
          opponent: isA
            ? { slug: m.playerB.slug, name: m.playerB.name }
            : { slug: m.playerA.slug, name: m.playerA.name },
          slotId: m.slotId,
        });
      }

      const result = g.results.find((r) => r.player.slug === slug);
      if (!result) continue;
      games.push({
        seasonNumber: view.seasonNumber,
        seasonSlug: view.seasonSlug,
        gameSlug: g.slug,
        placement: result.placement,
        powerUpDelta: result.powerUpDelta,
        ordinal: g.ordinal,
      });
    }

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
    ledger: deriveLedger(seasons, closenessBySeason, games),
    seasons,
    trophies: deriveTrophies(slug, views),
    games,
    matches,
  };
}
