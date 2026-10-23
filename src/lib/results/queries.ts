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
  PlayerRef,
  SeasonView,
  GameView,
  CareerView,
  RecordsView,
  PairView,
  PairSummary,
} from './view-models';
import { allPlayers } from '../players/roster';
import { deriveArchiveTotals } from './derive/totals';
import type { ArchiveTotals } from './view-models';
import { diffRecords } from './derive/records/changes';
import type { SeasonChanges } from './view-models';
import { seasonData } from '@/data/sesong';

/**
 * Public read API — pages call these and nothing else in the module.
 * Returns null → page calls notFound(); throws → page's error.tsx.
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
 * Static data only, no IO. A player with no confirmed results still gets a
 * param; getCareerView then returns null → notFound().
 */
export function getAllPlayerSlugs(): string[] {
  return allPlayers().map((p) => p.slug);
}

/**
 * Null when the slug matches no roster in any season. The hero portrait is
 * resolved here, not in compose, so compose stays IO-free.
 */
export async function getCareerView(slug: string): Promise<CareerView | null> {
  const bundles = await fetchAllSeasonBundles();
  const stats = assembleCareer(bundles, slug);
  if (!stats) return null;

  const view = composeCareerView(stats);
  return { ...view, hero: resolveHeroImage(slug, view.hero) };
}

/** Never null — with no confirmed results every record is simply empty. */
export async function getRecordsView(): Promise<RecordsView> {
  const bundles = await fetchAllSeasonBundles();
  return composeRecordsView(assembleAllCareers(bundles));
}

export interface SeasonChampion {
  seasonNumber: number;
  seasonSlug: string;
  /** Null until results exist. */
  champion: PlayerRef | null;
}

/** Seasons without results are absent. */
export async function getSeasonChampions(): Promise<SeasonChampion[]> {
  const bundles = await fetchAllSeasonBundles();
  return bundles.map((bundle) => {
    const view = assembleSeasonView(bundle);
    return {
      seasonNumber: view.seasonNumber,
      seasonSlug: view.seasonSlug,
      champion: view.standings.find((row) => row.isChampion)?.player ?? null,
    };
  });
}

/** Never null — all zeros without results. */
export async function getArchiveTotals(): Promise<ArchiveTotals> {
  const bundles = await fetchAllSeasonBundles();
  return deriveArchiveTotals(bundles.map(assembleSeasonView));
}

/**
 * What the latest finished season (by `meta.status`) changed in the all-time
 * records: the records up to the season before it, diffed against those up to
 * it. `minCrownGames` is passed in so the ranking minimum stays on the
 * consuming side. Null when no season is finished or there is nothing earlier
 * to compare against.
 */
export async function getSeasonChanges({
  minCrownGames,
}: {
  minCrownGames: number;
}): Promise<SeasonChanges | null> {
  const bundles = await fetchAllSeasonBundles();
  const finished = Object.entries(seasonData)
    .filter(([, season]) => season.meta.status === 'finished')
    .map(([slug]) => Number(slug))
    .filter((n) => bundles.some((b) => b.season.number === n));
  if (finished.length === 0) return null;

  const latest = Math.max(...finished);
  const upTo = (last: number) =>
    composeRecordsView(
      assembleAllCareers(bundles.filter((b) => b.season.number <= last)),
    );

  const before = upTo(latest - 1);
  const after = upTo(latest);
  const season = after.seasons.find((s) => s.seasonNumber === latest);
  if (!season || before.seasons.length === 0) return null;

  return { season, ...diffRecords(before, after, { minCrownGames }) };
}

/**
 * Both orders are listed: /vs/x/y and /vs/y/x are two pages. Static data only —
 * a pair is two players who share a season roster; one with no confirmed
 * results in common gets a param and then notFound().
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
 * Null when either slug is unknown, they are the same player, or the two never
 * shared a game.
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

/** One line per opponent the player has shared a game with. */
export async function getPairSummaries(slug: string): Promise<PairSummary[]> {
  const bundles = await fetchAllSeasonBundles();
  return composePairSummaries(assembleAllCareers(bundles), slug);
}

/** public/images/heroes/<slug>.png when it exists on disk. */
export function findHeroImage(slug: string): string | null {
  const rel = `/images/heroes/${slug}.png`;
  const abs = path.join(process.cwd(), 'public', rel);
  return existsSync(abs) ? rel : null;
}

/** public/images/seasons/<NN>.{jpg,png,webp} when it exists on disk. */
export function findSeasonImage(seasonSlug: string): string | null {
  for (const ext of ['jpg', 'png', 'webp']) {
    const rel = `/images/seasons/${seasonSlug}.${ext}`;
    if (existsSync(path.join(process.cwd(), 'public', rel))) return rel;
  }
  return null;
}

function resolveHeroImage(
  slug: string,
  hero: CareerView['hero'],
): CareerView['hero'] {
  const imagePath = findHeroImage(slug);
  return imagePath ? { ...hero, imagePath, heroImageIsFallback: false } : hero;
}
