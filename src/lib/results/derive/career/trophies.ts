import type { SeasonView } from '../../view-models';
import type { CareerTrophy } from '../../view-models';

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
