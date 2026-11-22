import type { Metadata } from 'next';
import { Suspense } from 'react';
import { notFound } from 'next/navigation';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { seasonData, isSeason, type Season } from '@/data/sesong';
import { gamerCards } from '@/lib/cards';
import { formatSeasonDates } from '@/lib/season-dates';
import type { PowerUp } from '@/types/power-up';
import type { SeasonRecap } from '@/types/season-meta';
import { getSeasonView } from '@/lib/results/queries';
import { getAllMedia } from '@/lib/media/queries';
import { byKind, forSeason } from '@/lib/media/select';
import type { MediaItemView } from '@/lib/media/view-models';
import { composeSeasonView } from '@/lib/results/compose';
import type { ComposedSeasonView } from '@/lib/results/compose';
import type { SeasonView } from '@/lib/results/view-models';
import {
  derivePowerUpImpact,
  type PowerUpImpactRow,
} from '@/lib/results/power-up-impact';
import Card from '@/components/card/Card';
import GamerCards from '@/components/card/GamerCards';
import GameCard from '@/components/GameCard';
import PowerUpCard from '@/components/PowerUpCard';
import Heading from '@/components/Heading';
import SerialLink from '@/components/SerialLink';
import SectionLabel from '@/components/SectionLabel';
import MediaSection from '@/components/MediaSection';
import ChampionHero from '@/components/ChampionHero';
import StandingsTable from '@/components/StandingsTable';
import SeasonPointsChart from '@/components/SeasonPointsChart';
import type { ChartSeries } from '@/components/SeasonPointsChart';
import GamePointsMatrix from '@/components/GamePointsMatrix';
import PowerUpImpact from '@/components/PowerUpImpact';
import SeasonChanges from '@/components/SeasonChanges';
import type {
  MatrixPlayer,
  MatrixGameRow,
} from '@/components/GamePointsMatrix';

interface Props {
  params: Promise<{ sesong: string }>;
}

