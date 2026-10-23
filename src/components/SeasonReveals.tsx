import Link from 'next/link';

import type { SeasonData } from '@/data/sesong';

/**
 * Under the centred trophy in the upcoming state: one mono row of what the
 * coming season has revealed so far, the whole row ONE link to its season
 * page. Each count respects its reveal flag; unrevealed shows as "?".
 *
 * Readout grammar, like the header display: label over value in mono cells
 * split by hairlines. A normal bordered element on the scene's floor
 * (design.md, "On the hero"): solid `bg-bg`, `border` all round and between
 * the cells, all of which take the accent on hover. From 701px every cell,
 * the season cue included, is four grid cells wide and the row one cell
 * tall, so centred it lands on the grid; on phones the counts share a fixed
 * grid with the cue on its own row beneath.
 */

interface Props {
  /** The season's zero-padded slug, e.g. "05". */
  season: string;
  data: SeasonData;
}

const LABEL =
  'text-text-muted font-mono text-[10px] tracking-widest whitespace-nowrap uppercase min-[701px]:tracking-[0.2em]';

export default function SeasonReveals({ season, data }: Props) {
  const { meta } = data;

  const cells = [
    {
      label: 'Spillere',
      revealed: meta.revealGamerCards,
      count: data.gamers.length,
    },
    { label: 'Spill', revealed: meta.revealGames, count: data.games.length },
    ...(data.powerUps
      ? [
          {
            label: 'Power-ups',
            revealed: meta.revealPowerups,
            count: data.powerUps.length,
          },
        ]
      : []),
  ];

  // Static class strings, so Tailwind sees them. The width is set on the
  // row so its outer edges, not its columns, hit the grid.
  const columns =
    cells.length === 3
      ? 'grid-cols-3 min-[701px]:w-160 min-[701px]:grid-cols-4'
      : 'grid-cols-2 min-[701px]:w-120 min-[701px]:grid-cols-3';

  const cell = (label: string, value: React.ReactNode) => (
    <span
      key={label}
      className='border-border group-hover:border-accent flex min-w-0 flex-col justify-center gap-1.5 border-l px-2 py-2 transition-colors duration-150 nth-last-2:border-l-0 min-[701px]:gap-1 min-[701px]:px-4 min-[701px]:py-0 min-[701px]:nth-last-2:border-l'
    >
      <span className={LABEL}>{label}</span>
      <span className='font-mono text-xs leading-none font-medium sm:text-sm'>
        {value}
      </span>
    </span>
  );

  return (
    <Link
      href={`/sesong/${season}`}
      className={`group border-border bg-bg text-text hover:border-accent focus-visible:outline-accent grid w-full border transition-colors duration-150 focus-visible:outline-2 focus-visible:outline-offset-2 min-[701px]:h-10 ${columns}`}
    >
      <span className='group-hover:text-accent border-border group-hover:border-accent col-span-full flex min-h-11 items-center justify-center border-t px-3 font-mono text-[10px] tracking-[0.2em] whitespace-nowrap uppercase transition-colors duration-150 min-[701px]:col-span-1 min-[701px]:min-h-0 min-[701px]:justify-start min-[701px]:border-t-0 min-[701px]:px-4 min-[701px]:text-xs'>
        Sesong {season}
      </span>
      {cells.map(({ label, revealed, count }) =>
        cell(label, revealed ? count : '?'),
      )}
    </Link>
  );
}
