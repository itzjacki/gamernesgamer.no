import Link from 'next/link';
import type { SeasonStatus } from '@/types/season-meta';

/**
 * One season on the index. Kept local so the primitive doesn't depend on the
 * results layer's types (same pattern as RosterEntry).
 */
export interface SeasonEntry {
  /** Zero-padded slug for the /sesong/[sesong] link (e.g. "04"). */
  slug: string;
  number: number;
  /** The season's dates, formatted ("13.12.2025 – 14.12.2025"). */
  date: string;
  status: SeasonStatus;
  games: number;
  players: number;
  /** Absent until the season has a champion. */
  champion?: {
    name: string;
    /** Season points the champion finished on. */
    points: number;
  };
  /**
   * The plate's picture: a dedicated landscape photo of the season when one
   * exists, else the champion's card art from that season. Absent for a
   * season with neither.
   */
  image?: { path: string; landscape: boolean };
}

interface Props {
  entries: SeasonEntry[];
}

/**
 * The VERKSTED season index: a stack of plates, one per season, each linking
 * to the season page. The same instrument grammar as PlayerRoster — a mono
 * header strip, a display line, a footer of hairline-divided figure cells and
 * a greyscale picture behind one diagonal hairline — but its own proportions:
 * the season number is the big figure, the champion is named beside it, the
 * picture takes a wide landscape window, and the diagonal leans the other way.
 *
 * Accent at rest is the champion's name (a champion callout). The number,
 * border and diagonal take it on hover/focus, and the portrait gets its colour
 * back.
 *
 * Rendered as a Server Component: no client JS.
 */
export default function SeasonRoster({ entries }: Props) {
  return (
    // A narrow gap between plates, as in PlayerRoster.
    <ul className='flex flex-col gap-3'>
      {entries.map((entry) => (
        <li key={entry.slug}>
          <SeasonPlate entry={entry} />
        </li>
      ))}
    </ul>
  );
}

/* -------------------------------------------------------------------------- */

const eyebrow =
  'text-text-muted font-mono text-xs tracking-wide uppercase sm:tracking-widest';
/**
 * The picture's width — a landscape window from `sm` up. The text side keeps
 * clear of it with the same value.
 */
const pictureWidth = 'w-36 sm:w-96';
const clearOfPicture = 'pr-36 sm:pr-96';
/**
 * Where the picture sits: below the header strip on phones, so the dates get
 * the full width; the whole height from `sm` up.
 */
const picturePlace = 'absolute top-8 bottom-0 right-0 sm:top-0';
/** The diagonal, leaning the opposite way to PlayerRoster's. */
const DIAGONAL_INSET = 18;

// TODO(copy): the status stamps, the champion eyebrow and the figure labels.
const statusLabel: Record<SeasonStatus, string> = {
  upcoming: 'Kommer',
  live: 'Pågår',
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
      {/* Header strip: the dates, and the status while not finished. */}
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

      {/* The number, and the champion beside it. */}
      <span
        className={`flex min-w-0 flex-1 items-center gap-3 pl-4 sm:gap-6 sm:pl-8 ${clearOfPicture}`}
      >
        <span className='group-hover:text-accent group-focus-visible:text-accent text-3xl leading-none font-extrabold tracking-tight tabular-nums transition-colors sm:text-6xl'>
          <span className='sr-only'>Sesong </span>
          {String(entry.number).padStart(2, '0')}
        </span>
        <span className='border-border flex min-w-0 flex-col justify-center gap-1 self-stretch border-l pl-3 sm:gap-2 sm:pl-6'>
          <span className={eyebrow}>Mester</span>
          <span
            className={`truncate text-base font-extrabold tracking-tight uppercase sm:text-3xl ${champion ? 'text-accent' : 'text-text-muted'}`}
          >
            {champion ? champion.name : '–'}
          </span>
        </span>
      </span>

      {/* Footer: the season's figures as ruled instrument cells. */}
      <span className='border-border flex h-10 shrink-0 border-t'>
        <Figure label='Spill' value={entry.games} />
        <Figure label='Spillere' value={entry.players} wideOnly />
        <Figure label='Poeng' value={champion ? champion.points : '–'} />
      </span>

      {/* Picture over the plate's right end, so the strips' rules run up to
          the diagonal. `bg-bg` masks them behind it. A card portrait keeps
          its face in frame (top); a landscape photo is centred. */}
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
