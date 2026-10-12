import Link from 'next/link';
import type { RecordEntry } from '@/lib/results/view-models';

/**
 * One record on the /records wall: who holds it, the number, and the two
 * players behind them. Built like a CareerLedger cell (mono eyebrow over a
 * large figure, `bg-bg` inside a `bg-border` + `gap-px` hairline wall) with the
 * roles flipped — the holder's NAME is the display-face value and the number is
 * the big mono figure.
 *
 * A plate is written to stand alone when cropped into the group chat: its own
 * label, a scope stamp saying which seasons it covers, and the runners-up that
 * give the number its meaning.
 *
 * - Ties: every rank-1 entry is a holder, stacked, under one shared figure. No
 *   tiebreak is applied here that the reader can't see.
 * - No accent at rest. Every plate names a winner by construction, so spending
 *   accent here would turn the whole page red; it stays on the career board's
 *   leader. Names earn it on hover, game wins in the opened list keep it.
 * - No portraits: one player on several plates would repeat the same face.
 * - The games behind the number sit in a native <details> (no JS, stays a
 *   Server Component).
 */

interface Props {
  /** Fragment id, so a link can go with a screenshot (`/records#<id>`). */
  id: string;
  label: string;
  /** Which seasons the record covers, e.g. "GG · S1–S4". */
  scope: string;
  /** The record's entries, best first with shared ranks. */
  entries: RecordEntry[];
  /** The figure for one entry — used for the holder and the runners-up. */
  figure: (entry: RecordEntry) => string;
  /** The line under the holder's figure: unit and any qualifier. */
  unit: (holder: RecordEntry) => string;
  /** Label on the disclosure that opens the detail. */
  detailLabel: string;
  /** What is behind one holder's figure. Defaults to the list of their games. */
  detail?: (holder: RecordEntry) => React.ReactNode;
}

const MAX_RUNNERS_UP = 2;

const eyebrow = 'text-text-muted font-mono text-xs tracking-widest uppercase';
const link =
  'hover:text-accent focus-visible:outline-accent underline underline-offset-2 transition-colors duration-150 focus-visible:outline-2 focus-visible:outline-offset-2';

/** The games behind a figure: title (to the game page), season, placement. */
function GameLines({ entry }: { entry: RecordEntry }) {
  return (
    <ul className='flex flex-col'>
      {entry.games.map((game) => (
        <li
          key={`${game.seasonSlug}-${game.gameSlug}`}
          className='border-border grid grid-cols-[1fr_auto_auto] items-baseline gap-4 border-t py-2 first:border-t-0'
        >
          <Link
            href={`/sesong/${game.seasonSlug}/${game.gameSlug}`}
            className={`text-sm ${link}`}
          >
            {game.gameTitle}
          </Link>
          <span className='text-text-muted font-mono text-sm tabular-nums'>
            <span className='sr-only'>sesong </span>
            <span aria-hidden='true'>S</span>
            {game.seasonNumber}
          </span>
          <span
            className={`font-mono text-sm tabular-nums ${
              game.placement === 1 ? 'text-accent font-bold' : 'text-text'
            }`}
          >
            <span className='sr-only'>plass </span>
            {game.placement}
          </span>
        </li>
      ))}
    </ul>
  );
}

export default function RecordPlate({
  id,
  label,
  scope,
  entries,
  figure,
  unit,
  detailLabel,
  detail = (holder) => <GameLines entry={holder} />,
}: Props) {
  const holders = entries.filter((e) => e.rank === 1);
  if (holders.length === 0) return null;

  const runnersUp = entries.filter((e) => e.rank > 1).slice(0, MAX_RUNNERS_UP);
  const shared = holders.length > 1;

  return (
    <li className='bg-bg'>
      <article id={id} className='flex h-full scroll-mt-8 flex-col gap-4 p-5'>
        <header className='flex items-baseline justify-between gap-4'>
          <h3 className={eyebrow}>{label}</h3>
          <span className={`shrink-0 ${eyebrow}`}>{scope}</span>
        </header>

        <div className='flex flex-col gap-2'>
          <p
            className={`text-text flex flex-col font-extrabold tracking-tight uppercase ${
              shared ? 'text-xl sm:text-2xl' : 'text-2xl sm:text-3xl'
            }`}
          >
            {holders.map((holder) => (
              <Link
                key={holder.player.slug}
                href={`/spillere/${holder.player.slug}`}
                className={`self-start ${link}`}
              >
                {holder.player.name}
              </Link>
            ))}
          </p>
          <p className='text-text font-mono text-5xl tabular-nums sm:text-6xl'>
            {figure(holders[0])}
          </p>
          <p className='text-text-muted font-mono text-xs'>
            {unit(holders[0])}
          </p>
        </div>

        {/* Pushed to the foot so the rows line up across a grid row. */}
        <div className='mt-auto flex flex-col'>
          {runnersUp.length > 0 && (
            <ol className='border-border border-t'>
              {runnersUp.map((entry) => (
                <li
                  key={entry.player.slug}
                  className='border-border grid grid-cols-[1.5rem_1fr_auto] items-baseline gap-2 border-b py-2'
                >
                  <span className='text-text-muted font-mono text-sm tabular-nums'>
                    <span className='sr-only'>plass </span>
                    {entry.rank}
                  </span>
                  <Link
                    href={`/spillere/${entry.player.slug}`}
                    className='text-text justify-self-start text-sm underline-offset-2 hover:underline'
                  >
                    {entry.player.name}
                  </Link>
                  <span className='text-text font-mono text-sm tabular-nums'>
                    {figure(entry)}
                  </span>
                </li>
              ))}
            </ol>
          )}

          <details className='group'>
            <summary
              className={`hover:text-accent focus-visible:outline-accent flex min-h-11 cursor-pointer list-none items-center justify-between gap-4 transition-colors duration-150 focus-visible:outline-2 focus-visible:outline-offset-2 [&::-webkit-details-marker]:hidden ${eyebrow}`}
            >
              {detailLabel}
              <svg
                aria-hidden='true'
                viewBox='0 0 12 12'
                className='size-3 transition-transform duration-150 group-open:rotate-180 motion-reduce:transition-none'
                fill='none'
                stroke='currentColor'
                strokeWidth='1.5'
              >
                <path d='M2 4l4 4 4-4' />
              </svg>
            </summary>
            <div className='border-border flex flex-col gap-4 border-t pt-2'>
              {holders.map((holder) => (
                <div key={holder.player.slug} className='flex flex-col'>
                  {shared && <p className={eyebrow}>{holder.player.name}</p>}
                  {detail(holder)}
                </div>
              ))}
            </div>
          </details>
        </div>
      </article>
    </li>
  );
}
