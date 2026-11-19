import Popover from './Popover';
import RecordLines, { pointsBreakdownLines } from './RecordLines';
import { HEAD_ROW, ROW, TABLE } from '@/components/table-classes';

/**
 * Games are rows and players columns on purpose: a season has more games than
 * players, so the table stays narrow enough to avoid horizontal scroll on
 * mobile. A cell with a power-up or curse (even zero-net) opens a breakdown;
 * the sign carries direction, never colour — accent is for the rank-1 player.
 */

export interface MatrixPowerUpUse {
  name: string;
  isCurse: boolean;
  pointsDelta: number;
}

export interface MatrixCell {
  seasonPlayerId: string;
  /** Base points from placement, before power-ups. */
  ladderPoints: number;
  /** ladderPoints + Σ power-up deltas. */
  points: number;
  /** Includes zero-delta uses. Empty = plain cell. */
  powerUpUses: MatrixPowerUpUse[];
}

export interface MatrixGameRow {
  /** Play order; also part of popover ids. */
  ordinal: number;
  label: string;
  /** Same order as `players`. */
  cells: MatrixCell[];
}

export interface MatrixPlayer {
  seasonPlayerId: string;
  name: string;
  totalPoints: number;
  isChampion: boolean;
}

interface Props {
  /** Namespaces popover ids across the page. */
  seasonNumber: number;
  players: MatrixPlayer[];
  games: MatrixGameRow[];
}

function PlainCell({ points }: { points: number }) {
  return (
    <td className='text-text px-3 py-2 text-center font-mono text-sm tabular-nums'>
      {points}
    </td>
  );
}

function PopoverCell({
  cell,
  popoverId,
}: {
  cell: MatrixCell;
  popoverId: string;
}) {
  return (
    <td className='relative px-3 py-2 text-center font-mono text-sm tabular-nums'>
      <Popover
        id={popoverId}
        label={`${cell.points} poeng, vis poengfordeling`}
        className='text-text'
        panel={
          <RecordLines
            lines={pointsBreakdownLines(cell.ladderPoints, cell.powerUpUses)}
          />
        }
      >
        {cell.points}
      </Popover>
    </td>
  );
}

export default function GamePointsMatrix({
  seasonNumber,
  players,
  games,
}: Props) {
  if (players.length === 0 || games.length === 0) return null;

  return (
    <div>
      <div className='w-full overflow-x-auto'>
        <table className={TABLE}>
          <thead>
            <tr className={HEAD_ROW}>
              <th className='px-3 py-2 font-normal'>SPILL</th>
              {players.map((p) => (
                <th
                  key={p.seasonPlayerId}
                  className={`px-3 py-2 text-center font-normal ${
                    p.isChampion ? 'text-text-accent' : ''
                  }`}
                >
                  {p.name}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {games.map((game) => (
              <tr key={game.ordinal} className={ROW}>
                <td className='text-text px-3 py-2 font-semibold'>
                  {game.label}
                </td>
                {game.cells.map((cell) =>
                  cell.powerUpUses.length > 0 ? (
                    <PopoverCell
                      key={cell.seasonPlayerId}
                      cell={cell}
                      popoverId={`pu-s${seasonNumber}-g${game.ordinal}-p${cell.seasonPlayerId}`}
                    />
                  ) : (
                    <PlainCell key={cell.seasonPlayerId} points={cell.points} />
                  ),
                )}
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className='border-border border-t-2'>
              <td className='text-text-muted px-3 py-2 font-mono text-xs tracking-wide uppercase sm:tracking-widest'>
                Sum
              </td>
              {players.map((p) => (
                <td
                  key={p.seasonPlayerId}
                  className={`px-3 py-2 text-center font-mono text-sm font-medium tabular-nums ${
                    p.isChampion ? 'text-text-accent' : 'text-text'
                  }`}
                >
                  {p.totalPoints}
                </td>
              ))}
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}
