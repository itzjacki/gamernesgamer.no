import Link from 'next/link';

/** Kept local so the primitive doesn't depend on the results layer's types. */
export interface StandingsRow {
  placement: number;
  name: string;
  /** Without it the name is not a link. */
  slug?: string;
  totalPoints: number;
  isChampion: boolean;
}

interface Props {
  rows: StandingsRow[];
  pointsLabel?: string;
}

export default function StandingsTable({ rows, pointsLabel = 'POENG' }: Props) {
  return (
    <table className='border-border bg-bg w-full border-collapse border text-left'>
      <thead>
        <tr className='border-border text-text-muted border-b font-mono text-xs tracking-widest uppercase'>
          <th className='w-16 px-4 py-3 text-center font-normal'>POS</th>
          <th className='px-4 py-3 font-normal'>Spiller</th>
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
