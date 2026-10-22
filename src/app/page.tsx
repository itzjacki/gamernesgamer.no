import { Suspense } from 'react';
import Link from 'next/link';
import { seasonData, currentSeason, type Season } from '@/data/sesong';
import { countdownTo, findUpcomingSeason } from '@/lib/upcoming-season';
import SeasonCountdown from '@/components/SeasonCountdown';
import SeasonReveals from '@/components/SeasonReveals';
import RecordOfTheDay from '@/components/RecordOfTheDay';
import ContentOfTheDay from '@/components/ContentOfTheDay';
import PlayerList from '@/components/PlayerList';
import SeasonList from '@/components/SeasonList';
import ArchiveTotals from '@/components/ArchiveTotals';
import SeasonChanges from '@/components/SeasonChanges';
import LiveSideBlock from '@/components/LiveSideBlock';
import ChampionSideBlock from '@/components/ChampionSideBlock';
import GgIntro from '@/components/GgIntro';
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

/** The state slot, the first block under the fold (just crowned's is built: `SeasonChanges`). */
const SLOT: Record<SiteState, Block | null> = {
  upcoming: {
    name: 'What is on the line',
    notes: [
      'Active streaks held by players on the coming roster.',
      'Records within reach; title counts that could tie.',
      'One-row minimum when little is at stake.',
    ],
  },
  justCrowned: null,
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
  // The live season, or the current one standing in for the preview.
  const liveSeason =
    (Object.keys(seasonData) as Season[]).find(
      (slug) => seasonData[slug].meta.status === 'live',
    ) ?? currentSeason;

  // Beside the trophy (desktop) or under it (phone). Upcoming has none.
  const side = {
    dormant: <GgIntro />,
    live: <LiveSideBlock season={liveSeason} />,
    justCrowned: (
      <Suspense>
        <ChampionSideBlock />
      </Suspense>
    ),
    upcoming: null,
  }[state];

  // With no season registered as upcoming, the `?tilstand=upcoming` preview
  // stands in the current season and a fixed 34 days.
  const upcoming = findUpcomingSeason(seasonData) ?? {
    slug: currentSeason,
    meta: seasonData[currentSeason].meta,
  };
  const countdown = countdownTo(upcoming.meta.start, todayInNorway()) ?? {
    kind: 'days' as const,
    days: 34,
  };
  const slot = SLOT[state];

  return (
    // The home page keeps its own stack, three grid cells between blocks,
    // so the layout's <main> gap never applies here.
    <div className='flex flex-col gap-20 min-[701px]:gap-30'>
      {/* TODO(copy): the page heading — placeholder. Dormant's GgIntro is
          the visible h1 instead. */}
      {state !== 'dormant' && <h1 className='sr-only'>[Gamernes Gamer]</h1>}

      {/* The hero's breakpoint is 700px: above it the trophy stands right
          (or centred in upcoming) and the side block sits to its left;
          below it the trophy is centred and the side block follows it.

          The stage is a whole number of 40px cells: the viewport less the
          header (168px), one cell of gap and one cell of peek, rounded down,
          so the first block under it shows its top cell above the fold. The
          stage's own floor is breathing room, so on desktop the gap after it
          is one cell, not the stack's three. */}
      <section className='relative [--stage:clamp(520px,round(down,100svh_-_248px,40px),760px)] min-[701px]:-mb-20'>
        <div className='relative h-(--stage)'>
          <div className='absolute inset-y-0 right-[calc((100%-100vw)/2)] left-[calc((100%-100vw)/2)]'>
            <TrophyHero mode={HERO_MODE[state]} align={HERO_ALIGN[state]} />
          </div>
          {state === 'upcoming' && (
            <>
              {/* Over the plinth: its bottom on the cell nearest the
                  trophy's foot (74% down the stage), four cells tall. */}
              <div className='absolute top-[calc(round(var(--stage)*0.74,40px)_-_160px)] left-1/2 -translate-x-1/2'>
                <SeasonCountdown countdown={countdown} season={upcoming.slug} />
              </div>
              <div className='absolute bottom-10 left-1/2 w-[calc(100%-32px)] -translate-x-1/2 min-[701px]:w-max'>
                <SeasonReveals
                  season={upcoming.slug}
                  data={seasonData[upcoming.slug]}
                />
              </div>
            </>
          )}
        </div>
        {side && (
          // Desktop: a 10-cell column pinned four cells down the stage,
          // narrowed below lg so it stays clear of the trophy (66% across,
          // about 0.27 stage-heights either side of its centre).
          <div className='mt-10 min-[701px]:absolute min-[701px]:top-40 min-[701px]:left-0 min-[701px]:mt-0 min-[701px]:w-[min(400px,calc(66vw_-_var(--stage)*0.27_-_40px))]'>
            {side}
          </div>
        )}
      </section>

      {state === 'justCrowned' && (
        <Suspense>
          <SeasonChanges />
        </Suspense>
      )}
      {slot && <Wire zone='Slot' {...slot} cells={6} />}

      {/* The archive, the same in every state: three rows, three cells
          apart like the rest of the stack. The first two are pairs of
          blocks, one row from `sm` up, 10 cells each: each block's label on
          the first row, the frames on the second (each block is a subgrid),
          so the frames line up top and bottom and meet on one shared
          hairline. Stacked on phones, in reading order. */}
      <div className='grid gap-y-20 sm:grid-cols-2 sm:grid-rows-[auto_1fr] sm:gap-y-6 sm:*:not-first:-ml-px'>
        <Suspense>
          <RecordOfTheDay />
        </Suspense>
        <ContentOfTheDay />
      </div>

      <div className='grid gap-y-20 sm:grid-cols-2 sm:grid-rows-[auto_1fr] sm:gap-y-6 sm:*:not-first:-ml-px'>
        <PlayerList />
        <Suspense>
          <SeasonList />
        </Suspense>
      </div>

      <Suspense>
        <ArchiveTotals />
      </Suspense>

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
    </div>
  );
}
