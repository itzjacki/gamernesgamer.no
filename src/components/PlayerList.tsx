import Link from 'next/link';
import { allPlayers } from '@/lib/players/roster';
import { findHeroImage } from '@/lib/results/queries';
import SectionLabel from './SectionLabel';

/**
 * The front page's short player list: a small version of the /spillere
 * index, with no figures. One hairline row per player, in the roster's own
 * order (most seasons first, then by name): a small picture, then the name.
 * The picture is the one the index uses (the hero portrait, else the latest
 * card art), greyscale at rest and in colour on hover/focus, like the index.
 *
 * Each row is one link to the player's page, at least 56px tall. The label
 * sits over the frame; a 48px door cell to the index closes it. From `sm` up
 * the frame is a whole number of grid cells (at least seven), the rows share
 * its height, and it sits beside SeasonList with the frames equalised by the
 * parent grid (each list is a subgrid of label row and frame row).
 *
 * Static data only: no results are read.
 */

/** A row's floor and the door cell's height, in px. */
const ROW = 56;
const DOOR = 48;

export default function PlayerList() {
  const players = allPlayers().map((p) => ({
    slug: p.slug,
    name: p.name,
    imagePath: findHeroImage(p.slug) ?? p.latest.imagePath,
  }));

  // The frame's floor from `sm` up: the rows, the door and the frame's two
  // border pixels, rounded up to whole cells.
  const minHeight = Math.max(
    280,
    Math.ceil((players.length * ROW + DOOR + 2) / 40) * 40,
  );

  return (
    <section
      aria-labelledby='spillere'
      className='flex flex-col gap-6 sm:row-span-2 sm:grid sm:grid-rows-subgrid'
    >
      <SectionLabel as='h2'>
        <span id='spillere'>Spillere</span>
      </SectionLabel>

      <div
        className='border-border bg-bg flex flex-col border sm:min-h-(--list-min)'
        style={{ '--list-min': `${minHeight}px` } as React.CSSProperties}
      >
        <ul className='flex flex-1 flex-col'>
          {players.map((player) => (
            <li
              key={player.slug}
              className='border-border flex min-h-14 flex-1 border-b'
            >
              <Link
                href={`/spillere/${player.slug}`}
                className='group focus-visible:outline-accent flex min-w-0 flex-1 items-center gap-4 px-5 focus-visible:outline-2 focus-visible:-outline-offset-2'
              >
                <span className='border-border group-hover:border-accent group-focus-visible:border-accent bg-surface size-10 shrink-0 overflow-hidden border transition-colors'>
                  <img
                    src={player.imagePath}
                    alt=''
                    aria-hidden='true'
                    className='h-full w-full object-cover object-top brightness-90 contrast-125 grayscale transition duration-300 group-hover:brightness-100 group-hover:contrast-100 group-hover:grayscale-0 group-focus-visible:brightness-100 group-focus-visible:contrast-100 group-focus-visible:grayscale-0 motion-reduce:transition-none'
                  />
                </span>
                <span className='text-text-muted group-hover:text-text font-mono text-sm tabular-nums transition-colors duration-150'>
                  {player.name}
                </span>
              </Link>
            </li>
          ))}
        </ul>

        <Link
          href='/spillere'
          className='group focus-visible:outline-accent flex h-12 shrink-0 items-center px-5 font-mono text-xs tracking-widest uppercase focus-visible:outline-2 focus-visible:-outline-offset-2'
        >
          <span className='text-text group-hover:text-accent underline underline-offset-4 transition-colors duration-150'>
            Alle spillere
          </span>
        </Link>
      </div>
    </section>
  );
}
