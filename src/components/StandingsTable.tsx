import Link from 'next/link';
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
    <table className={TABLE}>
      <thead>
        <tr className={HEAD_ROW}>
          <th className={`${RANK_CELL} ${PAD} ${HEAD_CELL}`}>POS.</th>
          <th className={`${PAD} ${HEAD_CELL}`}>Spiller</th>
          <th className={`${FIGURE_CELL} ${PAD} ${HEAD_CELL}`}>
            {pointsLabel}
          </th>
        </tr>
      </thead>
      <tbody>
        {rows.map((row) => (
          <tr key={`${row.placement}-${row.name}`} className={ROW}>
            <td
              className={`${RANK_CELL} ${PAD} ${
                row.isChampion
                  ? 'text-text-accent font-medium'
                  : 'text-text-muted'
              }`}
            >
              {row.placement}
            </td>
            <td className={`${NAME_CELL} ${PAD}`}>
              {row.slug ? (
                <Link href={`/spillere/${row.slug}`} className={NAME_LINK}>
                  {row.name}
                </Link>
              ) : (
                row.name
              )}
            </td>
            <td className={`${FIGURE_CELL} ${PAD} text-text`}>
              {row.totalPoints}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
