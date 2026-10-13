import Link from 'next/link';
import Checkbox from './Checkbox';
import SectionLabel from './SectionLabel';
import styles from './TagRecord.module.css';
import UnrankedRows, { unrankedCaption } from './UnrankedRows';
import { tagLabels } from '@/data/tag-labels';
import type { TagStat } from '@/lib/results/view-models';
import { splitRanked } from '@/lib/tag-ranking';
import type { Tag } from '@/types/tag';

/**
 * What a player is good and bad at: a best/worst headline over the full
 * per-tag breakdown it summarises, in one hairline frame. Genre and format tags
 * are one list here — the split between them is a data-entry detail (which tags
 * follow the title, which follow one season's instance), not something a reader
 * needs.
 *
 * The stats arrive unfiltered and sorted best first. The ranking cutoff is
 * applied here, on the consuming side (owner call — not the data layer's job):
 * a tag needs MIN_RANKED_GAMES games (`@/lib/tag-ranking`, shared with
 * CareerLedger) to be named best or worst. Tags below it are collapsed by default
 * (`UnrankedRows`, shared with TagCrowns), under a caption that states why they
 * are not ranked.
 *
 * Each tag name is a native-popover trigger (`<button popovertarget>` +
 * `[popover]` — no JS, stays a Server Component) listing the games behind the
 * row: title (linking to the game page), season and placement.
 *
 * The unranked rows are a second table (a <details> can't wrap table rows), so
 * both tables use a fixed layout with the same <colgroup> to keep their columns
 * aligned.
 *
 * A checkbox in the frame's footer row leaves out the games the player chose
 * themselves (off by default): people pick what they are good at, which skews the list.
 *
 * No accent at rest: "best of my own categories" is a personal maximum, not
 * champion / rank-1 data. Shares SeasonRecord's table grammar and CareerLedger's
 * `bg-border` + `gap-px` hairline technique.
 */

interface Props {
  stats: TagStat<Tag>[];
  /** The same stats with the player's own game picks left out. */
  statsWithoutOwnPicks: TagStat<Tag>[];
}

const average = (stat: { averagePlacement: number }) =>
  stat.averagePlacement.toFixed(1);

const numberCell =
  'px-2 py-3 text-right font-mono text-sm tabular-nums sm:px-3';
const headCell = 'px-2 py-3 text-right font-normal sm:px-3';
const eyebrowRow =
  'text-text-muted font-mono text-xs tracking-widest uppercase';

/**
 * The headline + tables for one set of stats, as cells of TagRecord's frame.
 * `idPrefix` keeps popover ids unique, since TagRecord renders two of these
 * (see below). `className` carries the show/hide toggle.
 */
