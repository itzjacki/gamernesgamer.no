import { currentSeason, seasonData, type Season } from '@/data/sesong';
import { allPlayers } from '@/lib/players/roster';
import {
  getAllPairSlugs,
  getSeasonChampions,
  type SeasonChampion,
} from '@/lib/results/queries';
import SiteHeaderBar, { type HeaderData } from './SiteHeaderBar';

/**
 * The site header ("Tangenter"): a rail of keys (site nav) over a display row
 * that each page's context fills. Server half: assembles the small, static-ish
 * data bundle the bar needs (seasons, champions, players, valid pairs). The
 * bar itself is a client component because it reads the pathname and runs
 * the choosers.
 */

/** "13/12/2025 – 14/12/2025" → "13.12.2025" (the first day). */
function firstDay(raw: string) {
  const m = raw.match(/(\d{2})\/(\d{2})\/(\d{4})/);
  return m ? `${m[1]}.${m[2]}.${m[3]}` : raw;
}

export default async function SiteHeader() {
  // The header must never take the site down: without results it simply
  // shows no champions.
  let champions: SeasonChampion[] = [];
  try {
    champions = await getSeasonChampions();
  } catch (error) {
    console.error('SiteHeader: could not load season champions', error);
  }
  const championOf = (slug: string) =>
    champions.find((c) => c.seasonSlug === slug)?.champion ?? null;

  const slugs = (Object.keys(seasonData) as Season[]).sort();
  const data: HeaderData = {
    currentSeason,
    seasons: slugs.map((slug) => {
      const { meta, games } = seasonData[slug];
      const champion = championOf(slug);
      return {
        slug,
        number: Number(slug),
        date: firstDay(meta.date),
        games: games.length,
        status: meta.status,
        champion: champion
          ? { slug: champion.slug, name: champion.name }
          : null,
      };
    }),
    players: allPlayers().map((p) => ({
      slug: p.slug,
      name: p.name,
      seasons: p.seasons.length,
      titles: champions.filter((c) => c.champion?.slug === p.slug).length,
    })),
    pairs: getAllPairSlugs().map((p) => `${p.a}|${p.b}`),
  };

  return <SiteHeaderBar data={data} />;
}
