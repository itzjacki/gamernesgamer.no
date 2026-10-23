import Link from 'next/link';
import { seasonData, type Season } from '@/data/sesong';
import { findSeasonImage, getSeasonChampions } from '@/lib/results/queries';
import SectionLabel from './SectionLabel';

/**
 * The front page's short version of the /sesong index. Sized like PlayerList
 * beside it.
 */

/** A row's floor and the door cell's height, in px. */
const ROW = 56;
const DOOR = 48;

export default async function SeasonList() {
  const champions = await getSeasonChampions();

  const seasons = (Object.keys(seasonData) as Season[])
    .sort()
    .reverse()
    .map((slug) => {
      const { meta, gamers } = seasonData[slug];
      // Only a decided season has a champion, as on the index.
      const champion =
        meta.status === 'upcoming'
          ? null
          : (champions.find((c) => c.seasonSlug === slug)?.champion ?? null);
      const card = champion && gamers.find((g) => g.name === champion.name);
      const photo = findSeasonImage(slug);

      return {
        slug,
        image: photo
          ? { path: photo, landscape: true }
          : card
            ? { path: card.imagePath, landscape: false }
            : null,
      };
    });

  // The frame's floor from `sm` up, as in PlayerList.
  const minHeight = Math.max(
    280,
    Math.ceil((seasons.length * ROW + DOOR + 2) / 40) * 40,
  );

  return (
    <section
      aria-labelledby='sesonger'
      className='flex flex-col gap-6 sm:row-span-2 sm:grid sm:grid-rows-subgrid'
    >
      <SectionLabel as='h2'>
        <span id='sesonger'>Sesonger</span>
      </SectionLabel>

      <div
        className='border-border bg-bg flex flex-col border sm:min-h-(--list-min)'
        style={{ '--list-min': `${minHeight}px` } as React.CSSProperties}
      >
        <ul className='flex flex-1 flex-col'>
          {seasons.map(({ slug, image }) => (
            <li
              key={slug}
              className='border-border flex min-h-14 flex-1 border-b'
            >
              <Link
                href={`/sesong/${slug}`}
                className='group focus-visible:outline-accent flex min-w-0 flex-1 items-center gap-4 px-5 focus-visible:outline-2 focus-visible:-outline-offset-2'
              >
                <span className='border-border group-hover:border-accent group-focus-visible:border-accent bg-surface size-10 shrink-0 overflow-hidden border transition-colors'>
                  {image && (
                    <img
                      src={image.path}
                      alt=''
                      aria-hidden='true'
                      className={`h-full w-full object-cover ${image.landscape ? 'object-center' : 'object-top'} brightness-90 contrast-125 grayscale transition duration-300 group-hover:brightness-100 group-hover:contrast-100 group-hover:grayscale-0 group-focus-visible:brightness-100 group-focus-visible:contrast-100 group-focus-visible:grayscale-0 motion-reduce:transition-none`}
                    />
                  )}
                </span>
                <span className='text-text-muted group-hover:text-text font-mono text-sm tabular-nums transition-colors duration-150'>
                  Sesong {slug}
                </span>
              </Link>
            </li>
          ))}
        </ul>

        <Link
          href='/sesong'
          className='group focus-visible:outline-accent flex h-12 shrink-0 items-center px-5 font-mono text-xs tracking-widest uppercase focus-visible:outline-2 focus-visible:-outline-offset-2'
        >
          <span className='text-text group-hover:text-accent underline underline-offset-4 transition-colors duration-150'>
            Alle sesonger
          </span>
        </Link>
      </div>
    </section>
  );
}
