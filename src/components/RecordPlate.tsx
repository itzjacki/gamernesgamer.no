import Link from 'next/link';
import { Fragment } from 'react';
import type { RecordEntry } from '@/lib/results/view-models';
import Popover, { PopoverGroup } from './Popover';
import RecordLines from './RecordLines';

/**
 * One record on the /records wall: who holds it, the number, and the three
 * players behind them (the whole field of four). The holder's name sits at the
 * top (sentence case, regular weight, a step larger than the rest); the mono
 * figure, with its unit running on from it on the same line, sits along the
 * bottom of the upper area, directly over the runners-up. Neither is large:
 * the name leads, the figure is a modest readout. `bg-bg` inside a `bg-border`
 * + `gap-px` hairline wall, like a CareerLedger cell.
 *
 * A plate is written to stand alone when cropped into the group chat: its own
 * label, a scope stamp saying which seasons it covers, and the runners-up that
 * give the number its meaning.
 *
 * - Ties: every rank-1 entry is a holder, on one line, over one shared figure.
 *   No tiebreak is applied here that the reader can't see.
 * - The holder's FIGURE carries the accent at rest: it is the record, the
 *   rank-1 datum of the plate. (An earlier pass kept the wall accent-free, on
 *   the grounds that every plate names a winner; the page read too flat.) The
 *   name and the runners-up stay neutral and earn accent on hover; game wins
 *   in the opened list keep it.
 * - A record can be held by a PAIR (closest rivalry): an entry with a `partner`
 *   shows both names. By default each name links to its own player; a record
 *   that is ABOUT two players passes `pairLink`, and the names become one
 *   link to that pair's /vs page.
 * - No portraits: one player on several plates would repeat the same face.
 * - The figure is a `Popover` trigger (native popover, no JS, stays a Server
 *   Component), marked with a dotted underline. The panel lists the games
 *   behind the number (`RecordLines`); each runner-up's figure opens the same
 *   list for that player.
 */

interface Props {
  /** Fragment id, so a link can go with a screenshot (`/records#<id>`). */
  id: string;
  label: string;
  /** Which seasons the record covers, e.g. "S1–S4". */
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
  /**
   * Names an entry as ONE link instead of a link per player — the records
   * about two players ("Jakob – Tobias", "Jørgen på William") point at that
   * pair's /vs page. `text` is also what the popover headings call the entry.
   */
  pairLink?: (entry: RecordEntry) => { text: string; href: string };
}

/**
 * Rows under the holder. Three, not the conventional two: with four players a
 * plate then shows the whole field, so nobody is the one left off.
 */
const MAX_RUNNERS_UP = 3;

const eyebrow = 'text-text-muted font-mono text-xs tracking-widest uppercase';
const nameLink =
  'hover:text-accent focus-visible:outline-accent underline-offset-2 transition-colors duration-150 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2';

/** A stable key for an entry: the player, plus the partner in a pair record. */
const entryKey = (entry: RecordEntry) =>
  entry.partner
    ? `${entry.player.slug}-${entry.partner.slug}`
    : entry.player.slug;

/** An entry's name(s) as plain text: "Jakob", or "Jakob – Tobias" for a pair. */
const plainNames = (entry: RecordEntry) =>
  entry.partner
    ? `${entry.player.name} – ${entry.partner.name}`
    : entry.player.name;

/**
 * An entry's name(s), each linking to that player's page — or, with
 * `pairLink`, the whole string as one link to the pair's /vs page.
 */
function Names({
  entry,
  pairLink,
}: {
  entry: RecordEntry;
  pairLink?: Props['pairLink'];
}) {
  if (pairLink) {
    const { text, href } = pairLink(entry);
    return (
      <Link href={href} className={nameLink}>
        {text}
      </Link>
    );
  }
  return (
    <>
      <Link href={`/spillere/${entry.player.slug}`} className={nameLink}>
        {entry.player.name}
      </Link>
      {entry.partner && (
        <>
          {' – '}
          <Link href={`/spillere/${entry.partner.slug}`} className={nameLink}>
            {entry.partner.name}
          </Link>
        </>
      )}
    </>
  );
}

/** The games behind a figure: title (to the game page), season, placement. */
function gameLines(entry: RecordEntry) {
  return (
    <RecordLines
      lines={entry.games.map((game) => ({
        key: `${game.seasonSlug}-${game.gameSlug}`,
        game,
        seasonNumber: game.seasonNumber,
        value: (
          <>
            <span className='sr-only'>plass </span>
            {game.placement}
          </>
        ),
        accent: game.placement === 1,
      }))}
    />
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
  detail = gameLines,
  pairLink,
}: Props) {
  const holders = entries.filter((e) => e.rank === 1);
  if (holders.length === 0) return null;

  const runnersUp = entries.filter((e) => e.rank > 1).slice(0, MAX_RUNNERS_UP);
  const shared = holders.length > 1;

  const popoverId = `record-${id}`;
  /** What an entry is called in plain text (popover headings, group names). */
  const nameOf = (entry: RecordEntry) =>
    pairLink ? pairLink(entry).text : plainNames(entry);

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
            <Fragment key={entryKey(holder)}>
              {i > 0 && ', '}
              <Names entry={holder} pairLink={pairLink} />
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
          <div className='flex items-baseline-last gap-2 pb-4'>
            <Popover
              id={popoverId}
              heading={label}
              tone='accent'
              className='text-accent shrink-0 font-mono text-3xl leading-none tabular-nums'
              panel={holders.map((holder) => (
                <PopoverGroup
                  key={entryKey(holder)}
                  name={shared ? nameOf(holder) : undefined}
                >
                  {detail(holder)}
                </PopoverGroup>
              ))}
            >
              {figure(holders[0])}
              <span className='sr-only'>. {detailLabel}</span>
            </Popover>
            <span className='text-text-muted font-mono text-xs'>
              {unit(holders[0])}
            </span>
          </div>

          {runnersUp.length > 0 && (
            <ol className='border-border border-t py-2'>
              {runnersUp.map((entry) => (
                <li
                  key={entryKey(entry)}
                  className='flex items-baseline justify-between gap-4 py-1'
                >
                  <span className='sr-only'>plass {entry.rank}: </span>
                  <span className='text-text mr-auto text-sm'>
                    <Names entry={entry} pairLink={pairLink} />
                  </span>
                  {/* The same detail as the holder's, for this player. */}
                  <Popover
                    id={`${popoverId}-${entryKey(entry)}`}
                    heading={`${label} · ${nameOf(entry)}`}
                    dense
                    className='text-text-muted font-mono text-sm tabular-nums'
                    panel={detail(entry)}
                  >
                    {figure(entry)}
                    <span className='sr-only'>. {detailLabel}</span>
                  </Popover>
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
