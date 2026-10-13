import Link from 'next/link';
import type { PairSummary } from '@/lib/results/view-models';
import { PairGauge } from './PairRow';

/**
 * The career page's head-to-head list: one row per opponent, the whole row a
 * link to that pair's /vs page with this player on the left. Each row is the
 * /vs headline in miniature — games this player finished ahead in, the gauge,
 * games the opponent did — plus their match record as a mono aside.
 *
 * Same neutral grammar as /vs: both figures share a colour, nothing marks a
 * leader, and a row earns the accent only on hover/focus.
 */

interface Props {
  /** The player whose page this is — the left-hand side of every link. */
  player: { slug: string; name: string };
  summaries: PairSummary[];
  /** Column heads for the strip: opponent, the games tally, the match record. */
  labels: { opponent: string; games: string; matches: string };
}

const eyebrow =
  'text-text-muted font-mono text-xs tracking-wide uppercase sm:tracking-widest';
const columns =
  'grid grid-cols-[minmax(0,6rem)_1.5rem_1fr_1.5rem] items-center gap-3 px-4 sm:grid-cols-[minmax(0,10rem)_2rem_1fr_2rem_6rem] sm:gap-4 sm:px-8';
const figure = 'text-text font-mono text-sm tabular-nums';

export default function PairSummaryList({ player, summaries, labels }: Props) {
  if (summaries.length === 0) return null;

  return (
    <div className='border-border bg-bg border'>
      <div className={`border-border h-10 border-b ${columns} ${eyebrow}`}>
        <span>{labels.opponent}</span>
        <span className='col-span-3 text-center'>{labels.games}</span>
        <span className='hidden text-right sm:block'>{labels.matches}</span>
      </div>

      <ul>
        {summaries.map((summary) => (
          <li
            key={summary.opponent.slug}
            className='border-border border-b last:border-b-0'
          >
            <Link
              href={`/vs/${player.slug}/${summary.opponent.slug}`}
              className={`group focus-visible:outline-accent min-h-14 focus-visible:outline-2 focus-visible:-outline-offset-2 ${columns}`}
            >
              <span className='group-hover:text-accent group-focus-visible:text-accent truncate font-extrabold tracking-tight uppercase transition-colors'>
                {summary.opponent.name}
              </span>
              <span className={`text-right ${figure}`}>
                <span className='sr-only'>
                  : {labels.games}, {player.name}{' '}
                </span>
                {summary.ahead}
              </span>
              <PairGauge a={summary.ahead} b={summary.behind} />
              <span className={figure}>
                <span className='sr-only'>, {summary.opponent.name} </span>
                {summary.behind}
              </span>
              <span className='text-text-muted hidden text-right font-mono text-sm tabular-nums sm:block'>
                {summary.matchWins + summary.matchLosses > 0 ? (
                  <>
                    <span className='sr-only'>. {labels.matches}: </span>
                    {summary.matchWins}–{summary.matchLosses}
                  </>
                ) : (
                  '–'
                )}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
