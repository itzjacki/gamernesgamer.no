import Checkbox from './Checkbox';
import SectionLabel from './SectionLabel';
import GameListPopover from './GameListPopover';
import UnrankedRows, { unrankedCaption } from './UnrankedRows';
import { tagLabels } from '@/data/tag-labels';
import type { TagStat } from '@/lib/results/view-models';
import { splitRanked } from '@/lib/tag-ranking';
import type { Tag } from '@/types/tag';

/**
 * The stats arrive unfiltered, best first; the ranking cutoff is applied here,
 * not in the data layer. The checkbox leaves out the player's own game picks,
 * since people pick what they are good at. No accent at rest: a personal
 * maximum is not rank-1 data.
 */

interface Props {
  stats: TagStat<Tag>[];
  statsWithoutOwnPicks: TagStat<Tag>[];
}

const average = (stat: { averagePlacement: number }) =>
  stat.averagePlacement.toFixed(1);

const numberCell =
  'px-2 py-3 text-right font-mono text-sm tabular-nums sm:px-3';
const headCell = 'px-2 py-3 text-right font-normal sm:px-3';
const eyebrowRow =
  'text-text-muted font-mono text-xs tracking-widest uppercase';

/** `idPrefix` keeps popover ids unique: TagRecord renders two of these. */
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

  // Figures pushed to the bottom line up across the two cells when one tag
  // name wraps.
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

  const tagCell = (stat: TagStat<Tag>) => (
    <GameListPopover
      id={`tag-games-${idPrefix}-${stat.tag}`}
      label={tagLabels[stat.tag]}
      groups={[{ results: stat.results }]}
    />
  );

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
 * Both variants are rendered and the checkbox picks one in CSS alone
 * (`:has(input:checked)`). The hidden one is `display: none`, so it is out of
 * the accessibility tree too.
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
