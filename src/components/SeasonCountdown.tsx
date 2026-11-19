import type { Countdown } from '@/lib/upcoming-season';

/** Days only: seasons store no time of day. */

interface Props {
  countdown: Countdown;
  /** Zero-padded slug, e.g. "05". */
  season: string;
}

// The hero draws these glyphs into its scene (TrophyHero, `drawNumerals`);
// once it does, the HTML ones turn transparent but stay for screen readers.
const NUMERALS =
  'text-text font-sans leading-none font-extrabold [section:has(canvas[data-numerals])_&]:text-transparent';

const LABEL =
  'text-text font-mono text-[10px] tracking-wide sm:tracking-widest whitespace-nowrap uppercase min-[701px]:tracking-[0.2em]';

export default function SeasonCountdown({ countdown, season }: Props) {
  const isToday = countdown.kind === 'today';
  const unit = !isToday && countdown.days === 1 ? 'dag' : 'dager';

  // One <p> so it is read as a single sentence. Static: a day count needs
  // no live updates.
  return (
    <p className='flex flex-col items-center justify-center gap-3'>
      <span className={`${LABEL} flex items-center gap-2`}>
        Sesong {Number(season)} starter om
      </span>
      <span className='sr-only'> </span>
      {isToday ? (
        <span
          data-hero-numerals
          className={`${NUMERALS} text-6xl min-[701px]:text-7xl`}
        >
          I dag
        </span>
      ) : (
        <>
          <span
            data-hero-numerals
            className={`${NUMERALS} text-8xl tabular-nums min-[701px]:text-9xl`}
          >
            {countdown.days}
          </span>
          <span className='sr-only'> </span>
          <span className={LABEL}>{unit}</span>
        </>
      )}
    </p>
  );
}
