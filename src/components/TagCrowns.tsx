import Link from 'next/link';
import { Fragment } from 'react';
import Checkbox from './Checkbox';
import GameListPopover from './GameListPopover';
import UnrankedRows, { unrankedCaption } from './UnrankedRows';
import { tagLabels } from '@/data/tag-labels';
import type { TagCrown } from '@/lib/results/view-models';
import { MIN_RANKED_GAMES } from '@/lib/tag-ranking';

/**
 * Who is best at each category, as ONE block rather than a plate per tag — a
 * wall of crowns would mostly repeat the same two names. One row per tag: the
 * player(s) with the best average placement under it, their wins and average.
 *
 * Genre and format tags are one list, as everywhere else that reads tags. The
 * crowns arrive unfiltered; the minimum sample is applied here, on the
 * consuming side, with the same cutoff TagRecord and CareerLedger use
 * (`MIN_RANKED_GAMES`). Tags below it are collapsed by default (`UnrankedRows`,
 * shared with TagRecord) as a second table, so both tables use a fixed layout
 * with the same <colgroup> to keep their columns aligned.
 *
 * A checkbox in the frame's footer row leaves out the games each player chose
 * themselves (off by default), the same filter and the same CSS-only toggle as
 * TagRecord: both variants are rendered and `:has(input:checked)` picks one —
 * no JS, so this stays a Server Component.
 *
 * Shares TagRecord's table grammar. No accent at rest — the best of a category
 * is a maximum, not champion data.
 */

interface Props {
  crowns: TagCrown[];
  /** The same crowns with every player's own game picks left out. */
  crownsWithoutOwnPicks: TagCrown[];
}

const headCell = 'px-2 py-3 font-normal sm:px-3';
const numberCell =
  'px-2 py-3 text-right font-mono text-sm tabular-nums sm:px-3';
const eyebrowRow =
  'text-text-muted font-mono text-xs tracking-widest uppercase';

/** The ranked table and the folded-away unranked one, for one set of crowns. */
function CrownsBody({
  crowns,
  idPrefix,
  className,
}: {
  crowns: TagCrown[];
  /** Keeps popover ids unique: TagCrowns renders two of these. */
  idPrefix: string;
  className: string;
}) {
  const rows = crowns
    .map((crown) => ({
      tag: crown.tag,
      holders: crown.entries.filter((e) => e.rank === 1),
    }))
    .filter(({ holders }) => holders.length > 0);

  const isRanked = ({ holders }: (typeof rows)[number]) =>
    (holders[0].outOf ?? 0) >= MIN_RANKED_GAMES;
  const ranked = rows.filter(isRanked);
  const unranked = rows.filter((r) => !isRanked(r));

  if (rows.length === 0) return null;

  // Shared by both tables so their columns line up.
  const columns = (
    <colgroup>
      <col />
      <col className='w-24 sm:w-44' />
      <col className='w-16 sm:w-18' />
      <col className='w-16 sm:w-18' />
    </colgroup>
  );

  const headRow = (
    <tr className={`border-border border-b ${eyebrowRow}`}>
      <th scope='col' className='px-3 py-3 font-normal sm:px-4'>
        Kategori
      </th>
      <th scope='col' className={headCell}>
        Best
      </th>
      <th scope='col' className={`text-right ${headCell}`}>
        Seire
      </th>
      <th scope='col' className={`text-right ${headCell}`}>
        Snitt
      </th>
    </tr>
  );

  const row = ({ tag, holders }: (typeof rows)[number], ranks: boolean) => {
    const [first] = holders;
    const won = first.games.filter((g) => g.placement === 1).length;
    return (
      <tr key={tag} className='border-border border-b last:border-b-0'>
        <th
          scope='row'
          className='text-text-muted py-3 pr-1 pl-3 font-normal wrap-break-word hyphens-auto sm:px-4'
        >
          {/* The games behind the row: the holder's under this tag, one
              group per player when the crown is shared. */}
          <GameListPopover
            id={`crown-games-${idPrefix}-${tag}`}
            label={tagLabels[tag]}
            heading={
              holders.length === 1
                ? `${tagLabels[tag]} · ${first.player.name}`
                : tagLabels[tag]
            }
            groups={holders.map((holder) => ({
              name: holders.length > 1 ? holder.player.name : undefined,
              results: holder.games,
            }))}
          />
        </th>
        {/* Tied holders share one line, comma-separated (as on the record
            plates); a long tie wraps inside the column. */}
        <td
          className={`px-2 py-3 sm:px-3 ${
            ranks ? 'text-text font-semibold' : 'text-text-muted'
          }`}
        >
          {holders.map((holder, i) => (
            <Fragment key={holder.player.slug}>
              {i > 0 && ', '}
              <Link
                href={`/spillere/${holder.player.slug}`}
                className='underline-offset-2 hover:underline'
              >
                {holder.player.name}
              </Link>
            </Fragment>
          ))}
        </td>
        <td className={`text-text-muted ${numberCell}`}>
          {won}
          <span aria-hidden='true'>/</span>
          <span className='sr-only'> av </span>
          {first.outOf}
        </td>
        <td
          className={`${numberCell} ${ranks ? 'text-text' : 'text-text-muted'}`}
        >
          {first.value.toFixed(1)}
        </td>
      </tr>
    );
  };

  return (
    <div className={`flex-col gap-px ${className}`}>
      {ranked.length > 0 && (
        <table className='bg-bg w-full table-fixed border-collapse text-left'>
          <caption className='sr-only'>Best per spillkategori</caption>
          {columns}
          <thead>{headRow}</thead>
          <tbody>{ranked.map((r) => row(r, true))}</tbody>
        </table>
      )}

      {unranked.length > 0 && (
        <UnrankedRows count={unranked.length} className='bg-bg'>
          <table className='border-border w-full table-fixed border-collapse border-t text-left'>
            <caption
              className={`border-border border-b px-3 py-3 text-left sm:px-4 ${eyebrowRow}`}
            >
              {unrankedCaption}
            </caption>
            {columns}
            <thead className='sr-only'>{headRow}</thead>
            <tbody>{unranked.map((r) => row(r, false))}</tbody>
          </table>
        </UnrankedRows>
      )}
    </div>
  );
}

export default function TagCrowns({ crowns, crownsWithoutOwnPicks }: Props) {
  if (crowns.length === 0) return null;

  return (
    <div className='group/own border-border bg-border flex flex-col gap-px border'>
      <CrownsBody
        crowns={crowns}
        idPrefix='all'
        className='flex group-has-[input:checked]/own:hidden'
      />
      <CrownsBody
        crowns={crownsWithoutOwnPicks}
        idPrefix='others'
        className='hidden group-has-[input:checked]/own:flex'
      />
      <div className='bg-bg px-3 sm:px-4'>
        <Checkbox>Ekskluder egne spill</Checkbox>
      </div>
    </div>
  );
}
