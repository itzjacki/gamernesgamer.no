import 'server-only';

import { fetchSeasonBundle } from './fetch';
import { assembleSeasonView, assembleGameView } from './derive';
import type { SeasonView, GameView } from './view-models';

/**
 * Public read API. Pages call these and nothing else in the module.
 *
 * Contract (so pages can wire boundaries correctly):
 * - Returns null when the season/game does not exist → page calls notFound().
 * - Throws on a real fetch/derivation error → page's error.tsx handles it.
 *
 * One DB pass per call via fetchSeasonBundle; derivation is pure and in-memory.
 * getGameView reuses the same bundle shape, so a page rendering both the season
 * and a game does at most one fetch each (dataset is tiny; no shared cache yet).
 *
 * NOTE: these view-models are DB-derived only (slugs, names, placements,
 * points). When a view-model needs STATIC content (game title, thumbnail,
 * gamer image), a compose step joins src/data/sesong by slug — added at the
 * point of need, kept out of the pure derivation.
 */

export async function getSeasonView(
  seasonNumber: number,
): Promise<SeasonView | null> {
  const bundle = await fetchSeasonBundle(seasonNumber);
  if (!bundle) return null;
  return assembleSeasonView(bundle);
}

export async function getGameView(
  seasonNumber: number,
  gameSlug: string,
): Promise<GameView | null> {
  const bundle = await fetchSeasonBundle(seasonNumber);
  if (!bundle) return null;
  return assembleGameView(bundle, gameSlug);
}
