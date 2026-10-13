import 'server-only';

import { existsSync } from 'node:fs';
import path from 'node:path';
import { fetchSeasonBundle, fetchAllSeasonBundles } from './fetch';
import { assembleSeasonView, assembleGameView } from './derive';
import { assembleCareer, assembleAllCareers } from './derive/career';
import {
  composeCareerView,
  composePairSummaries,
  composePairView,
  composeRecordsView,
} from './compose';
import type {
  SeasonView,
  GameView,
  CareerView,
  RecordsView,
  PairView,
  PairSummary,
} from './view-models';
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

/**
 * The /records page's read API: every season bundle, every player's career, and
 * the records derived across them. Never null — with no confirmed results the
 * board and every record are simply empty. Throws on a real fetch error.
 */
export async function getRecordsView(): Promise<RecordsView> {
  const bundles = await fetchAllSeasonBundles();
  return composeRecordsView(assembleAllCareers(bundles));
}

/**
 * Every ordered pair of players for generateStaticParams on /vs/[a]/[b]. Both
 * orders are listed: the first slug is the page's left-hand side, so /vs/x/y
 * and /vs/y/x are two pages. Pure static data: a pair is two players who share
 * a season roster. A pair with no confirmed results in common still gets a
 * param; getPairView then returns null → notFound().
 */
export function getAllPairSlugs(): { a: string; b: string }[] {
  const players = allPlayers();
  return players.flatMap((a) =>
    players
      .filter(
        (b) =>
          b.slug !== a.slug && b.seasons.some((s) => a.seasons.includes(s)),
      )
      .map((b) => ({ a: a.slug, b: b.slug })),
  );
}

/**
 * The /vs page's read API: `a` against `b`, in that order. Null when either
 * slug is unknown, they are the same player, or the two never shared a game
 * (→ notFound()); throws on a real fetch error.
 */
export async function getPairView(
  a: string,
  b: string,
): Promise<PairView | null> {
  const bundles = await fetchAllSeasonBundles();
  const view = composePairView(assembleAllCareers(bundles), a, b);
  if (!view) return null;

  const withHero = (side: PairView['a']) => ({
    ...side,
    imagePath: findHeroImage(side.slug) ?? side.imagePath,
  });
  return { ...view, a: withHero(view.a), b: withHero(view.b) };
}

/**
 * The career page's head-to-head list: one line per opponent the player has
 * shared a game with. Empty for an unknown slug.
 */
export async function getPairSummaries(slug: string): Promise<PairSummary[]> {
  const bundles = await fetchAllSeasonBundles();
  return composePairSummaries(assembleAllCareers(bundles), slug);
}

/**
 * The player's dedicated hero portrait (public/images/heroes/<slug>.png) when
 * one exists on disk, else null. Shared by the career hero and the player
 * index, so both pick the portrait up the moment the file is added.
 */
export function findHeroImage(slug: string): string | null {
  const rel = `/images/heroes/${slug}.png`;
  const abs = path.join(process.cwd(), 'public', rel);
  return existsSync(abs) ? rel : null;
}

/** Prefer a dedicated hero portrait on disk; else keep the card-art fallback. */
function resolveHeroImage(
  slug: string,
  hero: CareerView['hero'],
): CareerView['hero'] {
  const imagePath = findHeroImage(slug);
  return imagePath ? { ...hero, imagePath, heroImageIsFallback: false } : hero;
}
