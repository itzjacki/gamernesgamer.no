import { existsSync } from 'node:fs';
import path from 'node:path';
import Link from 'next/link';

import { seasonData, type Season } from '@/data/sesong';
import { getSeasonView } from '@/lib/results/queries';
import ChampionTone, { CHAMPION_TONE } from './ChampionTone';
import Heading from './Heading';
import Readout from './Readout';

/** Renders nothing until a finished season has a champion. */

interface Props {
  /**
   * Defaults to the latest finished season with a champion; the page may pass
   * a stand-in to preview.
   */
  season?: Season;
}

const MONO = 'font-mono text-[10px] tracking-[0.2em] uppercase sm:text-xs';

function finishedSeasons(): Season[] {
  return (Object.keys(seasonData) as Season[])
    .filter((slug) => seasonData[slug].meta.status === 'finished')
    .sort()
    .reverse();
}

/** The season's champion cutout; none, no picture. */
function findChampionImage(season: Season): string | null {
  const cutout = `/images/champions/${season}.png`;
  return existsSync(path.join(process.cwd(), 'public', cutout)) ? cutout : null;
}

async function findCrowned(season?: Season) {
  for (const slug of season ? [season] : finishedSeasons()) {
    const view = await getSeasonView(Number(slug));
    const champion = view?.standings.find((row) => row.isChampion);
    if (view && champion) return { slug, view, champion };
  }
  return null;
}

export default async function ChampionSideBlock({ season }: Props) {
  const crowned = await findCrowned(season);
  if (!crowned) return null;

  const { slug, champion } = crowned;
  const image = findChampionImage(slug);

  return (
    <Link
      href={`/spillere/${champion.player.slug}`}
      className='group focus-visible:outline-accent flex w-full max-w-2xs flex-col focus-visible:outline-2 focus-visible:outline-offset-2'
    >
      {/* Straight on the scene, uncropped, standing on the footer, in a
          square box so champions of different crops come out at a
          comparable size. On desktop the block's foot is on the trophy's
          (74% down the stage); the cap leaves the footer and two cells of
          headroom above. */}
      {image && <ChampionTone />}
      {image && (
        <img
          src={image}
          alt={`Bilde av ${champion.player.name}`}
          className={`${CHAMPION_TONE} mx-auto block aspect-square max-h-96 w-full object-contain object-bottom group-hover:[filter:none] group-focus-visible:[filter:none] min-[701px]:max-h-[calc(var(--stage)*0.74_-_200px)]`}
        />
      )}

      <div className='border-border bg-bg group-hover:border-accent flex flex-col gap-4 border px-4 py-4 transition-colors duration-150 sm:px-6'>
        <p className={`${MONO} text-text-muted flex items-center gap-2`}>
          Vinner · Sesong {Number(slug)}
        </p>
        <div className='flex items-end justify-between gap-4'>
          <div className='min-w-0'>
            <Heading as='h2' className='break-words'>
              {champion.player.name}
            </Heading>
          </div>
          <dl className='flex shrink-0 gap-5'>
            {/* Accent: rank-1 data. */}
            <Readout
              term
              align='end'
              accent
              label='Poeng'
              value={champion.totalPoints}
            />
          </dl>
        </div>
      </div>
    </Link>
  );
}
