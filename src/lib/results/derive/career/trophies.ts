import type { SeasonView } from '../../view-models';
import type { CareerTrophy } from '../../view-models';

/**
 * PURE. Derives one player's trophy shelf from the already-assembled per-season
 * views. A trophy is awarded for:
 *  - season podium finishes: placement 1/2/3 → season-gold/silver/bronze,
 *  - winning any individual game that season (game_result placement 1) → game-gold.
 *
 * Takes assembled SeasonViews (not raw bundles) so the placement/points facts
 * come from the single authoritative season assembler — the career layer never
 * re-derives placements. `slug` selects the player across seasons.
 *
 * Output order is display order: all season trophies first (by significance
 * gold→silver→bronze, then season asc within each tier), then all game-golds
 * (by season asc, then game ordinal).
 */

const SEASON_PODIUM_KIND = {
  1: 'season-gold',
  2: 'season-silver',
  3: 'season-bronze',
} as const;

export function deriveTrophies(
  slug: string,
  seasonViews: SeasonView[],
): CareerTrophy[] {
  const season: CareerTrophy[] = [];
  const game: CareerTrophy[] = [];

  // Ascending by season number so both groups come out in season order.
  const views = [...seasonViews].sort(
    (a, b) => a.seasonNumber - b.seasonNumber,
  );

  for (const view of views) {
    const standing = view.standings.find((s) => s.player.slug === slug);
    if (standing && standing.placement <= 3) {
      season.push({
        kind: SEASON_PODIUM_KIND[standing.placement as 1 | 2 | 3],
        seasonNumber: view.seasonNumber,
        seasonSlug: view.seasonSlug,
      });
    }

    // Per-game golds: games are already ordinal-ordered by the assembler.
    for (const g of view.games) {
      const winner = g.results.find((r) => r.placement === 1);
      if (winner && winner.player.slug === slug) {
        game.push({
          kind: 'game-gold',
          seasonNumber: view.seasonNumber,
          seasonSlug: view.seasonSlug,
          gameSlug: g.slug,
        });
      }
    }
  }

  // Season podium trophies sort by significance first (gold→silver→bronze),
  // then by age (season ascending) within each tier.
  const kindRank: Record<string, number> = {
    'season-gold': 0,
    'season-silver': 1,
    'season-bronze': 2,
  };
  season.sort(
    (a, b) =>
      (kindRank[a.kind] ?? 0) - (kindRank[b.kind] ?? 0) ||
      a.seasonNumber - b.seasonNumber,
  );

  return [...season, ...game];
}
