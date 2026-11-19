import Link from 'next/link';
import type { ComposedGamePlacementRow } from '@/lib/results/compose';
import Popover from './Popover';
import RecordLines, { pointsBreakdownLines } from './RecordLines';
import {
  FIGURE_CELL,
  HEAD_CELL,
  HEAD_ROW,
  NAME_CELL,
  NAME_LINK,
  PAD,
  RANK_CELL,
  ROW,
  TABLE,
} from './table-classes';

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
    <table className={TABLE}>
      <thead>
        <tr className={HEAD_ROW}>
          <th className={`${RANK_CELL} ${PAD} ${HEAD_CELL}`}>
            {LABELS.placement}
          </th>
          <th className={`${PAD} ${HEAD_CELL} lg:min-w-40`}>{LABELS.player}</th>
          <th className={`${FIGURE_CELL} ${PAD} ${HEAD_CELL}`}>
            {LABELS.points}
          </th>
        </tr>
      </thead>
      <tbody>
        {rows.map((row) => (
          <tr key={row.player.seasonPlayerId} className={ROW}>
            <td
              className={`${RANK_CELL} ${PAD} ${
                row.placement === 1
                  ? 'text-text-accent font-medium'
                  : 'text-text-muted'
              }`}
            >
              {row.placement}
            </td>
            <td className={`${NAME_CELL} ${PAD}`}>
              <Link href={`/spillere/${row.player.slug}`} className={NAME_LINK}>
                {row.player.name}
              </Link>
            </td>
            <td className={`${FIGURE_CELL} ${PAD} text-text relative`}>
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
