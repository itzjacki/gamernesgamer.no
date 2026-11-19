import Link from 'next/link';
import type { ComposedGamePlacementRow } from '@/lib/results/compose';
import Popover from './Popover';
import RecordLines, { pointsBreakdownLines } from './RecordLines';

/**
 * A game's final standings. Points are the total; where power-ups moved them,
 * the figure opens the breakdown.
 */

const LABELS = {
  placement: 'POS.',
  player: 'Spiller',
  points: 'Poeng',
};

interface Props {
  /** Namespaces popover ids. */
  id: string;
  rows: ComposedGamePlacementRow[];
}

export default function GameStandings({ id, rows }: Props) {
  return (
    <table className='border-border bg-bg w-full border-collapse border text-left'>
      <thead>
        <tr className='border-border text-text-muted border-b font-mono text-xs tracking-widest uppercase'>
          <th className='w-12 px-3 py-3 text-center font-normal'>
            {LABELS.placement}
          </th>
          <th className='px-3 py-3 font-normal lg:min-w-40'>{LABELS.player}</th>
          <th className='w-20 px-3 py-3 text-right font-normal'>
            {LABELS.points}
          </th>
        </tr>
      </thead>
      <tbody>
        {rows.map((row) => (
          <tr
            key={row.player.seasonPlayerId}
            className='border-border h-10 border-b last:border-b-0'
          >
            <td
              className={`px-3 text-center font-mono text-sm tabular-nums ${
                row.placement === 1
                  ? 'text-text-accent font-medium'
                  : 'text-text-muted'
              }`}
            >
              {row.placement}
            </td>
            <td className='text-text px-3 font-semibold'>
              <Link
                href={`/spillere/${row.player.slug}`}
                className='focus-visible:outline-accent underline-offset-2 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2'
              >
                {row.player.name}
              </Link>
            </td>
            <td className='text-text relative px-3 text-right font-mono text-sm font-medium tabular-nums'>
              {row.powerUpUses.length > 0 ? (
                <Popover
                  id={`${id}-pu-${row.player.seasonPlayerId}`}
                  label={`${row.points} poeng, vis poengfordeling`}
                  className='text-text'
                  panel={
                    <RecordLines
                      lines={pointsBreakdownLines(
                        row.ladderPoints,
                        row.powerUpUses,
                      )}
                    />
                  }
                >
                  {row.points}
                </Popover>
              ) : (
                row.points
              )}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
