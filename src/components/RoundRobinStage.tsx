import type {
  RoundRobinStageView,
  StageMatch,
} from '@/lib/results/view-models';
import { gameLines, settledByTiebreak, sideFigures } from '@/lib/match-figures';
import Popover from './Popover';
import RecordLines from './RecordLines';
import SectionLabel from './SectionLabel';

/**
 * A round-robin stage: the win–loss table beside every match. Who won is told
 * by weight, never colour: a group leader is not the game's winner.
 */

// TODO(copy): placeholder labels.
const LABELS = {
  placement: 'POS',
  player: 'Spiller',
  record: 'S–T',
  table: 'Tabell',
  matches: 'Kamper',
  tiebreak: 'TB',
  rematch: 'Omkamp',
  game: 'Kamp',
};

interface Props {
  /** Namespaces popover ids. */
  id: string;
  stage: RoundRobinStageView;
}

export default function RoundRobinStage({ id, stage }: Props) {
  return (
    <div className='grid grid-cols-1 items-start gap-10 md:grid-cols-2'>
      <div className='flex min-w-0 flex-col gap-6'>
        <SectionLabel>{LABELS.table}</SectionLabel>
        <table className='border-border bg-bg w-full border-collapse border text-left'>
          <thead>
            <tr className='border-border text-text-muted border-b font-mono text-xs tracking-widest uppercase'>
              <th className='w-12 px-3 py-3 text-center font-normal'>
                {LABELS.placement}
              </th>
              <th className='px-3 py-3 font-normal'>{LABELS.player}</th>
              <th className='w-20 px-3 py-3 text-right font-normal'>
                {LABELS.record}
              </th>
            </tr>
          </thead>
          <tbody>
            {stage.standings.map((row) => (
              <tr
                key={row.player.seasonPlayerId}
                className='border-border h-10 border-b last:border-b-0'
              >
                <td className='text-text-muted px-3 text-center font-mono text-sm tabular-nums'>
                  {row.rank}
                </td>
                <td className='text-text px-3 font-semibold'>
                  {row.player.name}
                </td>
                <td className='text-text px-3 text-right font-mono text-sm tabular-nums'>
                  {row.wins}–{row.losses}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className='flex min-w-0 flex-col gap-6'>
        <SectionLabel>{LABELS.matches}</SectionLabel>
        <ul className='border-border bg-bg border'>
          {stage.matches.map((match, i) => (
            <MatchRow key={i} id={`${id}-m${i}`} match={match} />
          ))}
        </ul>
      </div>
    </div>
  );
}

function MatchRow({ id, match }: { id: string; match: StageMatch }) {
  const figures = sideFigures(match);
  const weight = (side: 'a' | 'b') =>
    match.winner === side ? 'text-text font-semibold' : 'text-text-muted';
  const score = `${figures.a}–${figures.b}`;
  const tags = [
    settledByTiebreak(match) && LABELS.tiebreak,
    match.leg > 1 && LABELS.rematch,
  ].filter(Boolean);

  return (
    <li className='border-border grid h-10 grid-cols-[3.5rem_1fr_auto_1fr_3.5rem] items-center gap-3 border-b px-3 last:border-b-0'>
      {/* Balances the tag column so the score sits in the centre. */}
      <span aria-hidden='true' />
      <span className={`truncate text-right ${weight('a')}`}>
        {match.playerA.name}
      </span>
      <span className='text-text relative text-center font-mono text-sm tabular-nums'>
        {match.games ? (
          <Popover
            id={id}
            label={`${score}, vis hver kamp`}
            panel={<RecordLines lines={gameLines(match, LABELS.game)} />}
          >
            {score}
          </Popover>
        ) : (
          score
        )}
      </span>
      <span className={`truncate ${weight('b')}`}>{match.playerB.name}</span>
      <span className='text-text-muted text-right font-mono text-xs tracking-widest uppercase'>
        {tags.join(' · ')}
      </span>
    </li>
  );
}
