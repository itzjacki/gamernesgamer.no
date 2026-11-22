import { Suspense } from 'react';
import Link from 'next/link';
import { seasonData, currentSeason, type Season } from '@/data/sesong';
import { countdownTo, findUpcomingSeason } from '@/lib/upcoming-season';
import SeasonCountdown from '@/components/SeasonCountdown';
import SeasonLineup from '@/components/SeasonLineup';
import RecordOfTheDay from '@/components/RecordOfTheDay';
import ContentOfTheDay from '@/components/ContentOfTheDay';
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
import TrophyHero, { type TrophyHeroAlign } from '@/components/TrophyHero';

// Static, rebuilt in the background at most hourly: the site state, the
// countdown and the record and content of the day all follow the Norwegian
// date. Admin edits revalidate it too (revalidateSite).
export const revalidate = 3600;

// The state switcher and `?tilstand=` are for local development only. In a
// production build this is a constant false, so searchParams is never read
// and the page stays static.
const DEV = process.env.NODE_ENV === 'development';

interface Props {
  searchParams: Promise<{ tilstand?: string }>;
}

const STATE_LABELS: Record<SiteState, string> = {
  upcoming: 'Upcoming',
  live: 'Live',
  justCrowned: 'Just crowned',
  dormant: 'Dormant',
};

// Upcoming centres the trophy so the countdown can take the stage.
const HERO_ALIGN: Record<SiteState, TrophyHeroAlign> = {
  upcoming: 'centre',
  live: 'right',
  justCrowned: 'right',
  dormant: 'right',
};

/*
 * The side block on phones (desktop overrides it). The fold is the cell
 * nearest 74% down the stage, where the trophy's foot stands.
 * - dormant: the title in four cells from one above the fold, over the foot;
 * - live: pulled up to start one cell below the fold, on the floor (off the
 *   trophy, but above the first fold), running on past the stage;
 * - just crowned: after the stage.
 */
const SIDE_PHONE: Record<SiteState, string> = {
  dormant:
    'absolute inset-x-0 top-[calc(round(var(--stage)*0.74,40px)_-_40px)] flex h-40 items-center justify-center text-center min-[701px]:right-auto min-[701px]:block min-[701px]:h-auto min-[701px]:text-left',
  live: 'relative z-10 mt-[calc(round(var(--stage)*0.74,40px)_-_var(--stage)_+_40px)]',
  justCrowned: 'mt-20',
  upcoming: '',
};

export default async function HomePage({ searchParams }: Props) {
  const tilstand = DEV ? (await searchParams).tilstand : undefined;
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

  // With no season registered as upcoming, the dev `?tilstand=upcoming`
  // preview stands in the current season and a fixed 34 days, with games and
  // power-ups sealed so both lineup looks show.
  const registered = findUpcomingSeason(seasonData);
  const upcoming = registered
    ? { slug: registered.slug, data: seasonData[registered.slug] }
    : {
        slug: currentSeason,
        data: {
          ...seasonData[currentSeason],
          meta: {
            ...seasonData[currentSeason].meta,
            revealGames: false,
            revealPowerups: false,
          },
        },
      };
  const countdown = countdownTo(upcoming.data.meta.start, todayInNorway()) ?? {
    kind: 'days' as const,
    days: 34,
  };

  return (
    // The home page keeps its own stack, three grid cells between blocks,
    // so the layout's <main> gap never applies here.
    <div className='flex flex-col gap-20 min-[701px]:gap-30'>
      {state !== 'dormant' && <h1 className='sr-only'>Gamernes Gamer</h1>}

      {/* The stage is a whole number of 40px cells: the viewport less the
          header (168px), the floor's closing row under it (TrophyHero), one
          cell of spacing and one cell of peek, so the next block's top cell
          shows above the fold. So the gap after it is two cells (the
          closing row, then spacing), not three. */}
      <section className='relative [--stage:clamp(520px,round(down,100svh_-_288px,40px),760px)] min-[701px]:-mb-10'>
        <div className='relative h-(--stage)'>
          <div className='absolute inset-y-0 right-[calc((100%-100vw)/2)] left-[calc((100%-100vw)/2)]'>
            <TrophyHero state={state} align={HERO_ALIGN[state]} />
          </div>
          {/* On the hollow between the controller and the pedestal: 38% of
              the trophy's height up from its foot, then 20px higher (the
              foot on the cell nearest 74% down the stage; the trophy 62% of
              the stage tall, on phones min(56%, 63.5vw), as in TrophyHero). */}
          {state === 'upcoming' && (
            <div className='absolute top-[calc(round(var(--stage)*0.74,40px)_-_min(var(--stage)*0.56,63.5vw)*0.38_-_20px)] left-1/2 -translate-x-1/2 -translate-y-1/2 min-[701px]:top-[calc(round(var(--stage)*0.74,40px)_-_var(--stage)*0.62*0.38_-_20px)]'>
              <SeasonCountdown countdown={countdown} season={upcoming.slug} />
            </div>
          )}
        </div>
        {side && (
          // Desktop: a 10-cell column pinned four cells down the stage,
          // narrowed below lg so it stays clear of the trophy (66% across,
          // about 0.27 stage-heights either side of its centre). The
          // champion instead stands on the trophy's foot line, its footer's
          // border overlapping the fold's hairline. Phones: see SIDE_PHONE.
          <div
            className={`${SIDE_PHONE[state]} min-[701px]:absolute min-[701px]:left-0 min-[701px]:mt-0 min-[701px]:w-[min(400px,calc(66vw_-_var(--stage)*0.27_-_40px))] ${
              state === 'justCrowned'
                ? 'min-[701px]:bottom-[calc(var(--stage)_-_round(var(--stage)*0.74,40px)_-_1px)]'
                : 'min-[701px]:top-40'
            }`}
          >
            {side}
          </div>
        )}
      </section>

      {state === 'justCrowned' && (
        <Suspense>
          <SeasonChanges />
        </Suspense>
      )}
      {state === 'upcoming' && (
        <SeasonLineup season={upcoming.slug} data={upcoming.data} />
      )}

      {/* A two-row grid (labels, then frames) that both blocks subgrid
          into, so the frames line up and share one hairline. */}
      <div className='grid gap-y-20 sm:grid-cols-2 sm:grid-rows-[auto_1fr] sm:gap-y-6 sm:*:not-first:-ml-px'>
        <Suspense>
          <RecordOfTheDay />
        </Suspense>
        <Suspense>
          <ContentOfTheDay />
        </Suspense>
      </div>

      <Suspense>
        <ArchiveTotals />
      </Suspense>

      {DEV && (
        <nav className='border-border bg-bg fixed right-3 bottom-3 z-50 grid gap-1.5 border p-2.5 font-mono text-[10px]'>
          <b className='text-text-muted font-normal uppercase'>
            Dev · state (derived: {STATE_LABELS[derived]})
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
      )}
    </div>
  );
}
