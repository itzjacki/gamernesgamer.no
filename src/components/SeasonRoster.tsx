import Link from 'next/link';
import type { SeasonStatus } from '@/types/season-meta';

/** Kept local so the primitive doesn't depend on the results layer's types. */
export interface SeasonEntry {
  /** Zero-padded, e.g. "04". */
  slug: string;
  number: number;
  /** Formatted, e.g. "13.12.2025 – 14.12.2025". */
  date: string;
  status: SeasonStatus;
  games: number;
  players: number;
  champion?: {
    name: string;
    points: number;
  };
  /** The season's landscape photo, else the champion's card art. */
  image?: { path: string; landscape: boolean };
}

interface Props {
  entries: SeasonEntry[];
}

/** Same plate grammar as PlayerRoster, with its own proportions. */
export default function SeasonRoster({ entries }: Props) {
  return (
    <ul className='flex flex-col gap-3'>
      {entries.map((entry) => (
        <li key={entry.slug}>
          <SeasonPlate entry={entry} />
        </li>
      ))}
    </ul>
  );
}

const eyebrow =
  'text-text-muted font-mono text-xs tracking-wide uppercase sm:tracking-widest';
/** The text side keeps clear of the picture with the same value. */
const pictureWidth = 'w-36 sm:w-96';
const clearOfPicture = 'pr-36 sm:pr-96';
/** Below the header strip on phones, so the dates get the full width. */
const picturePlace = 'absolute top-8 bottom-0 right-0 sm:top-0';
/** Leans the opposite way to PlayerRoster's. */
const DIAGONAL_INSET = 18;

const statusLabel: Record<SeasonStatus, string> = {
  upcoming: 'Kommer',
  live: 'Live',
  finished: 'Ferdig',
};

function Figure({
  label,
  value,
  wideOnly = false,
}: {
  label: string;
  value: React.ReactNode;
  /** Left out on phones, where the picture covers the footer's right end. */
  wideOnly?: boolean;
}) {
  return (
    <span
      className={`border-border items-center border-r px-3 first:pl-4 sm:px-6 sm:first:pl-8 ${wideOnly ? 'hidden sm:flex' : 'flex'}`}
    >
      <span className='flex items-baseline gap-2'>
        <span className={eyebrow}>{label}</span>
        <span className='text-text font-mono text-sm tabular-nums'>
          {value}
        </span>
      </span>
    </span>
  );
}

function SeasonPlate({ entry }: { entry: SeasonEntry }) {
  const { champion, image } = entry;

  return (
    <Link
      href={`/sesong/${entry.slug}`}
      className='group border-border bg-bg hover:border-accent focus-visible:border-accent focus-visible:outline-accent relative flex h-40 flex-col overflow-hidden border transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 sm:h-56'
    >
      <span
        className={`border-border flex h-8 shrink-0 items-center gap-3 border-b px-4 sm:h-10 sm:px-8 sm:pr-96`}
      >
        <span className={`${eyebrow} truncate tabular-nums`}>{entry.date}</span>
        {entry.status !== 'finished' && (
          <span className='text-accent font-mono text-xs tracking-widest uppercase'>
            {statusLabel[entry.status]}
          </span>
        )}
      </span>

      <span
        className={`flex min-w-0 flex-1 items-center gap-3 pl-4 sm:gap-6 sm:pl-8 ${clearOfPicture}`}
      >
        <span className='group-hover:text-accent group-focus-visible:text-accent text-3xl leading-none font-extrabold tracking-tight tabular-nums transition-colors sm:text-6xl'>
          <span className='sr-only'>Sesong </span>
          {String(entry.number).padStart(2, '0')}
        </span>
        <span className='border-border flex min-w-0 flex-col justify-center gap-1 self-stretch border-l pl-3 sm:gap-2 sm:pl-6'>
          <span className={eyebrow}>Vinner</span>
          <span
            className={`truncate text-base font-extrabold tracking-tight uppercase sm:text-3xl ${champion ? 'text-accent' : 'text-text-muted'}`}
          >
            {champion ? champion.name : '–'}
          </span>
        </span>
      </span>

      <span className='border-border flex h-10 shrink-0 border-t'>
        <Figure label='Spill' value={entry.games} />
        <Figure label='Spillere' value={entry.players} wideOnly />
        <Figure label='Poeng' value={champion ? champion.points : '–'} />
      </span>

      {/* Over the plate's right end, so the strips' rules run up to the
          diagonal; `bg-bg` masks them behind it. */}
      {image && (
        <span
          className={`bg-bg ${picturePlace} ${pictureWidth}`}
          style={{
            clipPath: `polygon(0 0, 100% 0, 100% 100%, ${DIAGONAL_INSET}% 100%)`,
          }}
        >
          <img
            src={image.path}
            alt=''
            aria-hidden='true'
            className={`h-full w-full object-cover ${image.landscape ? 'object-center' : 'object-top'} brightness-90 contrast-125 grayscale transition duration-300 group-hover:brightness-100 group-hover:contrast-100 group-hover:grayscale-0 group-focus-visible:brightness-100 group-focus-visible:contrast-100 group-focus-visible:grayscale-0 motion-reduce:transition-none`}
          />
        </span>
      )}
      <svg
        viewBox='0 0 100 100'
        preserveAspectRatio='none'
        aria-hidden='true'
        className={`text-border group-hover:text-accent group-focus-visible:text-accent pointer-events-none transition-colors ${picturePlace} ${pictureWidth}`}
      >
        <line
          x1='0'
          y1='0'
          x2={DIAGONAL_INSET}
          y2='100'
          stroke='currentColor'
          strokeWidth='1'
          vectorEffect='non-scaling-stroke'
        />
      </svg>
    </Link>
  );
}
