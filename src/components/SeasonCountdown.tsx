import type { Countdown } from '@/lib/upcoming-season';

/**
 * The upcoming state's countdown, centred over the trophy's plinth (the page
 * positions it; this renders the content only) until the in-scene version
 * exists. Days only: seasons store no time of day. The page's only
 * display-size numerals.
 *
 * Straight on the scene (design.md, "On the hero"): no box, no rules, just a
 * mono label over big bold white numerals and the unit. The labels are
 * `text-text`, not muted: muted fails AA against the lit fog. Four grid
 * cells tall, so the page can sit it on the grid.
 */

interface Props {
  countdown: Countdown;
  /** The season's zero-padded slug, e.g. "05". */
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
