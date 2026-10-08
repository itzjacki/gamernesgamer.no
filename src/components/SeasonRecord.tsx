import Link from 'next/link';
import type { CareerSeasonRow } from '@/lib/results/view-models';

/**
 * The season-by-season record: a compact motorsport-timing-sheet readout, one
 * row per season the player competed in, each linking out to that season page.
 *
 * Deliberately a mono STEPPED READOUT, not a chart (owner call): at ~4 seasons
 * a line chart reads emptier than the numbers do, and this duplicates nothing.
 * Shares StandingsTable's grammar (Martian Mono, tabular-nums, hairline rules,
 * solid bg masking the grid, no radius/shadow). The single accent is spent only
 * on champion (P1) seasons — legitimate champion data, consistent with the
 * site-wide rule.
 */

interface Props {
  seasons: CareerSeasonRow[];
  /** Optional mono eyebrow rendered inside the table surface (as a caption). */
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
