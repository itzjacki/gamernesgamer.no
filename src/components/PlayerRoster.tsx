import Link from 'next/link';
import TrophyIcon from './TrophyIcon';

/** Kept local so the primitive doesn't depend on the players lib's types. */
export interface RosterEntry {
  slug: string;
  name: string;
  /** Already quoted in the data, e.g. '"The Professor"'. */
  nickname: string;
  imagePath: string;
  /** Absent for a player with no finished season yet. */
  career?: {
    /** 1-based, by average placement; shared when tied. */
    rank: number;
    championships: number;
    averagePlacement: number;
    /** Winner of the latest decided season. */
    reigningChampion: boolean;
  };
}

interface Props {
  entries: RosterEntry[];
}

/**
 * A player list, not a scoreboard: the rank is a small mark, accented on
 * EVERY plate so the red is a rhythm down the sheet, not a prize for the
 * leader. Portraits are desaturated at rest so photos from different seasons
 * read as one set.
 */
export default function PlayerRoster({ entries }: Props) {
  return (
    <ul className='flex flex-col gap-3'>
      {entries.map((entry) => (
        <li key={entry.slug}>
          <PlayerPlate entry={entry} />
        </li>
      ))}
    </ul>
  );
}

/* -------------------------------------------------------------------------- */

const eyebrow =
  'text-text-muted font-mono text-xs tracking-wide uppercase sm:tracking-widest';
/** The text side keeps clear of the portrait with the same value. */
const portraitWidth = 'w-32 sm:w-60';
const clearOfPortrait = 'pr-32 sm:pr-60';
/** Shared by the portrait's clip and the hairline drawn along it. */
const DIAGONAL_INSET = 22;

function Figure({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <span className='border-border flex items-center border-r px-3 first:pl-4 sm:px-8 sm:first:pl-8'>
      <span className='flex items-baseline gap-2 sm:flex-col sm:gap-1'>
        <span className={eyebrow}>{label}</span>
        <span className='text-text font-mono text-sm tabular-nums sm:text-2xl'>
          {value}
        </span>
      </span>
    </span>
  );
}

function PlayerPlate({ entry }: { entry: RosterEntry }) {
  const { career } = entry;

  return (
    <Link
      href={`/spillere/${entry.slug}`}
      className='group border-border bg-bg hover:border-accent focus-visible:border-accent focus-visible:outline-accent relative flex h-44 flex-col overflow-hidden border transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 sm:h-60'
    >
      <span
        className={`border-border flex h-8 shrink-0 items-center gap-3 border-b px-4 sm:h-10 sm:px-8 ${clearOfPortrait}`}
      >
        {career && (
          <span className='text-accent font-mono text-xs tracking-widest tabular-nums'>
            <span className='sr-only'>Plass </span>
            {String(career.rank).padStart(2, '0')}
          </span>
        )}
        {career?.reigningChampion && (
          // The plate is one link, so the mark can't be a popover trigger (no
          // button inside an <a>): its label is CSS-only, fading in beside it
          // on hover. Transparent rather than hidden at rest, so it is still
          // read out.
          <span className='group/trophy relative flex'>
            <TrophyIcon kind='season-gold' muted />
            <span className='text-text-muted pointer-events-none absolute top-1/2 left-full ml-3 -translate-y-1/2 font-mono text-xs tracking-wide whitespace-nowrap uppercase opacity-0 transition-opacity group-hover/trophy:opacity-100 motion-reduce:transition-none sm:tracking-widest'>
              Regjerende mester
            </span>
          </span>
        )}
      </span>

      <span
        className={`flex min-w-0 flex-1 flex-col justify-center gap-1 pl-4 sm:gap-2 sm:pl-8 ${clearOfPortrait}`}
      >
        <span className='group-hover:text-accent group-focus-visible:text-accent truncate text-3xl font-extrabold tracking-tight uppercase transition-colors sm:text-6xl'>
          {entry.name}
        </span>
        <span className='text-text-muted truncate font-mono text-xs tracking-wide sm:tracking-widest sm:uppercase'>
          {entry.nickname}
        </span>
      </span>

      <span className='border-border flex h-10 shrink-0 border-t sm:h-20'>
        <Figure label='Titler' value={career ? career.championships : '–'} />
        <Figure
          label='Snitt'
          value={career ? career.averagePlacement.toFixed(1) : '–'}
        />
      </span>

      {/* Laid over the plate's right end so the strips' rules run up to the
          diagonal; `bg-bg` masks them behind the figure. */}
      <span
        className={`bg-bg absolute inset-y-0 right-0 ${portraitWidth}`}
        style={{
          clipPath: `polygon(${DIAGONAL_INSET}% 0, 100% 0, 100% 100%, 0 100%)`,
        }}
      >
        <img
          src={entry.imagePath}
          alt=''
          aria-hidden='true'
          className='h-full w-full object-cover object-top brightness-90 contrast-125 grayscale transition duration-300 group-hover:brightness-100 group-hover:contrast-100 group-hover:grayscale-0 group-focus-visible:brightness-100 group-focus-visible:contrast-100 group-focus-visible:grayscale-0 motion-reduce:transition-none'
        />
      </span>
      <svg
        viewBox='0 0 100 100'
        preserveAspectRatio='none'
        aria-hidden='true'
        className={`text-border group-hover:text-accent group-focus-visible:text-accent pointer-events-none absolute inset-y-0 right-0 h-full transition-colors ${portraitWidth}`}
      >
        <line
          x1={DIAGONAL_INSET}
          y1='0'
          x2='0'
          y2='100'
          stroke='currentColor'
          strokeWidth='1'
          vectorEffect='non-scaling-stroke'
        />
      </svg>
    </Link>
  );
}
