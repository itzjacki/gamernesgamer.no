import type { RoundsStageView } from '@/lib/results/view-models';
import type { RoundScoreKind } from '@/types/game';
import { formatScore } from '@/lib/format';

/**
 * A rounds stage: rounds as rows, players as columns, so the table grows tall
 * rather than wide on phones. Each round's best is bold; accent goes only on
 * the game winner's column, and only when this stage settled the game.
 */

// TODO(copy): placeholder labels.
const LABELS = {
  round: 'Runde',
  total: 'Sum',
  rankTotal: 'Poeng',
};

interface Props {
  stage: RoundsStageView;
  scoreKind: RoundScoreKind | undefined;
  /** The game winner's season_player.id when this stage decided the game. */
  winnerId?: string;
}

export default function RoundsTable({ stage, scoreKind, winnerId }: Props) {
  const rankThenSum = stage.aggregation === 'rank-then-sum';
  // One round: the page names it in the heading, and a total would repeat it.
  const single = stage.rounds.length === 1;

  return (
    <div className='w-full overflow-x-auto'>
      <table className='border-border bg-bg w-full border-collapse border text-left'>
        <thead>
          <tr className='border-border text-text-muted border-b font-mono text-xs tracking-widest uppercase'>
            {!single && (
              <th className='px-1.5 py-3 font-normal sm:px-3'>
                {LABELS.round}
              </th>
            )}
            {stage.players.map((p) => (
              <th
                key={p.seasonPlayerId}
                className={`px-1.5 py-3 text-right font-sans text-sm font-semibold tracking-normal normal-case sm:px-3 ${
                  p.seasonPlayerId === winnerId
                    ? 'text-text-accent'
                    : 'text-text'
                }`}
              >
                {p.name}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {stage.rounds.map((round) => {
            const raws = round.cells.flatMap((c) =>
              c.raw === null ? [] : [c.raw],
            );
            const best = Math.max(...raws);
            return (
              <tr
                key={round.ordinal}
                className='border-border h-10 border-b last:border-b-0'
              >
                {!single && (
                  <td className='text-text px-1.5 text-sm font-semibold sm:px-3 sm:text-base'>
                    {round.label ?? `${LABELS.round} ${round.ordinal}`}
                  </td>
                )}
                {round.cells.map((cell, i) => {
                  const weight =
                    cell.raw === best ? 'text-text font-semibold' : 'text-text';
                  if (cell.raw === null) {
                    return (
                      <td
                        key={i}
                        className='text-text-muted px-1.5 text-right font-mono text-sm sm:px-3'
                      >
                        –
                      </td>
                    );
                  }
                  return (
                    <td
                      key={i}
                      className='px-1.5 text-right font-mono text-sm tabular-nums sm:px-3'
                    >
                      {rankThenSum ? (
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
              <td className='text-text-muted px-1.5 font-mono text-xs tracking-widest uppercase sm:px-3'>
                {rankThenSum || scoreKind === 'placement'
                  ? LABELS.rankTotal
                  : LABELS.total}
              </td>
              {stage.players.map((p, i) => (
                <td
                  key={p.seasonPlayerId}
                  className={`px-1.5 text-right font-mono text-sm font-bold tabular-nums sm:px-3 ${
                    p.seasonPlayerId === winnerId
                      ? 'text-text-accent'
                      : 'text-text'
                  }`}
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
