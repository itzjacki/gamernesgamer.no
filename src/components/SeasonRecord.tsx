import Link from 'next/link';
import type { CareerSeasonRow } from '@/lib/results/view-models';

/** A player's season-by-season table. A readout, not a chart, by decision. */

interface Props {
  seasons: CareerSeasonRow[];
  label?: string;
}

export default function SeasonRecord({ seasons, label }: Props) {
  return (
    <table className='border-border bg-bg w-full border-collapse border text-left'>
      {label && (
        <caption className='text-text-muted border-border border-b px-4 py-3 text-left font-mono text-xs tracking-widest uppercase'>
          {label}
        </caption>
      )}
      <thead>
        <tr className='border-border text-text-muted border-b font-mono text-xs tracking-widest uppercase'>
          <th className='px-4 py-3 font-normal'>SESONG</th>
          <th className='w-24 px-4 py-3 text-center font-normal'>PLASS</th>
          <th className='w-24 px-4 py-3 text-right font-normal'>POENG</th>
        </tr>
      </thead>
      <tbody>
        {seasons.map((s) => (
          <tr
            key={s.seasonNumber}
            className='border-border border-b last:border-b-0'
          >
            <td className='text-text px-4 py-3 font-semibold'>
              <Link
                href={`/sesong/${s.seasonSlug}`}
                className='underline-offset-2 hover:underline'
              >
                Sesong {s.seasonNumber}
              </Link>
            </td>
            <td
              className={`px-4 py-3 text-center font-mono text-sm tabular-nums ${
                s.isChampion ? 'text-accent font-bold' : 'text-text-muted'
              }`}
            >
              {s.placement}
            </td>
            <td className='text-text px-4 py-3 text-right font-mono text-sm tabular-nums'>
              {s.totalPoints}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
