import type { RoundsStageView } from '@/lib/results/view-models';
import type { RoundScoreKind } from '@/types/game';
import { formatScore } from '@/lib/format';
import { HEAD_ROW, ROW, TABLE } from '@/components/table-classes';

/**
 * A rounds stage: rounds as rows, players as columns, so the table grows tall
 * rather than wide on phones. Each round's best is bold; accent goes only on
 * the game winner's column, and only when this stage settled the game.
 */

interface Props {
  stage: RoundsStageView;
  scoreKind: RoundScoreKind | undefined;
  /** The game winner's season_player.id when this stage decided the game. */
  winnerId?: string;
}

export default function RoundsTable({ stage, scoreKind, winnerId }: Props) {
  const rankThenSum = stage.aggregation === 'rank-then-sum';
  // One round: no total (it would repeat the row), and the round column only
  // when the round has a label to show (what the score is, e.g. "Gold").
  const single = stage.rounds.length === 1;
  const labelColumn = !single || stage.rounds[0].label !== null;
  const tone = (seasonPlayerId: string) =>
    seasonPlayerId === winnerId ? 'text-text-accent' : 'text-text';

  return (
    <div className='w-full overflow-x-auto'>
      <table className={TABLE}>
        <thead>
          <tr className={HEAD_ROW}>
            {labelColumn && (
              <th className='px-1.5 py-2 font-normal sm:px-3'>
                {!single && 'Runde'}
              </th>
            )}
            {stage.players.map((p) => (
              <th
                key={p.seasonPlayerId}
                className={`px-1.5 py-2 text-right font-sans text-sm font-semibold tracking-normal normal-case sm:px-3 ${tone(p.seasonPlayerId)}`}
              >
                {p.name}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {stage.rounds.map((round) => {
            const best = Math.max(
              ...round.cells.map((c) => c.raw ?? -Infinity),
            );
            return (
              <tr key={round.ordinal} className={ROW}>
                {labelColumn && (
                  <td className='text-text px-1.5 text-sm font-semibold sm:px-3 sm:text-base'>
                    {round.label ?? `Runde ${round.ordinal}`}
                  </td>
                )}
                {round.cells.map((cell, i) => {
                  const weight =
                    cell.raw === best ? 'text-text font-medium' : 'text-text';
                  return (
                    <td
                      key={i}
                      className='px-1.5 text-right font-mono text-sm tabular-nums sm:px-3'
                    >
                      {cell.raw === null ? (
                        <span className='text-text-muted'>–</span>
                      ) : rankThenSum ? (
                        <span className='flex flex-col items-end leading-tight sm:flex-row sm:items-baseline sm:justify-end sm:gap-3'>
                          <span className='text-text-muted text-xs'>
                            {formatScore(cell.raw)}
                          </span>
                          <span className={`w-4 ${weight}`}>
                            {cell.rankPoints}
                          </span>
                        </span>
                      ) : (
                        <span className={weight}>{formatScore(cell.raw)}</span>
                      )}
                    </td>
                  );
                })}
              </tr>
            );
          })}
        </tbody>
        {!single && (
          <tfoot>
            <tr className='border-border h-10 border-t-2'>
              <td className='text-text-muted px-1.5 font-mono text-xs tracking-wide uppercase sm:px-3 sm:tracking-widest'>
                {rankThenSum || scoreKind === 'placement' ? 'Poeng' : 'Sum'}
              </td>
              {stage.players.map((p, i) => (
                <td
                  key={p.seasonPlayerId}
                  className={`px-1.5 text-right font-mono text-sm font-medium tabular-nums sm:px-3 ${tone(p.seasonPlayerId)}`}
                >
                  {formatScore(stage.totals[i])}
                </td>
              ))}
            </tr>
          </tfoot>
        )}
      </table>
    </div>
  );
}
