import Link from 'next/link';
import { Fragment } from 'react';
import type { RecordEntry } from '@/lib/results/view-models';
import styles from './RecordPlate.module.css';

/**
 * One record on the /records wall: who holds it, the number, and the three
 * players behind them (the whole field of four). The holder's name sits at the top (sentence case,
 * regular weight, a step larger than the rest); the mono figure, with its unit running on
 * from it on the same line, sits along the bottom of the upper area, directly
 * over the runners-up. Neither is large: the name leads, the figure is a
 * modest readout. `bg-bg` inside a `bg-border` + `gap-px` hairline wall, like a
 * CareerLedger cell.
 *
 * A plate is written to stand alone when cropped into the group chat: its own
 * label, a scope stamp saying which seasons it covers, and the runners-up that
 * give the number its meaning.
 *
 * - Ties: every rank-1 entry is a holder, on one line, over one shared figure. No
 *   tiebreak is applied here that the reader can't see.
 * - The holder's FIGURE carries the accent at rest: it is the record, the
 *   rank-1 datum of the plate. (An earlier pass kept the wall accent-free, on
 *   the grounds that every plate names a winner; the page read too flat.) The
 *   name and the runners-up stay neutral and earn accent on hover; game wins
 *   in the opened list keep it.
 * - No portraits: one player on several plates would repeat the same face.
 * - The figure is a native-popover trigger (`<button popovertarget>` +
 *   `[popover]`, no JS, stays a Server Component — the same pattern as
 *   GamePointsMatrix and TagRecord), marked with a dotted underline. The panel
 *   lists the games behind the number; each runner-up's figure opens the same
 *   list for that player. It replaced a <details> at the foot of
 *   the plate, which read as a continuation of the runners-up list.
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
  /** Screen-reader label for the figure button that opens the detail. */
  detailLabel: string;
  /**
   * What is behind one entry's figure (the holder's or a runner-up's).
   * Defaults to the list of their games.
   */
  detail?: (entry: RecordEntry) => React.ReactNode;
}

/**
 * Rows under the holder. Three, not the conventional two: with four players a
 * plate then shows the whole field, so nobody is the one left off.
 */
const MAX_RUNNERS_UP = 3;

const eyebrow = 'text-text-muted font-mono text-xs tracking-widest uppercase';
const nameLink =
  'hover:text-accent focus-visible:outline-accent underline-offset-2 transition-colors duration-150 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2';
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

  const popoverId = `record-${id}`;
  // A unique dashed-ident anchor name per trigger, bridged to the CSS module
  // via an inline custom property on both the trigger and its popover.
  const anchorFor = (name: string) =>
    ({ '--anchor': `--${name}` }) as React.CSSProperties;
  const anchorStyle = anchorFor(popoverId);

  return (
    // An odd plate left alone on the last row spans it, so the wall has no hole.
    <li className='bg-bg sm:last:odd:col-span-2'>
      <article
        id={id}
        className='flex h-full scroll-mt-8 flex-col gap-4 p-5 pb-0'
      >
        <header className='flex items-baseline justify-between gap-4'>
          <h3 className={eyebrow}>{label}</h3>
          <span className={`shrink-0 ${eyebrow}`}>{scope}</span>
        </header>

        {/* Tied holders share one line, comma-separated. */}
        <p className='text-text text-xl'>
          {holders.map((holder, i) => (
            <Fragment key={holder.player.slug}>
              {i > 0 && ', '}
              <Link
                href={`/spillere/${holder.player.slug}`}
                className={nameLink}
              >
                {holder.player.name}
              </Link>
            </Fragment>
          ))}
        </p>

        {/* Pushed to the foot, figure line included, so the figures and the
            runners-up each line up across a grid row whatever the name above
            them does. */}
        <div className='mt-auto flex flex-col'>
          {/* The figure and its unit as ONE line: the unit reads on from the
              number at its baseline. A long unit wraps inside its own column
              and grows UPWARD (last-baseline alignment), so its final line
              always sits on the figure's baseline. */}
          <p className='flex items-baseline-last gap-2 pb-4'>
            <button
              type='button'
              popoverTarget={popoverId}
              className={`text-accent shrink-0 font-mono text-3xl leading-none tabular-nums ${styles.trigger}`}
              style={anchorStyle}
            >
              {figure(holders[0])}
              <span className='sr-only'>. {detailLabel}</span>
            </button>
            <span className='text-text-muted font-mono text-xs'>
              {unit(holders[0])}
            </span>
          </p>
          <div
            id={popoverId}
            popover='auto'
            className={styles.popover}
            style={anchorStyle}
          >
            <p className={styles.heading}>{label}</p>
            <div className={`flex flex-col gap-4 ${styles.body}`}>
              {holders.map((holder) => (
                <div key={holder.player.slug} className='flex flex-col'>
                  {shared && (
                    <p className={`pt-3 ${eyebrow}`}>{holder.player.name}</p>
                  )}
                  {detail(holder)}
                </div>
              ))}
            </div>
          </div>

          {runnersUp.length > 0 && (
            <ol className='border-border border-t py-2'>
              {runnersUp.map((entry) => (
                <li
                  key={entry.player.slug}
                  className='flex items-baseline justify-between gap-4 py-1'
                >
                  <span className='sr-only'>plass {entry.rank}: </span>
                  <Link
                    href={`/spillere/${entry.player.slug}`}
                    className={`text-text mr-auto text-sm ${nameLink}`}
                  >
                    {entry.player.name}
                  </Link>
                  {/* The same detail as the holder's, for this player. */}
                  <button
                    type='button'
                    popoverTarget={`${popoverId}-${entry.player.slug}`}
                    className={`text-text-muted font-mono text-sm tabular-nums ${styles.trigger} ${styles.quiet}`}
                    style={anchorFor(`${popoverId}-${entry.player.slug}`)}
                  >
                    {figure(entry)}
                    <span className='sr-only'>. {detailLabel}</span>
                  </button>
                  <div
                    id={`${popoverId}-${entry.player.slug}`}
                    popover='auto'
                    className={styles.popover}
                    style={anchorFor(`${popoverId}-${entry.player.slug}`)}
                  >
                    <p className={styles.heading}>
                      {label} · {entry.player.name}
                    </p>
                    <div className={styles.body}>{detail(entry)}</div>
                  </div>
                </li>
              ))}
              {/* Empty rows keep the list the same height on every plate, so
                  a record with one runner-up doesn't sit lower than its
                  neighbour. */}
              {Array.from({ length: MAX_RUNNERS_UP - runnersUp.length }).map(
                (_, i) => (
                  <li key={i} aria-hidden='true' className='py-1 text-sm'>
                    &nbsp;
                  </li>
                ),
              )}
            </ol>
          )}

          {/* An empty ruled footer row: it closes the plate, so stacked
              plates don't run into the one below. Its rule runs edge to edge
              (out through the plate's padding), meeting the wall's hairlines. */}
          <div
            aria-hidden='true'
            className='border-border -mx-5 h-8 border-t'
          />
        </div>
      </article>
    </li>
  );
}
