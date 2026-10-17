import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { getAllPairSlugs, getPairView } from '@/lib/results/queries';
import type {
  PairGame,
  PairMatch,
  PairSeason,
  PairSide,
} from '@/lib/results/view-models';
import { tagLabels } from '@/data/tag-labels';
import { MIN_RANKED_GAMES } from '@/lib/tag-ranking';
import SectionLabel from '@/components/SectionLabel';
import PairHero from '@/components/PairHero';
import PairTrace from '@/components/PairTrace';
import PairMoment from '@/components/PairMoment';
import { PairLine, PairMini, PairMinis, PairRow } from '@/components/PairRow';
import RecordLines from '@/components/RecordLines';
import GameListPopover from '@/components/GameListPopover';
import UnrankedRows, { unrankedCaption } from '@/components/UnrankedRows';

interface Props {
  params: Promise<{ a: string; b: string }>;
}

/** Matches (or games) against each other before a "longest run" says anything. */
const MIN_RUN_SAMPLE = 3;

export function generateStaticParams() {
  return getAllPairSlugs();
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { a, b } = await params;
  const pair = await getPairView(a, b);
  return pair ? { title: `${pair.a.name} mot ${pair.b.name}` } : {};
}

/** "S1–S4" for a run of seasons, or just "S3" when it is one. */
function seasonSpan(numbers: number[]) {
  const first = Math.min(...numbers);
  const last = Math.max(...numbers);
  return first === last ? `S${first}` : `S${first}–S${last}`;
}

const wall = 'border-border bg-border grid grid-cols-1 gap-px border';
const eyebrow =
  'text-text-muted font-mono text-xs tracking-wide uppercase sm:tracking-widest';

