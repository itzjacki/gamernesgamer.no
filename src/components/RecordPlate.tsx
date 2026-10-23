import Link from 'next/link';
import { Fragment } from 'react';
import type { RecordEntry } from '@/lib/results/view-models';
import Popover, { PopoverGroup } from './Popover';
import RecordLines from './RecordLines';

/**
 * One record on the /records wall. A plate must stand alone when cropped into
 * the group chat: its own label, a scope stamp and the runners-up. Tied
 * holders share one line and one figure — no tiebreak the reader can't see.
 */

export interface Props {
  /** Fragment id, so a link can go with a screenshot (`/records#<id>`). */
  id: string;
  label: string;
  /** Which seasons the record covers, e.g. "S1–S4". */
  scope: string;
  /** Best first, with shared ranks. */
  entries: RecordEntry[];
  figure: (entry: RecordEntry) => string;
  /** The unit and any qualifier after the holder's figure. */
  unit: (holder: RecordEntry) => string;
  /** Screen-reader label for the figure button that opens the detail. */
  detailLabel: string;
  /** What is behind one entry's figure. Defaults to the list of their games. */
  detail?: (entry: RecordEntry) => React.ReactNode;
  /**
   * Names an entry as ONE link instead of a link per player — the records
   * about two players ("Jakob – Tobias", "Jørgen på William") point at that
   * pair's /vs page. `text` is also what the popover headings call the entry.
   */
  pairLink?: (entry: RecordEntry) => { text: string; href: string };
  /**
   * The empty ruled row that closes the plate on the wall. Leave it out when
   * the plate stands over a cell of its own, or it leaves a dead strip.
   */
  footerRow?: boolean;
}

/** Three, not two: with four players the plate shows the whole field. */
const MAX_RUNNERS_UP = 3;

const eyebrow = 'text-text-muted font-mono text-xs tracking-widest uppercase';
const nameLink =
  'hover:text-accent focus-visible:outline-accent underline-offset-2 transition-colors duration-150 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2';

const entryKey = (entry: RecordEntry) =>
  entry.partner
    ? `${entry.player.slug}-${entry.partner.slug}`
    : entry.player.slug;

const plainNames = (entry: RecordEntry) =>
  entry.partner
    ? `${entry.player.name} – ${entry.partner.name}`
    : entry.player.name;

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
  footerRow = true,
}: Props) {
  const holders = entries.filter((e) => e.rank === 1);
  if (holders.length === 0) return null;

  const runnersUp = entries.filter((e) => e.rank > 1).slice(0, MAX_RUNNERS_UP);
  const shared = holders.length > 1;

  const popoverId = `record-${id}`;
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
          {/* A long unit wraps upward (last-baseline alignment), so its
              final line stays on the figure's baseline. */}
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

          {/* The rule runs out through the padding to meet the wall's
              hairlines. */}
          {footerRow && (
            <div
              aria-hidden='true'
              className='border-border -mx-5 h-8 border-t'
            />
          )}
        </div>
      </article>
    </li>
  );
}
