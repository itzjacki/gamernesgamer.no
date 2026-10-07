import Link from 'next/link';

/**
 * One row of the standings table. Structurally this is the subset of
 * ComposedStandingRow the table needs, kept local so the primitive doesn't
 * depend on the results layer's types (it's reused on player/records pages,
 * which assemble rows differently).
 */
export interface StandingsRow {
  /** Final placement (1 = champion). */
  placement: number;
  /** Display name. */
  name: string;
  /** Player slug for the /spillere link (omit the link if undefined). */
  slug?: string;
  /** Derived total points. */
  totalPoints: number;
  /** True for the champion row — earns the single accent. */
  isChampion: boolean;
}

interface Props {
  rows: StandingsRow[];
  /** mono column header for the points column (e.g. "POENG"). */
  pointsLabel?: string;
}

/**
 * The VERKSTED standings table: a motorsport timing sheet. Martian Mono for all
 * numeric/metadata cells, hairline rules between rows, no row hover, no radius,
 * no shadow — a solid `bg-bg` surface that masks the blueprint grid. The single
 * accent (#E8334A) is spent ONLY on the champion's position marker, so P1 reads
 * as the one highlighted datum on the sheet.
 *
 * Reusable: season final standings, and later player-page / records tables.
 */
export default function StandingsTable({ rows, pointsLabel = 'POENG' }: Props) {
  return (
    <table className='border-border bg-bg w-full border-collapse border text-left'>
      <thead>
        <tr className='border-border text-text-muted border-b font-mono text-xs tracking-widest uppercase'>
          <th className='w-16 px-4 py-3 text-center font-normal'>POS</th>
          <th className='px-4 py-3 font-normal'>UTØVER</th>
          <th className='w-24 px-4 py-3 text-right font-normal'>
            {pointsLabel}
          </th>
        </tr>
      </thead>
      <tbody>
        {rows.map((row) => (
          <tr
            key={`${row.placement}-${row.name}`}
            className='border-border border-b last:border-b-0'
          >
            <td
              className={`px-4 py-3 text-center font-mono text-sm tabular-nums ${
                row.isChampion ? 'text-accent font-bold' : 'text-text-muted'
              }`}
            >
              {row.placement}
            </td>
            <td className='text-text px-4 py-3 font-semibold'>
              {row.slug ? (
                <Link
                  href={`/spillere/${row.slug}`}
                  className='underline-offset-2 hover:underline'
                >
                  {row.name}
                </Link>
              ) : (
                row.name
              )}
            </td>
            <td className='text-text px-4 py-3 text-right font-mono text-sm tabular-nums'>
              {row.totalPoints}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
