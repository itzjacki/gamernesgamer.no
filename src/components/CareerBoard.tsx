import Link from 'next/link';
import type { CareerBoardRow, RecordSeason } from '@/lib/results/view-models';

/**
 * The all-time classification: every player across every season, ordered by
 * summed season placement-points (1st = 4 … 4th = 1). The headline of /records.
 *
 * Shares StandingsTable's timing-sheet grammar (Martian Mono, hairline rules,
 * no row hover, solid bg masking the grid) but is its own table: what sets it
 * apart is the per-season strip showing how each total was built, plus titles
 * and game wins. No portraits — identity is the roster's
 * and the hero's job.
 *
 * Accent at rest is the leader's position marker only (the record plates below
 * spend theirs on each holder's figure). The season strip stays neutral even
 * for a season win, so the sheet carries a single highlighted datum.
 *
 * On narrow screens the season strip drops out; position, name, titles, wins
 * and points remain.
 */

interface Props {
  rows: CareerBoardRow[];
  /** The seasons the strip covers, aligned with each row's `placements`. */
  seasons: RecordSeason[];
}

const headCell = 'px-2 py-3 font-normal sm:px-3';
const numberCell = 'px-2 py-3 font-mono text-sm tabular-nums sm:px-3';

export default function CareerBoard({ rows, seasons }: Props) {
  return (
    <table className='border-border bg-bg w-full border-collapse border text-left'>
      <caption className='sr-only'>Sammenlagtscore, alle sesonger</caption>
      <thead>
        <tr className='border-border text-text-muted border-b font-mono text-xs tracking-wide uppercase sm:tracking-widest'>
          <th scope='col' className={`w-10 text-center sm:w-16 ${headCell}`}>
            POS
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
                className='hover:text-accent focus-visible:outline-accent underline underline-offset-2 transition-colors duration-150 focus-visible:outline-2 focus-visible:outline-offset-2'
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
          <tr
            key={row.player.slug}
            className='border-border border-b last:border-b-0'
          >
            <td
              className={`text-center ${numberCell} ${
                row.rank === 1 ? 'text-accent font-bold' : 'text-text-muted'
              }`}
            >
              {row.rank}
            </td>
            <th
              scope='row'
              className='text-text px-2 py-3 font-semibold sm:px-3'
            >
              <Link
                href={`/spillere/${row.player.slug}`}
                className='underline-offset-2 hover:underline'
              >
                {row.player.name}
              </Link>
            </th>
            {row.placements.map((placement, index) => (
              <td
                key={seasons[index].seasonNumber}
                className={`text-text-muted hidden text-center sm:table-cell ${numberCell}`}
              >
                {placement ?? '–'}
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
