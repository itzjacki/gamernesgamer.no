import 'server-only';

import { existsSync } from 'node:fs';
import path from 'node:path';
import { fetchSeasonBundle, fetchAllSeasonBundles } from './fetch';
import { assembleSeasonView, assembleGameView } from './derive';
import { assembleCareer } from './derive/career';
import { composeCareerView } from './compose';
import type { SeasonView, GameView, CareerView } from './view-models';
import { allPlayers } from '../players/roster';

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

/**
 * All player slugs for generateStaticParams on /spillere/[spiller]. Pure static
 * data (the cross-season roster) — no DB, so prerender param generation needs
 * no IO. A player with a roster entry but no confirmed results yet still gets a
 * param; getCareerView then returns null → notFound() for that page.
 */
export function getAllPlayerSlugs(): string[] {
  return allPlayers().map((p) => p.slug);
}

/**
 * The player career page's read API. Fetches every season bundle, derives the
 * cross-season career for `slug`, and joins static content.
 *
 * Contract (same as getSeasonView): returns null when the slug matches no
 * roster in any season (→ notFound()); throws on a real fetch error (→ error.tsx).
 *
 * The dedicated hero portrait is resolved HERE (not in compose) so compose
 * stays pure/IO-free and unit-testable: a background-removed portrait at
 * public/images/heroes/<slug>.png is used when present, otherwise the composer's
 * latest-card-art fallback stands (and heroImageIsFallback stays true).
 */
export async function getCareerView(slug: string): Promise<CareerView | null> {
  const bundles = await fetchAllSeasonBundles();
  const stats = assembleCareer(bundles, slug);
  if (!stats) return null;

  const view = composeCareerView(stats);
  return { ...view, hero: resolveHeroImage(slug, view.hero) };
}

/** Prefer a dedicated hero portrait on disk; else keep the card-art fallback. */
function resolveHeroImage(
  slug: string,
  hero: CareerView['hero'],
): CareerView['hero'] {
  const rel = `/images/heroes/${slug}.png`;
  const abs = path.join(process.cwd(), 'public', rel);
  return existsSync(abs)
    ? { ...hero, imagePath: rel, heroImageIsFallback: false }
    : hero;
}
