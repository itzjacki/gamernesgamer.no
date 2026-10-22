import { existsSync } from 'node:fs';
import path from 'node:path';
import Link from 'next/link';

import { seasonData, type Season } from '@/data/sesong';
import { getCareerView, getSeasonView } from '@/lib/results/queries';
import Heading from './Heading';

/**
 * Beside the trophy in the just-crowned state (under it on phones): the new
 * champion of the latest finished season. The block is their picture (their
 * season card art) with a solid footer under it (design.md, "On the hero"):
 * `bg-bg` with `border`, holding a mono eyebrow with a steady LED and the
 * season, their name, and the two figures that matter — season points and
 * titles now held, both rank-1 data so accent. Nothing else. The whole block
 * is ONE link to their career page; the border takes the accent on hover.
 *
 * With no picture (S1 has no art of its own) the footer stands alone.
 *
 * Self-contained: fetches its own data. Renders nothing until a finished
 * season has a champion.
 */

interface Props {
  /**
   * The season to show. Defaults to the latest finished season with a
   * champion; the page may pass a stand-in to preview.
   */
  season?: Season;
}

const MONO = 'font-mono text-[10px] tracking-[0.2em] uppercase sm:text-xs';

/** Finished seasons, newest first. */
function finishedSeasons(): Season[] {
  return (Object.keys(seasonData) as Season[])
    .filter((slug) => seasonData[slug].meta.status === 'finished')
    .sort()
    .reverse();
}

/**
 * The champion's picture for that season: a dedicated cutout at
 * public/images/champions/<NN>.png when present, else their card art from
 * that season. Card art for season N lives under /images/gamers/<N>/; a
 * season whose gamers point elsewhere (S1 reuses S2's art) has none of its
 * own, so it gets no picture.
 */
function findChampionImage(season: Season, cardPath?: string): string | null {
  const exists = (rel: string) =>
    existsSync(path.join(process.cwd(), 'public', rel));

  const cutout = `/images/champions/${season}.png`;
  if (exists(cutout)) return cutout;

  const ownArt = `/images/gamers/${Number(season)}/`;
  return cardPath?.startsWith(ownArt) && exists(cardPath) ? cardPath : null;
}

async function findCrowned(season?: Season) {
  for (const slug of season ? [season] : finishedSeasons()) {
    const view = await getSeasonView(Number(slug));
    const champion = view?.standings.find((row) => row.isChampion);
    if (view && champion) return { slug, view, champion };
  }
  return null;
}

// TODO(copy): the eyebrow and the figure labels — placeholders.
export default async function ChampionSideBlock({ season }: Props) {
  const crowned = await findCrowned(season);
  if (!crowned) return null;

  const { slug, view, champion } = crowned;
  const number = view.seasonNumber;
  const career = await getCareerView(champion.player.slug);

  // Counted up to this season, so a preview of an older one reads as it did then.
  const titles = (career?.trophies ?? []).filter(
    (t) => t.kind === 'season-gold' && t.seasonNumber <= number,
  ).length;

  const card = seasonData[slug].gamers.find(
    (g) => g.name === champion.player.name,
  );
  const image = findChampionImage(slug, card?.imagePath);

  // Label over value, the figure in accent: both are rank-1 data.
  const figure = (label: string, value: number) => (
    <div className='flex flex-col items-end gap-1'>
      <dt className={`${MONO} text-text-muted whitespace-nowrap`}>{label}</dt>
      <dd className='text-accent font-mono text-xl leading-none tabular-nums'>
        {value}
      </dd>
    </div>
  );

  return (
    <Link
      href={`/spillere/${champion.player.slug}`}
      className='group border-border bg-bg hover:border-accent focus-visible:outline-accent flex w-full flex-col border transition-colors duration-150 focus-visible:outline-2 focus-visible:outline-offset-2'
    >
      {image && (
        <img
          src={image}
          alt={`Bilde av ${champion.player.name}`}
          className='h-72 w-full object-cover object-top min-[701px]:h-60'
        />
      )}

      <div
        className={`border-border group-hover:border-accent flex flex-col gap-4 px-4 py-4 transition-colors duration-150 sm:px-6 ${image ? 'border-t' : ''}`}
      >
        <p className={`${MONO} text-text-muted flex items-center gap-2`}>
          <span aria-hidden className='bg-accent size-1.5' />
          [Ny mester] · [Sesong {slug}]
        </p>
        <div className='flex items-end justify-between gap-4'>
          <div className='min-w-0'>
            <Heading as='h2' className='break-words'>
              {champion.player.name}
            </Heading>
          </div>
          <dl className='flex shrink-0 gap-5'>
            {figure('[Poeng]', champion.totalPoints)}
            {figure('[Titler]', titles)}
          </dl>
        </div>
      </div>
    </Link>
  );
}
