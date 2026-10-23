import type { Countdown } from '@/lib/upcoming-season';

/** Days only: seasons store no time of day. */

interface Props {
  countdown: Countdown;
  /** Zero-padded slug, e.g. "05". */
  season: string;
}

const LABEL =
  'text-text font-mono text-[10px] tracking-widest whitespace-nowrap uppercase min-[701px]:tracking-[0.2em]';

export default function SeasonCountdown({ countdown, season }: Props) {
  const isToday = countdown.kind === 'today';
  const unit = !isToday && countdown.days === 1 ? 'dag' : 'dager';

  // One <p> so it is read as a single sentence. Static: a day count needs
  // no live updates.
  return (
    <p className='flex h-40 flex-col items-center justify-center gap-2'>
      <span className={`${LABEL} flex items-center gap-2`}>
        Sesong {season} starter om
      </span>
      <span className='sr-only'> </span>
      {isToday ? (
        <span className='text-text font-sans text-5xl leading-none font-extrabold'>
          I dag
        </span>
      ) : (
        <>
          <span className='text-text font-sans text-7xl leading-none font-extrabold tabular-nums'>
            {countdown.days}
          </span>
          <span className='sr-only'> </span>
          <span className={LABEL}>{unit}</span>
        </>
      )}
    </p>
  );
}
