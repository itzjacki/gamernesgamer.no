import Link from 'next/link';
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
 * (`MIN_RANKED_GAMES`). Tags below it are left out.
 *
 * Shares TagRecord's table grammar. No accent at rest — the best of a category
 * is a maximum, not champion data.
 */

interface Props {
  crowns: TagCrown[];
}

const headCell = 'px-2 py-3 font-normal sm:px-3';
const numberCell =
  'px-2 py-3 text-right font-mono text-sm tabular-nums sm:px-3';

export default function TagCrowns({ crowns }: Props) {
  const rows = crowns
    .map((crown) => ({
      tag: crown.tag,
      holders: crown.entries.filter((e) => e.rank === 1),
    }))
    .filter(
      ({ holders }) =>
        holders.length > 0 && (holders[0].outOf ?? 0) >= MIN_RANKED_GAMES,
    );

  if (rows.length === 0) return null;

  return (
    <table className='border-border bg-bg w-full border-collapse border text-left'>
      {/* TODO(copy): caption + column heads — best-effort. */}
      <caption className='sr-only'>Best per kategori</caption>
      <thead>
        <tr className='border-border text-text-muted border-b font-mono text-xs tracking-widest uppercase'>
          <th scope='col' className='px-3 py-3 font-normal sm:px-4'>
            Kategori
          </th>
          <th scope='col' className={headCell}>
            Best
          </th>
          <th scope='col' className={`w-18 text-right ${headCell}`}>
            Seire
          </th>
          <th scope='col' className={`w-18 text-right ${headCell}`}>
            Snitt
          </th>
        </tr>
      </thead>
      <tbody>
        {rows.map(({ tag, holders }) => {
          const [first] = holders;
          const won = first.games.filter((g) => g.placement === 1).length;
          return (
            <tr key={tag} className='border-border border-b last:border-b-0'>
              <th
                scope='row'
                className='text-text-muted px-3 py-3 font-normal sm:px-4'
              >
                {tagLabels[tag]}
              </th>
              <td className='text-text px-2 py-3 font-semibold sm:px-3'>
                <span className='flex flex-col items-start'>
                  {holders.map((holder) => (
                    <Link
                      key={holder.player.slug}
                      href={`/spillere/${holder.player.slug}`}
                      className='underline-offset-2 hover:underline'
                    >
                      {holder.player.name}
                    </Link>
                  ))}
                </span>
              </td>
              <td className={`text-text-muted ${numberCell}`}>
                {won}
                <span aria-hidden='true'>/</span>
                <span className='sr-only'> av </span>
                {first.outOf}
              </td>
              <td className={`text-text ${numberCell}`}>
                {first.value.toFixed(1)}
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}
