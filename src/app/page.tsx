import Link from 'next/link';
import { seasonData } from '@/data/sesong';
import {
  deriveSiteState,
  isSiteState,
  SITE_STATES,
  todayInNorway,
  type SiteState,
} from '@/lib/site-state';
import TrophyHero, {
  type TrophyHeroAlign,
  type TrophyHeroMode,
} from '@/app/proto/_components/TrophyHero';

/*
 * WIREFRAME — the front page's decided structure as labelled placeholders
 * (working-docs/front-page-and-nav.md). Every block is a stand-in; none of
 * the text is copy. `?tilstand=` previews a state; the switcher and the
 * override go when the real blocks are built.
 */

interface Props {
  // Next 16: searchParams is a Promise and must be awaited.
  searchParams: Promise<{ tilstand?: string }>;
}

interface Block {
  name: string;
  notes: string[];
}

const STATE_LABELS: Record<SiteState, string> = {
  upcoming: 'Upcoming',
  live: 'Live',
  justCrowned: 'Just crowned',
  dormant: 'Dormant',
};

// The prototype hero only knows three modes; the states' real look is open.
const HERO_MODE: Record<SiteState, TrophyHeroMode> = {
  upcoming: 'countdown',
  live: 'idle',
  justCrowned: 'crowned',
  dormant: 'idle',
};

// Upcoming centres the trophy so the countdown can take the stage.
const HERO_ALIGN: Record<SiteState, TrophyHeroAlign> = {
  upcoming: 'centre',
  live: 'right',
  justCrowned: 'right',
  dormant: 'right',
};

/** Beside the trophy (desktop) or under it (phone). Upcoming has none. */
const SIDE: Record<SiteState, Block | null> = {
  dormant: {
    name: 'What GG is',
    notes: [
      'Standing content about the tournament, written once (Jakob).',
      'Not the record of the day: that stays below the fold.',
    ],
  },
  live: {
    name: 'Live',
    notes: [
      'A link to the live season page for now.',
      'Later (Phase 5): a live table.',
    ],
  },
  justCrowned: {
    name: 'The champion',
    notes: [
      'An image of the new champion (their season card art) and content about the win.',
      'Unless the engraving scene takes the whole width; then this goes.',
    ],
  },
  upcoming: null,
};

/** The state slot, the first block under the fold. */
const SLOT: Record<SiteState, Block | null> = {
  upcoming: {
    name: 'What is on the line',
    notes: [
      'Active streaks held by players on the coming roster.',
      'Records within reach; title counts that could tie.',
      'One-row minimum when little is at stake.',
    ],
  },
  justCrowned: {
    name: 'What last season changed',
    notes: [
      'Records broken or newly tied by the season just played.',
      'Movement on the all-time board; new category crowns.',
      'One-row minimum after a quiet season.',
    ],
  },
  live: null,
  dormant: null,
};

/** A labelled stand-in for one block, `cells` grid cells tall. */
function Wire({
  zone,
  name,
  notes,
  cells,
  className = '',
}: Block & { zone: string; cells: number; className?: string }) {
  return (
    <div
      className={`border-border-accent bg-bg grid content-start gap-2 border border-dashed p-4 font-mono text-[11px] ${className}`}
      style={{ minHeight: cells * 40 }}
    >
      <p className='text-text uppercase'>
        <span className='text-accent'>{zone}</span> {name}
      </p>
      <ul className='text-text-muted grid gap-1'>
        {notes.map((note) => (
          <li key={note}>{note}</li>
        ))}
      </ul>
    </div>
  );
}

export default async function HomePage({ searchParams }: Props) {
  const { tilstand } = await searchParams;
  const derived = deriveSiteState(
    Object.values(seasonData).map((season) => season.meta),
    todayInNorway(),
  );
  const state = isSiteState(tilstand) ? tilstand : derived;
  const side = SIDE[state];
  const slot = SLOT[state];

  return (
    <>
      {/* The hero's breakpoint is 700px: above it the trophy stands right
          (or centred in upcoming) and the side block sits to its left;
          below it the trophy is centred and the side block follows it. */}
      <section className='relative min-[701px]:-mb-28'>
        <div className='relative h-[min(calc(100svh-180px),760px)] min-h-[520px]'>
          <div className='absolute inset-y-0 right-[calc((100%-100vw)/2)] left-[calc((100%-100vw)/2)]'>
            <TrophyHero mode={HERO_MODE[state]} align={HERO_ALIGN[state]} />
          </div>
          {state === 'upcoming' && (
            <>
              <Wire
                zone='Fold'
                name='Countdown'
                notes={[
                  'Across the trophy: ideally in the scene itself, at least in front of it.',
                  'Display-size numerals; the only big numbers on the page.',
                ]}
                cells={3}
                className='absolute top-[38%] left-1/2 w-[min(400px,calc(100%-32px))] -translate-x-1/2 -translate-y-1/2'
              />
              <Wire
                zone='Fold'
                name='Reveals'
                notes={[
                  'Reveal counts (games, power-ups) in one mono row.',
                  'Links to the upcoming season page.',
                ]}
                cells={2}
                className='absolute bottom-6 left-1/2 w-[min(400px,calc(100%-32px))] -translate-x-1/2'
              />
            </>
          )}
        </div>
        {side && (
          <div className='mt-4 min-[701px]:absolute min-[701px]:inset-y-0 min-[701px]:left-0 min-[701px]:mt-0 min-[701px]:flex min-[701px]:w-[45%] min-[701px]:items-center'>
            <Wire zone='Fold' {...side} cells={6} className='w-full' />
          </div>
        )}
      </section>

      {slot && <Wire zone='Slot' {...slot} cells={6} />}

      <div className='grid gap-4 sm:grid-cols-20 sm:gap-0'>
        <Wire
          zone='Page'
          name='Record of the day'
          notes={[
            'One record plate, the same for everyone that day, in its own frame.',
            'The only block that rotates.',
          ]}
          cells={5}
          className='sm:col-span-12'
        />
        <Wire
          zone='Page'
          name='Stamp'
          notes={["Today's date, mono.", 'The door to /records#<id>.']}
          cells={1}
          className='sm:col-span-8 sm:border-l-0'
        />
      </div>

      <div className='mx-auto grid w-full max-w-120'>
        <Wire
          zone='Page'
          name='Roll of honour'
          notes={[
            'Season number + champion, newest first, set like an engraving.',
            'Not navigation: no thumbnails, dates, LEDs or key styling.',
            'Champions are plain links; no row for an upcoming season.',
          ]}
          cells={8}
        />
        <Wire
          zone='Page'
          name='Totals'
          notes={[
            'One small mono row: seasons, games, matches, power-ups fired.',
          ]}
          cells={1}
          className='border-t-0'
        />
      </div>

      <nav className='border-border bg-bg fixed right-3 bottom-3 z-50 grid gap-1.5 border p-2.5 font-mono text-[10px]'>
        <b className='text-text-muted font-normal uppercase'>
          Wireframe · state (derived: {STATE_LABELS[derived]})
        </b>
        <div className='flex flex-wrap gap-1'>
          {SITE_STATES.map((s) => (
            <Link
              key={s}
              href={`/?tilstand=${s}`}
              aria-current={s === state ? 'true' : undefined}
              className='border-border-accent text-text-muted aria-current:border-accent aria-current:text-text border px-1.5 py-1'
            >
              {STATE_LABELS[s]}
            </Link>
          ))}
        </div>
      </nav>
    </>
  );
}