export default async function PairPage({ params }: Props) {
  const { a: slugA, b: slugB } = await params;

  const pair = await getPairView(slugA, slugB);
  if (!pair) {
    notFound();
  }

  const { a, b, finishedAhead, matches, matchRuns, gameRuns, moments } = pair;
  const names = { a: a.name, b: b.name };
  const player = (side: PairSide) => (side === 'a' ? a : b);
  const other = (side: PairSide) => (side === 'a' ? b : a);
  const sides: PairSide[] = ['a', 'b'];

  /** A list of shared games: title, season, and both placements (a–b). */
  const gameLines = (games: PairGame[]) => (
    <RecordLines
      lines={games.map((game) => ({
        key: `${game.seasonSlug}-${game.gameSlug}`,
        game,
        seasonNumber: game.seasonNumber,
        value: (
          <>
            <span className='sr-only'>{a.name} plass </span>
            {game.a}–<span className='sr-only'>{b.name} plass </span>
            {game.b}
          </>
        ),
      }))}
    />
  );

  /** A list of their matches: game, season, and the series score (a–b). */
  const matchLines = (list: PairMatch[]) => (
    <RecordLines
      lines={list.map((match, index) => ({
        key: `${match.seasonSlug}-${match.gameSlug}-${index}`,
        game: match,
        seasonNumber: match.seasonNumber,
        value: (
          <>
            <span className='sr-only'>{a.name} </span>
            {match.a}–<span className='sr-only'>{b.name} </span>
            {match.b}
          </>
        ),
      }))}
    />
  );

  const games = finishedAhead.games;
  const span = seasonSpan(games.map((g) => g.seasonNumber));
  const gameCount = (n: number) => `${n} spill`;

  const ranked = pair.categories.filter(
    (c) => c.tally.games.length >= MIN_RANKED_GAMES,
  );
  const unranked = pair.categories.filter(
    (c) => c.tally.games.length < MIN_RANKED_GAMES,
  );
  /**
   * Shared games as GameListPopover rows — the same panel the career page's
   * category table opens — with both placements ("2–4").
   */
  const versusResults = (list: PairGame[]) =>
    list.map((game) => ({
      seasonNumber: game.seasonNumber,
      seasonSlug: game.seasonSlug,
      gameSlug: game.gameSlug,
      gameTitle: game.gameTitle,
      placement: game.a,
      opponentPlacement: game.b,
      ownPick: game.pickedBy === 'a',
    }));

  /**
   * Their matches as rows of the same panel: the two figures are the series
   * score (games won by each), carried in the row's two placement slots.
   */
  const matchResults = (list: PairMatch[]) =>
    list.map((match) => ({
      seasonNumber: match.seasonNumber,
      seasonSlug: match.seasonSlug,
      gameSlug: match.gameSlug,
      gameTitle: match.gameTitle,
      placement: match.a,
      opponentPlacement: match.b,
      ownPick: false,
    }));

  /** One category: its name opens the games behind it. */
  const categoryLine = (
    category: (typeof pair.categories)[number],
    isRanked: boolean,
  ) => (
    <PairLine
      key={category.tag}
      muted={!isRanked}
      label={
        <GameListPopover
          id={`category-${category.tag}`}
          label={tagLabels[category.tag]}
          heading={`${tagLabels[category.tag]} · ${a.name}–${b.name}`}
          groups={[{ results: versusResults(category.tally.games) }]}
          sides={names}
        />
      }
      a={category.tally.a}
      b={category.tally.b}
      names={names}
    />
  );

  const pickSplits = [
    { key: 'a', label: `Valgt av ${a.name}`, tally: pair.picks.a },
    { key: 'b', label: `Valgt av ${b.name}`, tally: pair.picks.b },
    { key: 'others', label: 'Valgt av andre', tally: pair.picks.others },
  ].filter((split) => split.tally.games.length > 0);

  /** The points margin `side` had over the other in a season they led. */
  const margin = (season: PairSeason, side: PairSide) =>
    season[side].totalPoints - season[side === 'a' ? 'b' : 'a'].totalPoints;

  return (
    <>
      <section className='flex flex-col gap-6 pt-8'>
        <h1 className='sr-only'>
          {a.name} mot {b.name}
        </h1>
        <PairHero a={a} b={b} scope={`${span} · ${gameCount(games.length)}`}>
          <PairRow
            id='foran'
            label='Innbyrdes oppgjør: Spill'
            scope={
              finishedAhead.level > 0
                ? `${finishedAhead.level} likt`
                : undefined
            }
            headline
            a={finishedAhead.a}
            b={finishedAhead.b}
            names={names}
          />
        </PairHero>
      </section>

      <section id='spill' className='flex flex-col gap-6'>
        <SectionLabel>Resultater</SectionLabel>
        <PairTrace
          seasons={pair.seasons}
          names={names}
          detailHeading={(season) =>
            `Sesong ${season.season.seasonNumber} · ${a.name}–${b.name}`
          }
          detail={(season) => gameLines(season.tally.games)}
        />
      </section>

      {matches.matches.length > 0 && (
        <section id='matcher' className='flex flex-col gap-6'>
          <SectionLabel>Matcher</SectionLabel>
          <div className={wall}>
            <PairRow
              id='matcher'
              label='H2H-matcher vunnet'
              scope={`${matches.matches.length} matcher`}
              detail={matchLines(matches.matches)}
              a={matches.a}
              b={matches.b}
              names={names}
            >
              {/* One match counts as one whatever its length; the split per
                  series length sits underneath. */}
              <PairMinis>
                {matches.byBestOf.map((group) => (
                  <PairMini
                    key={group.bestOf}
                    label={
                      <GameListPopover
                        id={`best-av-${group.bestOf}`}
                        label={`Best av ${group.bestOf}`}
                        heading={`Best av ${group.bestOf} · ${a.name}–${b.name}`}
                        groups={[{ results: matchResults(group.matches) }]}
                        sides={names}
                        className='uppercase'
                      />
                    }
                    a={group.a}
                    b={group.b}
                    names={names}
                  />
                ))}
              </PairMinis>
            </PairRow>

            {matches.matches.length >= MIN_RUN_SAMPLE && matchRuns.current && (
              <PairRow
                id='matchrekke'
                label='Lengste streak: Matchseire'
                scope={`Nå: ${player(matchRuns.current.side).name} · ${matchRuns.current.matches.length}`}
                a={matchRuns.longest.a.length}
                b={matchRuns.longest.b.length}
                names={names}
              />
            )}
          </div>
        </section>
      )}

      <section id='spill-balanse' className='flex flex-col gap-6'>
        <SectionLabel>Spill</SectionLabel>
        <div className={wall}>
          {/* The masthead's reading again, here with the games behind it. */}
          <PairRow
            id='foran-spill'
            label='Innbyrdes oppgjør: Spill'
            scope={gameCount(games.length)}
            detail={gameLines(games)}
            a={finishedAhead.a}
            b={finishedAhead.b}
            names={names}
          />

          {games.length >= MIN_RUN_SAMPLE && (
            <PairRow
              id='spillrekke'
              label='Lengste streak: Innbyrdes oppgjør i spill'
              scope={
                gameRuns.current
                  ? `Nå: ${player(gameRuns.current.side).name} · ${gameRuns.current.games.length}`
                  : undefined
              }
              a={gameRuns.longest.a.length}
              b={gameRuns.longest.b.length}
              names={names}
            />
          )}

          {pickSplits.length > 0 && (
            <div className='bg-bg flex flex-col gap-3 p-4 sm:px-8 sm:py-5'>
              <h3 className={eyebrow}>Innbyrdes oppgjør: Spill, valgt av</h3>
              <PairMinis>
                {pickSplits.map((split) => (
                  <PairMini
                    key={split.key}
                    label={
                      <GameListPopover
                        id={`valg-${split.key}`}
                        label={split.label}
                        heading={`${split.label} · ${a.name}–${b.name}`}
                        groups={[{ results: versusResults(split.tally.games) }]}
                        sides={names}
                        className='uppercase'
                      />
                    }
                    a={split.tally.a}
                    b={split.tally.b}
                    names={names}
                  />
                ))}
              </PairMinis>
            </div>
          )}
        </div>
      </section>

      <section id='sesonger' className='flex flex-col gap-6'>
        <SectionLabel>Sesonger</SectionLabel>
        <div className={wall}>
          <PairRow
            id='sesonger-foran'
            label='Innbyrdes oppgjør: Sesonger'
            scope={`${pair.seasons.length} sesonger`}
            a={pair.seasonsAhead.a}
            b={pair.seasonsAhead.b}
            names={names}
          />

          <table className='bg-bg w-full border-collapse text-left'>
            <caption className='sr-only'>
              Sesonger begge spilte: sluttplassering og poeng
            </caption>
            <thead>
              <tr className='border-border text-text-muted border-b font-mono text-xs tracking-wide uppercase sm:tracking-widest'>
                <th scope='col' className='px-4 py-3 font-normal sm:px-8'>
                  Sesong
                </th>
                <th scope='col' className='px-2 py-3 text-right font-normal'>
                  {a.name}
                </th>
                <th scope='col' className='px-2 py-3 text-right font-normal'>
                  {b.name}
                </th>
                <th
                  scope='col'
                  className='px-4 py-3 text-right font-normal sm:px-8'
                >
                  Poeng
                </th>
              </tr>
            </thead>
            <tbody>
              {pair.seasons.map((season) => (
                <tr
                  key={season.season.seasonSlug}
                  className='border-border border-b last:border-b-0'
                >
                  <th scope='row' className='px-4 py-3 font-normal sm:px-8'>
                    <Link
                      href={`/sesong/${season.season.seasonSlug}`}
                      className='hover:text-accent focus-visible:outline-accent font-mono text-sm underline underline-offset-2 transition-colors duration-150 focus-visible:outline-2 focus-visible:outline-offset-2'
                    >
                      <span className='sr-only'>Sesong </span>
                      <span aria-hidden='true'>S</span>
                      {season.season.seasonNumber}
                    </Link>
                  </th>
                  {/* A season WON is champion data, so that placement takes
                      the accent — as a title does everywhere else. */}
                  {sides.map((side) => (
                    <td
                      key={side}
                      className={`px-2 py-3 text-right font-mono text-sm tabular-nums ${
                        season[side].placement === 1
                          ? 'text-accent font-bold'
                          : 'text-text'
                      }`}
                    >
                      {season[side].placement}.
                      <span className='sr-only'> plass</span>
                    </td>
                  ))}
                  <td className='text-text-muted px-4 py-3 text-right font-mono text-sm tabular-nums sm:px-8'>
                    {season.a.totalPoints}–{season.b.totalPoints}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Each side's best season against the other, in mirrored plates
            closing the same frame (the wall drops its top border and takes
            the table's bottom edge as its rule). Both plates always show: a
            side that never finished a season ahead gets a dash. */}
        <ul className={`${wall} -mt-6 border-t-0 sm:grid-cols-2`}>
          {sides.map((side) => {
            const season = moments.bestSeason[side];
            return (
              <PairMoment
                key={side}
                id={`sesong-${side}`}
                label={`Beste sesong mot ${other(side).name}`}
                player={player(side)}
                moment={
                  season
                    ? {
                        scope: `S${season.season.seasonNumber}`,
                        figure: `+${margin(season, side)}`,
                        unit: `poeng foran · ${season[side].placement}. mot ${season[side === 'a' ? 'b' : 'a'].placement}. plass`,
                        detail: gameLines(season.tally.games),
                      }
                    : undefined
                }
              />
            );
          })}
        </ul>
      </section>

      {pair.categories.length > 0 && (
        <section id='kategorier' className='flex flex-col gap-6'>
          <SectionLabel>Innbyrdes oppgjør: Spillkategori</SectionLabel>
          <div className='border-border bg-bg border'>
            <div className='flex flex-col px-4 sm:px-8 [&>div:first-child]:border-t-0'>
              {ranked.map((c) => categoryLine(c, true))}
            </div>
            {unranked.length > 0 && (
              <UnrankedRows
                count={unranked.length}
                className={`[&>summary]:px-4 sm:[&>summary]:px-8 ${ranked.length > 0 ? 'border-border border-t' : ''}`}
              >
                <p
                  className={`border-border border-y px-4 py-3 sm:px-8 ${eyebrow}`}
                >
                  {unrankedCaption}
                </p>
                <div className='flex flex-col px-4 sm:px-8 [&>div:first-child]:border-t-0'>
                  {unranked.map((c) => categoryLine(c, false))}
                </div>
              </UnrankedRows>
            )}
          </div>
        </section>
      )}
    </>
  );
}
