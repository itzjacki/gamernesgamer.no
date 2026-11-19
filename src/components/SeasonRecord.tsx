import Link from 'next/link';
import type { CareerSeasonRow } from '@/lib/results/view-models';
import { HEAD_ROW, ROW, TABLE } from '@/components/table-classes';

/** A player's season-by-season table. A readout, not a chart, by decision. */

interface Props {
  seasons: CareerSeasonRow[];
}

export default function SeasonRecord({ seasons }: Props) {
  return (
    <table className={TABLE}>
      <thead>
        <tr className={HEAD_ROW}>
          <th className='px-3 py-2 font-normal'>SESONG</th>
          <th className='w-24 px-3 py-2 text-center font-normal'>PLASS</th>
          <th className='w-24 px-3 py-2 text-right font-normal'>POENG</th>
        </tr>
      </thead>
      <tbody>
        {seasons.map((s) => (
          <tr key={s.seasonNumber} className={ROW}>
            <td className='text-text px-3 py-2 font-semibold'>
              <Link
                href={`/sesong/${s.seasonSlug}`}
                className='focus-visible:outline-accent relative underline-offset-2 after:absolute after:inset-x-0 after:-inset-y-3 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2'
              >
                S{s.seasonNumber}
              </Link>
            </td>
            <td
              className={`px-3 py-2 text-center font-mono text-sm tabular-nums ${
                s.isChampion
                  ? 'text-text-accent font-medium'
                  : 'text-text-muted'
              }`}
            >
              {s.placement}.
            </td>
            <td className='text-text px-3 py-2 text-right font-mono text-sm tabular-nums'>
              {s.totalPoints}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
