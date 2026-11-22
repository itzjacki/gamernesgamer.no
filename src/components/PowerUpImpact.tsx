import Link from 'next/link';
import { signedDelta } from '@/lib/format';
import type { PowerUpImpactRow } from '@/lib/results/power-up-impact';
import SectionLabel from './SectionLabel';
import {
  FIGURE_CELL,
  HEAD_CELL,
  HEAD_ROW,
  NAME_CELL,
  NAME_LINK,
  PAD,
  ROW,
  TABLE,
} from './table-classes';

/**
 * Each player's season points with and without power-ups. "Ahead of the
 * other" isn't rank-1 data, so no accent here.
 */

interface Props {
  rows: PowerUpImpactRow[];
}

/**
 * FIGURE_CELL's 80px column is too narrow for the "Power-ups" head: 120px on
 * the grid from sm, 96px on phones (no grid there), never wrapping.
 */
const WIDE_FIGURE_CELL =
  'w-24 whitespace-nowrap text-right font-mono text-sm tabular-nums sm:w-30';

export default function PowerUpImpact({ rows }: Props) {
  return (
    <section id='power-up-effekt' className='flex flex-col gap-6'>
      <SectionLabel as='h2'>Effekt av power-ups</SectionLabel>

      <table className={TABLE}>
        <thead>
          <tr className={HEAD_ROW}>
            <th className={`${PAD} ${HEAD_CELL}`}>Spiller</th>
            <th className={`${FIGURE_CELL} ${PAD} ${HEAD_CELL}`}>Uten</th>
            <th className={`${WIDE_FIGURE_CELL} ${PAD} ${HEAD_CELL}`}>
              Power-ups
            </th>
            <th className={`${FIGURE_CELL} ${PAD} ${HEAD_CELL}`}>Totalt</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.player.seasonPlayerId} className={ROW}>
              <td className={`${NAME_CELL} ${PAD}`}>
                <Link
                  href={`/spillere/${row.player.slug}`}
                  className={NAME_LINK}
                >
                  {row.player.name}
                </Link>
              </td>
              <td className={`${FIGURE_CELL} ${PAD} text-text`}>
                {row.basePoints}
              </td>
              <td className={`${WIDE_FIGURE_CELL} ${PAD} text-text-muted`}>
                {signedDelta(row.powerUpPoints)}
              </td>
              <td className={`${FIGURE_CELL} ${PAD} text-text-muted`}>
                {row.totalPoints}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}
