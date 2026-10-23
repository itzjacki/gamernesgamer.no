import Link from 'next/link';

import { seasonData, type Season } from '@/data/sesong';
import { formatSeasonDates } from '@/lib/season-dates';
import Heading from './Heading';

import styles from './LiveSideBlock.module.css';

/**
 * Beside the trophy in the live state (under it on phones): the door to the
 * running season's page. Phase 5 adds a live table here; for now the whole
 * block is ONE link. A normal bordered block on the scene (design.md, "On
 * the hero"): solid `bg-bg` with `border`, a mono eyebrow with a blinking
 * status LED (the header's live grammar; steady under reduced motion), a
 * rule, the season as a `Heading` with its dates, a rule and the link cue.
 * From 701px it is five grid cells tall — eyebrow, body and cue at 1, 3
 * and 1.
 *
 * Accent at rest is the LED only; the borders and the cue take it on hover.
 */

interface Props {
  /** The live season's zero-padded slug. The page may pass a stand-in to preview. */
  season: Season;
}

const MONO = 'font-mono text-[10px] tracking-[0.2em] uppercase sm:text-xs';
const RULE =
  'border-border group-hover:border-accent px-4 transition-colors duration-150 sm:px-6';

export default function LiveSideBlock({ season }: Props) {
  const { meta } = seasonData[season];

  return (
    <Link
      href={`/sesong/${season}`}
      className='group text-text border-border bg-bg hover:border-accent focus-visible:outline-accent flex w-full flex-col border transition-colors duration-150 focus-visible:outline-2 focus-visible:outline-offset-2 min-[701px]:h-50'
    >
      <span
        className={`${MONO} ${RULE} text-text-muted flex h-10 shrink-0 items-center gap-2 border-b`}
      >
        <span aria-hidden className={`bg-accent size-1.5 ${styles.blink}`} />
        Live
      </span>

      {/* A div: Heading wraps its text in one, which a span can't hold. */}
      <div className='flex flex-1 flex-col justify-center gap-2 px-4 py-6 min-[701px]:py-0 sm:px-6'>
        <Heading as='span' styleAs='h2' className='whitespace-nowrap'>
          Sesong <span className='tabular-nums'>{season}</span>
        </Heading>
        <span className={`${MONO} text-text-muted tabular-nums`}>
          {formatSeasonDates(meta)}
        </span>
      </div>

      <span
        className={`${MONO} ${RULE} group-hover:text-accent flex min-h-12 shrink-0 items-center border-t lg:min-h-10`}
      >
        Gå til sesong
      </span>
    </Link>
  );
}
