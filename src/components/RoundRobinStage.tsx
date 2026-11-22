import type {
  RoundRobinStageView,
  StageMatch,
} from '@/lib/results/view-models';
import { gameLines, sideFigures } from './match-figures';
import Popover from './Popover';
import RecordLines from './RecordLines';
import SectionLabel from './SectionLabel';
import {
  FIGURE_CELL,
  HEAD_CELL,
  HEAD_ROW,
  NAME_CELL,
  PAD,
  RANK_CELL,
  ROW,
  TABLE,
} from './table-classes';

/**
 * A round-robin stage: the win–loss table beside every match. Who won is told
 * by weight, never colour: a group leader is not the game's winner.
 */

interface Props {
  /** Namespaces popover ids. */
  id: string;
  stage: RoundRobinStageView;
}

export default function RoundRobinStage({ id, stage }: Props) {
  return (
    <div className='grid grid-cols-1 items-start gap-10 md:grid-cols-2'>
      <div className='flex min-w-0 flex-col gap-6'>
        <SectionLabel>Tabell</SectionLabel>
        <table className={TABLE}>
          <thead>
            <tr className={HEAD_ROW}>
              <th className={`${RANK_CELL} ${PAD} ${HEAD_CELL}`}>POS.</th>
              <th className={`${PAD} ${HEAD_CELL}`}>Spiller</th>
              <th className={`${FIGURE_CELL} ${PAD} ${HEAD_CELL}`}>W/L</th>
            </tr>
          </thead>
          <tbody>
            {stage.standings.map((row) => (
              <tr key={row.player.seasonPlayerId} className={ROW}>
                <td className={`${RANK_CELL} ${PAD} text-text-muted`}>
                  {row.rank}
                </td>
                <td className={`${NAME_CELL} ${PAD}`}>{row.player.name}</td>
                <td className={`${FIGURE_CELL} ${PAD} text-text`}>
                  {row.wins}–{row.losses}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className='flex min-w-0 flex-col gap-6'>
        <SectionLabel>Matcher</SectionLabel>
        <ul className='border-border bg-bg border'>
          {stage.matches.map((match, i) => (
            <MatchRow
              key={i}
              id={`${id}-m${i}`}
              match={match}
              tagged={stage.matches.some((m) => m.score?.byTiebreak)}
            />
          ))}
        </ul>
      </div>
    </div>
  );
}

interface MatchRowProps {
  id: string;
  match: StageMatch;
  /**
   * Any match in the stage carries a tag. The tag columns are wide enough for
   * "Tiebreak" only then, so stages without one keep the room for names.
   */
  tagged: boolean;
}

function MatchRow({ id, match, tagged }: MatchRowProps) {
  const figures = sideFigures(match);
  const weight = (side: 'a' | 'b') =>
    match.winner === side ? 'text-text font-semibold' : 'text-text-muted';
  const score = `${figures.a}–${figures.b}`;
  // No tag for a second meeting (`leg` > 1): it is just another match
  // between the two, and "rematch" read as a replay overwriting the first.
  const tags = [match.score?.byTiebreak && 'Tiebreak'].filter(Boolean);

  return (
    <li
      className={`border-border grid h-10 items-center gap-3 border-b px-3 last:border-b-0 ${
        tagged
          ? 'grid-cols-[5rem_1fr_auto_1fr_5rem]'
          : 'grid-cols-[0_1fr_auto_1fr_0]'
      }`}
    >
      {/* Balances the tag column so the score sits in the centre. */}
      <span aria-hidden='true' />
      <span className={`truncate text-right ${weight('a')}`}>
        {match.playerA.name}
      </span>
      <span className='text-text relative text-center font-mono text-sm tabular-nums'>
        {match.games ? (
          <Popover
            id={id}
            label={`${score}, vis hver match`}
            panel={<RecordLines lines={gameLines(match, 'Match')} />}
          >
            {score}
          </Popover>
        ) : (
          score
        )}
      </span>
      <span className={`truncate ${weight('b')}`}>{match.playerB.name}</span>
      <span className='text-text-muted text-right font-mono text-xs tracking-wide uppercase sm:tracking-widest'>
        {tags.join(' · ')}
      </span>
    </li>
  );
}
