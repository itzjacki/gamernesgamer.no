import Link from 'next/link';

/**
 * One entrant on the roster sheet. The subset of RosterPlayer the row needs,
 * kept local so the primitive doesn't depend on the players lib's types (same
 * pattern as StandingsRow vs. the results layer).
 */
export interface RosterEntry {
  /** URL slug for the /spillere/[spiller] link. */
  slug: string;
  /** Display name — the stable cross-season identity. */
  name: string;
  /** Latest-season nickname (already quoted in the data, e.g. '"The Professor"'). */
  nickname: string;
  /** Latest-season portrait. */
  imagePath: string;
}

interface Props {
  entries: RosterEntry[];
}

/**
 * The VERKSTED player index: a motorsport entry sheet. One row per player, a
 * Martian Mono header strip that titles the run-order index, hairline rules
 * throughout, no radius, no shadow, a solid `bg-bg` surface that masks the
 * blueprint grid. Accent (#E8334A) is spent only on hover/focus of a row —
 * nothing is accented at rest.
 *
 * Rendered as a Server Component: no client JS.
 */
export default function PlayerRoster({ entries }: Props) {
  return (
    <div className='border-border bg-bg border'>
      {/* Header strip — the timing-sheet legend. */}
      <div className='border-border text-text-muted flex items-center gap-4 border-b px-4 py-3 font-mono text-xs tracking-widest uppercase'>
        <span className='w-6 text-center'>#</span>
        <span className='flex-1'>Spiller</span>
      </div>

      <ul>
        {entries.map((entry, i) => (
          <li key={entry.slug}>
            <PlayerRosterRow
              entry={entry}
              index={i}
              isLast={i === entries.length - 1}
            />
          </li>
        ))}
      </ul>
    </div>
  );
}

/* -------------------------------------------------------------------------- */

function PlayerRosterRow({
  entry,
  index,
  isLast,
}: {
  entry: RosterEntry;
  index: number;
  isLast: boolean;
}) {
  return (
    <Link
      href={`/spillere/${entry.slug}`}
      className={`group grid grid-cols-[48px_1fr] items-center gap-4 px-4 py-3 ${
        isLast ? '' : 'border-border border-b'
      } focus-visible:outline-accent focus-visible:outline-2 focus-visible:outline-offset-[-2px]`}
    >
      {/* Run-order index + portrait plate. */}
      <span className='relative block h-12 w-12'>
        <img
          src={entry.imagePath}
          alt=''
          aria-hidden='true'
          className='border-border group-hover:border-accent group-focus-visible:border-accent h-12 w-12 border object-cover object-top transition-colors'
        />
      </span>

      {/* Name (identity) + nickname (latest season). */}
      <span className='flex min-w-0 flex-col sm:flex-row sm:items-baseline sm:gap-3'>
        <span className='group-hover:text-accent group-focus-visible:text-accent truncate font-sans font-extrabold tracking-tight uppercase transition-colors'>
          <span className='text-text-muted mr-2 hidden font-mono text-xs tracking-widest tabular-nums sm:inline'>
            {String(index + 1).padStart(2, '0')}
          </span>
          {entry.name}
        </span>
        <span className='text-text-muted truncate font-mono text-xs tracking-wide'>
          {entry.nickname}
        </span>
      </span>
    </Link>
  );
}
