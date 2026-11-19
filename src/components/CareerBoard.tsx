import Link from 'next/link';
import type { CareerBoardRow, RecordSeason } from '@/lib/results/view-models';
import { HEAD_ROW, ROW, TABLE } from '@/components/table-classes';

/**
 * Accent at rest is the leader's position marker only: the season strip stays
 * neutral even for a season win, so the sheet carries one highlighted datum.
 */

interface Props {
  rows: CareerBoardRow[];
  /** Aligned with each row's `placements`. */
  seasons: RecordSeason[];
}

const headCell = 'px-1.5 py-2 font-normal sm:px-3';
const numberCell = 'px-1.5 py-2 font-mono text-sm tabular-nums sm:px-3';

export default function CareerBoard({ rows, seasons }: Props) {
  return (
    <table className={TABLE}>
      <caption className='sr-only'>Sammenlagtscore, alle sesonger</caption>
      <thead>
        <tr className={HEAD_ROW}>
          <th scope='col' className={`w-10 text-center sm:w-16 ${headCell}`}>
            POS.
          </th>
          <th scope='col' className={headCell}>
            Spiller
          </th>
          {seasons.map((season) => (
            <th
              key={season.seasonNumber}
              scope='col'
              className={`hidden w-12 text-center sm:table-cell ${headCell}`}
            >
              <Link
                href={`/sesong/${season.seasonSlug}`}
                className='hover:text-text-accent focus-visible:outline-accent underline underline-offset-2 transition-colors duration-150 focus-visible:outline-2 focus-visible:outline-offset-2'
              >
                <span className='sr-only'>Sesong </span>
                <span aria-hidden='true'>S</span>
                {season.seasonNumber}
              </Link>
            </th>
          ))}
          <th scope='col' className={`text-right ${headCell}`}>
            Titler
          </th>
          <th scope='col' className={`text-right ${headCell}`}>
            Spillseire
          </th>
          <th scope='col' className={`text-right ${headCell}`}>
            Poeng
          </th>
        </tr>
      </thead>
      <tbody>
        {rows.map((row) => (
          <tr key={row.player.slug} className={ROW}>
            <td
              className={`text-center ${numberCell} ${
                row.rank === 1
                  ? 'text-text-accent font-medium'
                  : 'text-text-muted'
              }`}
            >
              {row.rank}
            </td>
            <th
              scope='row'
              className='text-text px-1.5 py-2 font-semibold sm:px-3'
            >
              <Link
                href={`/spillere/${row.player.slug}`}
                className='focus-visible:outline-accent relative underline-offset-2 after:absolute after:inset-x-0 after:-inset-y-3 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2'
              >
                {row.player.name}
              </Link>
            </th>
            {row.placements.map((placement, index) => (
              <td
                key={seasons[index].seasonNumber}
                className={`text-text-muted hidden text-center sm:table-cell ${numberCell}`}
              >
                {placement === null ? '–' : `${placement}.`}
              </td>
            ))}
            <td className={`text-text-muted text-right ${numberCell}`}>
              {row.championships}
            </td>
            <td className={`text-text-muted text-right ${numberCell}`}>
              {row.gameWins}
            </td>
            <td className={`text-text text-right ${numberCell}`}>
              {row.placementPoints}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