export function generateStaticParams() {
  return Object.keys(seasonData).map((sesong) => ({ sesong }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { sesong } = await params;
  return isSeason(sesong) ? { title: `Sesong ${Number(sesong)}` } : {};
}

export default async function SeasonPage({ params }: Props) {
  const { sesong } = await params;

  if (!isSeason(sesong)) {
    notFound();
  }

  const season = seasonData[sesong];
  const { meta } = season;
  const seasonNumber = Number(sesong);
  const media = byKind(forSeason(await getAllMedia(), seasonNumber));

  // Live renders like finished for now.
  if (meta.status === 'finished' || meta.status === 'live') {
    const view = await getSeasonView(seasonNumber);
    // No results yet (e.g. flipped to finished before seeding): show the poster.
    if (view && view.standings.length > 0) {
      const composed = composeSeasonView(view);
      const matrix = toMatrix(view, composed);
      return (
        <FinishedSeason
          seasonNumber={seasonNumber}
          composed={composed}
          series={toChartSeries(view)}
          gameLabels={gameLabels(composed)}
          matrix={matrix}
          impact={derivePowerUpImpact(composed)}
          recap={meta.recap}
          powerUps={'powerUps' in season ? season.powerUps : undefined}
          curses={'curses' in season ? season.curses : undefined}
          media={media}
          dates={formatSeasonDates(meta)}
        />
      );
    }
  }

  return (
    <UpcomingSeason sesong={sesong} seasonNumber={seasonNumber} media={media} />
  );
}

function toChartSeries(view: Awaited<ReturnType<typeof getSeasonView>>) {
  if (!view) return [];
  const placementBySp = new Map(
    view.standings.map((s) => [s.player.seasonPlayerId, s.placement]),
  );
  const championId = view.standings.find((s) => s.isChampion)?.player
    .seasonPlayerId;
  return view.series.map((line) => ({
    name: line.player.name,
    isChampion: line.player.seasonPlayerId === championId,
    placement: placementBySp.get(line.player.seasonPlayerId) ?? Infinity,
    points: line.points.map((p) => ({ x: p.ordinal, y: p.total })),
  })) satisfies ChartSeries[];
}

function gameLabels(composed: ComposedSeasonView): Record<number, string> {
  const labels: Record<number, string> = {};
  for (const g of composed.games) labels[g.ordinal] = g.game.title;
  return labels;
}

/**
 * Columns follow final standings; each row's cells are re-keyed by
 * seasonPlayerId into that order, since `results` are ordered per game.
 */
function toMatrix(
  view: SeasonView,
  composed: ComposedSeasonView,
): { players: MatrixPlayer[]; games: MatrixGameRow[] } {
  const players: MatrixPlayer[] = view.standings.map((s) => ({
    seasonPlayerId: s.player.seasonPlayerId,
    name: s.player.name,
    totalPoints: s.totalPoints,
    isChampion: s.isChampion,
  }));

  const games: MatrixGameRow[] = composed.games.map((g) => {
    const byPlayer = new Map(
      g.results.map((r) => [r.player.seasonPlayerId, r]),
    );
    return {
      ordinal: g.ordinal,
      label: g.game.title,
      cells: players.map((p) => {
        const r = byPlayer.get(p.seasonPlayerId);
        return {
          seasonPlayerId: p.seasonPlayerId,
          ladderPoints: r?.ladderPoints ?? 0,
          points: r?.points ?? 0,
          powerUpUses: (r?.powerUpUses ?? []).map((u) => ({
            name: u.name,
            isCurse: u.isCurse,
            pointsDelta: u.pointsDelta,
          })),
        };
      }),
    };
  });

  return { players, games };
}

/** The cutout at public/images/champions/<NN>.png, checked at build time. */
function findChampionCutout(seasonSlug: string): string | null {
  const rel = `/images/champions/${seasonSlug}.png`;
  return existsSync(path.join(process.cwd(), 'public', rel)) ? rel : null;
}

interface FinishedProps {
  seasonNumber: number;
  composed: ComposedSeasonView;
  series: ChartSeries[];
  gameLabels: Record<number, string>;
  matrix: { players: MatrixPlayer[]; games: MatrixGameRow[] };
  /** Null without power-up uses (S1). */
  impact: PowerUpImpactRow[] | null;
  recap?: SeasonRecap;
  powerUps?: PowerUp[];
  curses?: PowerUp[];
  media: MediaItemView[];
  /** Formatted, for the catalogue line. */
  dates: string;
}

function FinishedSeason({
  seasonNumber,
  composed,
  series,
  gameLabels,
  matrix,
  impact,
  recap,
  powerUps,
  curses,
  media,
  dates,
}: FinishedProps) {
  const champion = composed.standings.find((s) => s.isChampion);

  const standingsRows = composed.standings.map((s) => ({
    placement: s.placement,
    name: s.player.name,
    slug: s.player.slug,
    totalPoints: s.totalPoints,
    isChampion: s.isChampion,
  }));

  return (
    <>
      <section className='flex flex-col gap-4 pt-8'>
        <Heading
          as='h1'
          serial={[
            <SerialLink key='index' href='/sesong'>
              Sesonger
            </SerialLink>,
            composed.seasonSlug,
            dates,
          ]}
        >
          Sesong {seasonNumber}
        </Heading>
      </section>

      {champion && (
        <ChampionHero
          name={champion.player.name}
          nickname={champion.gamer.nickname}
          seasonNumber={seasonNumber}
          totalPoints={champion.totalPoints}
          imagePath={findChampionCutout(composed.seasonSlug)}
        />
      )}

      {/* Three views of one result, so they sit one cell apart, closer than
          the page's sections. */}
      <div className='flex flex-col gap-10'>
        <section id='standings' className='flex flex-col gap-6'>
          <SectionLabel as='h2'>Resultater</SectionLabel>
          <StandingsTable rows={standingsRows} />
        </section>

        {series.length > 0 && (
          <section id='points-chart' className='flex flex-col gap-6'>
            <SeasonPointsChart series={series} gameLabels={gameLabels} />
          </section>
        )}

        {matrix.games.length > 0 && (
          <section id='points-matrix' className='flex flex-col gap-6'>
            <GamePointsMatrix
              seasonNumber={seasonNumber}
              players={matrix.players}
              games={matrix.games}
            />
          </section>
        )}
      </div>

      {recap && (
        <section id='oppsummering' className='flex flex-col gap-6'>
          <SectionLabel as='h2'>Oppsummering</SectionLabel>
          <div className='flex max-w-prose flex-col gap-4'>
            <h3 className='text-text text-2xl font-extrabold tracking-tight'>
              {recap.title}
            </h3>
            {recap.paragraphs.map((paragraph, i) => (
              <p key={i} className='text-text'>
                {paragraph}
              </p>
            ))}
          </div>
        </section>
      )}

      {impact && <PowerUpImpact rows={impact} />}

      <Suspense>
        <SeasonChanges seasonNumber={seasonNumber} />
      </Suspense>

      {seasonData[composed.seasonSlug as Season].cards.length > 0 && (
        <section id='participants' className='flex flex-col gap-6'>
          <SectionLabel as='h2'>Spillere</SectionLabel>
          <ul className='grid grid-cols-1 justify-items-center gap-10 sm:grid-cols-2'>
            {composed.standings.map((s) => (
              <li key={s.player.name}>
                <GamerCards
                  cards={gamerCards(
                    composed.seasonSlug as Season,
                    s.gamer.name,
                  )}
                />
              </li>
            ))}
          </ul>
        </section>
      )}

      <section id='games' className='flex flex-col gap-6'>
        <SectionLabel as='h2'>Spill</SectionLabel>
        <ul className='grid grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-3'>
          {composed.games.map((g, i) => (
            <li key={g.game.slug}>
              <GameCard
                season={composed.seasonSlug}
                number={i + 1}
                title={g.game.title}
                slug={`/sesong/${composed.seasonSlug}/${g.game.slug}`}
                thumbnailPath={g.game.thumbnailPath}
                chosenBy={g.game.chosenBy}
                duration={g.game.duration}
                shortDescription={g.game.shortDescription}
                revealed
              />
            </li>
          ))}
        </ul>
      </section>

      {powerUps && powerUps.length > 0 && (
        <section id='power-ups' className='flex flex-col gap-6'>
          <SectionLabel as='h2'>Power-ups</SectionLabel>
          <ul className='grid grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-3'>
            {powerUps.map((powerUp, i) => (
              <li key={powerUp.slug}>
                <PowerUpCard
                  {...powerUp}
                  revealed
                  season={composed.seasonSlug}
                  number={i + 1}
                />
              </li>
            ))}
          </ul>
          {curses && curses.length > 0 && (
            <ul className='grid grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-3'>
              {curses.map((curse, i) => (
                <li key={curse.slug}>
                  <PowerUpCard
                    {...curse}
                    revealed
                    season={composed.seasonSlug}
                    number={i + 1}
                  />
                </li>
              ))}
            </ul>
          )}
        </section>
      )}

      <MediaSection items={media} />
    </>
  );
}

function UpcomingSeason({
  sesong,
  seasonNumber,
  media,
}: {
  sesong: string;
  seasonNumber: number;
  media: MediaItemView[];
}) {
  const season = seasonData[sesong as keyof typeof seasonData];
  const { meta, gamers, games } = season;
  const powerUps = 'powerUps' in season ? season.powerUps : undefined;
  const curses = 'curses' in season ? season.curses : undefined;

  return (
    <>
      <section className='flex flex-col gap-4 pt-8'>
        <Heading
          as='h1'
          serial={[
            <SerialLink key='index' href='/sesong'>
              Sesonger
            </SerialLink>,
            sesong,
            formatSeasonDates(meta),
          ]}
        >
          Sesong {seasonNumber}
        </Heading>
      </section>

      {/* Before the event the welcome video does the hype job, so it leads. */}
      <MediaSection items={media} />

      {/* Sealed, the backs stand in for the roster; revealed, the cards. */}
      {(meta.revealGamerCards ? season.cards.length : gamers.length) > 0 && (
        <section id='participants' className='flex flex-col gap-6'>
          <SectionLabel as='h2'>Spillere</SectionLabel>
          <ul className='grid grid-cols-1 justify-items-center gap-10 sm:grid-cols-2'>
            {gamers.map((gamer) => (
              <li key={gamer.name}>
                {meta.revealGamerCards ? (
                  <GamerCards
                    cards={gamerCards(sesong as Season, gamer.name)}
                  />
                ) : (
                  <Card />
                )}
              </li>
            ))}
          </ul>
        </section>
      )}

      <section id='games' className='flex flex-col gap-6'>
        <SectionLabel as='h2'>Spill</SectionLabel>
        <ul className='grid grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-3'>
          {games.map((game, i) => (
            <li key={game.slug}>
              <GameCard
                title={game.title}
                slug={`/sesong/${sesong}/${game.slug}`}
                thumbnailPath={game.thumbnailPath}
                chosenBy={game.chosenBy}
                duration={game.duration}
                shortDescription={game.shortDescription}
                revealed={meta.revealGames}
                season={sesong}
                number={i + 1}
              />
            </li>
          ))}
        </ul>
      </section>

      {powerUps && powerUps.length > 0 && (
        <section id='power-ups' className='flex flex-col gap-6'>
          <SectionLabel as='h2'>Power-ups</SectionLabel>
          <ul className='grid grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-3'>
            {powerUps.map((powerUp, i) => (
              <li key={powerUp.name}>
                <PowerUpCard
                  {...powerUp}
                  revealed={meta.revealPowerups}
                  season={sesong}
                  number={i + 1}
                />
              </li>
            ))}
          </ul>
          {curses && curses.length > 0 && (
            <ul className='grid grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-3'>
              {curses.map((curse, i) => (
                <li key={curse.name}>
                  <PowerUpCard
                    {...curse}
                    revealed={meta.revealPowerups}
                    season={sesong}
                    number={i + 1}
                  />
                </li>
              ))}
            </ul>
          )}
        </section>
      )}
    </>
  );
}