function TagBody({
  stats,
  idPrefix,
  className,
}: {
  stats: TagStat<Tag>[];
  idPrefix: string;
  className: string;
}) {
  if (stats.length === 0) return null;

  const { ranked, unranked } = splitRanked(stats);
  const best = ranked[0];
  const worst = ranked[ranked.length - 1];

  /**
   * One headline cell: eyebrow, the tag as a word, then its figures. The
   * figures are pushed to the bottom so they line up across the two cells when
   * one tag name wraps.
   */
  const headline = (label: string, stat: TagStat<Tag>, wide = false) => (
    <div
      className={`bg-bg flex flex-col gap-3 p-5 ${wide ? 'col-span-2' : ''}`}
    >
      <dt>
        <SectionLabel>{label}</SectionLabel>
      </dt>
      <dd className='flex flex-1 flex-col gap-2'>
        <span className='text-text text-xl font-semibold wrap-break-word hyphens-auto sm:text-2xl'>
          {tagLabels[stat.tag]}
        </span>
        <span className='text-text-muted mt-auto font-mono text-xs tabular-nums'>
          {average(stat)} i snitt · {stat.games} spill
        </span>
      </dd>
    </div>
  );

  // Shared by both tables so their columns line up.
  const columns = (
    <colgroup>
      <col />
      <col className='w-18' />
      <col className='w-18' />
      <col className='w-18' />
    </colgroup>
  );

  const headRow = (
    <tr className={`border-border border-b ${eyebrowRow}`}>
      <th scope='col' className='px-3 py-3 font-normal sm:px-4'>
        Kategori
      </th>
      <th scope='col' className={headCell}>
        Spill
      </th>
      <th scope='col' className={headCell}>
        Seire
      </th>
      <th scope='col' className={headCell}>
        Snitt
      </th>
    </tr>
  );

  /** The tag name as a popover trigger, plus the games behind the row. */
  const tagCell = (stat: TagStat<Tag>) => {
    const popoverId = `tag-games-${idPrefix}-${stat.tag}`;
    // A unique dashed-ident anchor name per row, bridged to the CSS module via
    // an inline custom property on both the trigger and its popover.
    const anchorStyle = { '--anchor': `--${popoverId}` } as React.CSSProperties;

    return (
      <>
        <button
          type='button'
          popoverTarget={popoverId}
          className={styles.trigger}
          style={anchorStyle}
        >
          {tagLabels[stat.tag]}
        </button>
        <div
          id={popoverId}
          popover='auto'
          className={styles.popover}
          style={anchorStyle}
        >
          <p className={styles.heading}>{tagLabels[stat.tag]}</p>
          <ul className={styles.lines}>
            {stat.results.map((r) => (
              <li key={`${r.seasonSlug}-${r.gameSlug}`} className={styles.line}>
                <Link
                  href={`/sesong/${r.seasonSlug}/${r.gameSlug}`}
                  className={styles.game}
                >
                  {r.gameTitle}
                </Link>
                <span className={styles.season}>
                  <span className='sr-only'>sesong </span>
                  <span aria-hidden='true'>S</span>
                  {r.seasonNumber}
                </span>
                <span
                  className={`${styles.placement} ${r.placement === 1 ? styles.win : ''}`}
                >
                  <span className='sr-only'>plass </span>
                  {r.placement}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </>
    );
  };

  const row = (stat: TagStat<Tag>, isRanked: boolean) => (
    <tr key={stat.tag} className='border-border border-b last:border-b-0'>
      <th
        scope='row'
        className={`px-3 py-3 sm:px-4 ${
          isRanked ? 'text-text font-semibold' : 'text-text-muted font-normal'
        }`}
      >
        {tagCell(stat)}
      </th>
      <td className={`text-text-muted ${numberCell}`}>{stat.games}</td>
      <td className={`text-text-muted ${numberCell}`}>{stat.wins}</td>
      <td
        className={`${numberCell} ${isRanked ? 'text-text' : 'text-text-muted'}`}
      >
        {average(stat)}
      </td>
    </tr>
  );

  return (
    <div className={`grid-cols-2 gap-px ${className}`}>
      {best && (
        <dl className='col-span-2 grid grid-cols-2 gap-px'>
          {ranked.length === 1 ? (
            headline('Kategori', best, true)
          ) : (
            <>
              {headline('Beste kategori', best)}
              {headline('Dårligste kategori', worst)}
            </>
          )}
        </dl>
      )}

      {ranked.length > 0 && (
        <table className='bg-bg col-span-2 w-full table-fixed border-collapse text-left'>
          <caption className='sr-only'>Resultater per kategori</caption>
          {columns}
          <thead>{headRow}</thead>
          <tbody>{ranked.map((s) => row(s, true))}</tbody>
        </table>
      )}

      {unranked.length > 0 && (
        <UnrankedRows count={unranked.length} className='bg-bg col-span-2'>
          <table className='border-border w-full table-fixed border-collapse border-t text-left'>
            <caption
              className={`border-border border-b px-3 py-3 text-left sm:px-4 ${eyebrowRow}`}
            >
              {unrankedCaption}
            </caption>
            {columns}
            <thead className='sr-only'>{headRow}</thead>
            <tbody>{unranked.map((s) => row(s, false))}</tbody>
          </table>
        </UnrankedRows>
      )}
    </div>
  );
}

/**
 * One hairline frame: the stats, then a footer row with the own-picks filter.
 *
 * Both variants are rendered and the checkbox picks which one shows, in CSS
 * alone (`:has(input:checked)`) — no JS, so this stays a Server Component like
 * the popovers and the <details> above. The hidden variant is `display: none`,
 * so it is out of the accessibility tree too.
 */
export default function TagRecord({ stats, statsWithoutOwnPicks }: Props) {
  if (stats.length === 0) return null;

  return (
    <div className='group/own border-border bg-border flex flex-col gap-px border'>
      <TagBody
        stats={stats}
        idPrefix='all'
        className='grid group-has-[input:checked]/own:hidden'
      />
      <TagBody
        stats={statsWithoutOwnPicks}
        idPrefix='others'
        className='hidden group-has-[input:checked]/own:grid'
      />
      <div className='bg-bg px-3 sm:px-4'>
        <Checkbox>Ekskluder egne spill</Checkbox>
      </div>
    </div>
  );
}
