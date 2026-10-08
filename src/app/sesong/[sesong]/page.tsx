import { notFound } from 'next/navigation';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { seasonData, isSeason } from '@/data/sesong';
import type { PowerUp } from '@/types/power-up';
import { getSeasonView } from '@/lib/results/queries';
import { composeSeasonView } from '@/lib/results/compose';
import type { ComposedSeasonView } from '@/lib/results/compose';
import type { SeasonView } from '@/lib/results/view-models';
import GamerCard from '@/components/GamerCard';
import GameCard from '@/components/GameCard';
import PowerUpCard from '@/components/PowerUpCard';
import Heading from '@/components/Heading';
import ChampionHero from '@/components/ChampionHero';
import StandingsTable from '@/components/StandingsTable';
import SeasonPointsChart from '@/components/SeasonPointsChart';
import type { ChartSeries } from '@/components/SeasonPointsChart';
import GamePointsMatrix from '@/components/GamePointsMatrix';
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

export default async function SeasonPage({ params }: Props) {
  const { sesong } = await params;

  if (!isSeason(sesong)) {
    notFound();
  }

  const season = seasonData[sesong];
  const { meta } = season;
  const seasonNumber = Number(sesong);

  // The finished (archive) phase is standings-first and reads results. Live
  // renders like finished for now (polling is Phase 5). Upcoming is the
  // hype-building poster — reveal flags gate its sections, no results.
  if (meta.status === 'finished' || meta.status === 'live') {
    const view = await getSeasonView(seasonNumber);
    // A finished season should always have results; if the DB has none yet
    // (e.g. a season flipped to finished before seeding), fall back to the
    // poster rather than render an empty results page.
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
          powerUps={'powerUps' in season ? season.powerUps : undefined}
          curses={'curses' in season ? season.curses : undefined}
          videoEmbedUrl={meta.videoEmbedUrl}
        />
      );
    }
  }

  return <UpcomingSeason sesong={sesong} seasonNumber={seasonNumber} />;
}

/* -------------------------------------------------------------------------- */
/* Finished phase                                                             */
/* -------------------------------------------------------------------------- */

/** Map the derived series to the chart's local shape. */
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

/** Short x-axis labels: game title keyed by ordinal. */
function gameLabels(composed: ComposedSeasonView): Record<number, string> {
  const labels: Record<number, string> = {};
  for (const g of composed.games) labels[g.ordinal] = g.game.title;
  return labels;
}

/**
 * Build the points-matrix inputs. Player COLUMNS follow final-standings order
 * (champion first); each game ROW emits its cells in that same column order so
 * columns stay aligned (composed `results` are ordered by per-game placement,
 * which varies per game — we re-key by seasonPlayerId). Game labels + power-up
 * display names come from the composed static content.
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

/**
 * Resolve the champion's hero image: a dedicated background-removed cutout at
 * public/images/champions/<NN>.png when present, otherwise the regular gamer
 * portrait. Checked at build time (static page) via the filesystem.
 */
function resolveChampionImage(
  seasonSlug: string,
  fallback: string,
): { imagePath: string; isCutout: boolean } {
  const rel = `/images/champions/${seasonSlug}.png`;
  const abs = path.join(process.cwd(), 'public', rel);
  return existsSync(abs)
    ? { imagePath: rel, isCutout: true }
    : { imagePath: fallback, isCutout: false };
}

interface FinishedProps {
  seasonNumber: number;
  composed: ComposedSeasonView;
  series: ChartSeries[];
  gameLabels: Record<number, string>;
  matrix: { players: MatrixPlayer[]; games: MatrixGameRow[] };
  powerUps?: PowerUp[];
  curses?: PowerUp[];
  videoEmbedUrl?: string;
}

function FinishedSeason({
  seasonNumber,
  composed,
  series,
  gameLabels,
  matrix,
  powerUps,
  curses,
  videoEmbedUrl,
}: FinishedProps) {
  const champion = composed.standings.find((s) => s.isChampion);
  const championImage = champion
    ? resolveChampionImage(composed.seasonSlug, champion.gamer.imagePath)
    : null;

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
          aboveLine={`GG — Sesong ${seasonNumber}`}
          belowLine={composed.seasonSlug}
        >
          Sesong {seasonNumber}
        </Heading>
      </section>

      {champion && championImage && (
        <ChampionHero
          name={champion.player.name}
          nickname={champion.gamer.nickname}
          seasonNumber={seasonNumber}
          totalPoints={champion.totalPoints}
          imagePath={championImage.imagePath}
          isCutout={championImage.isCutout}
        />
      )}

      <section id='standings' className='flex flex-col gap-8'>
        <StandingsTable rows={standingsRows} />
      </section>

      {series.length > 0 && (
        <section id='points-chart' className='flex flex-col gap-8'>
          <SeasonPointsChart series={series} gameLabels={gameLabels} />
        </section>
      )}

      {matrix.games.length > 0 && (
        <section id='points-matrix' className='flex flex-col gap-8'>
          <GamePointsMatrix
            seasonNumber={seasonNumber}
            players={matrix.players}
            games={matrix.games}
          />
        </section>
      )}

      <section id='participants' className='flex flex-col gap-8'>
        <Heading as='h2'>Spillere</Heading>
        {composed.standings.some((s) => s.gamer.stats) ? (
          <ul className='grid grid-cols-1 justify-items-center gap-10 sm:grid-cols-2'>
            {composed.standings.map((s) => (
              <li key={s.player.name}>
                <GamerCard
                  name={s.gamer.name}
                  nickname={s.gamer.nickname}
                  imagePath={s.gamer.imagePath}
                  stats={s.gamer.stats}
                  revealed
                />
              </li>
            ))}
          </ul>
        ) : (
          <ul className='grid grid-cols-1 gap-10 sm:grid-cols-2'>
            {composed.standings.map((s) => (
              <li key={s.player.name}>
                <div className='border-border-accent bg-bg flex w-full flex-col items-center border py-4'>
                  <img
                    src={s.gamer.imagePath}
                    alt={`Bilde av ${s.gamer.name}`}
                    className='mb-2 h-48'
                  />
                  <p className='border-border text-text w-full border-t px-3 pt-3 text-center text-sm font-semibold'>
                    {s.gamer.name} – {s.gamer.nickname}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section id='games' className='flex flex-col gap-8'>
        <Heading as='h2'>Spill</Heading>
        <ul className='grid grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-3'>
          {composed.games.map((g) => (
            <li key={g.game.slug}>
              <GameCard
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
        <section id='power-ups' className='flex flex-col gap-8'>
          <Heading as='h2'>Power-ups</Heading>
          <ul className='grid grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-3'>
            {powerUps.map((powerUp) => (
              <li key={powerUp.slug}>
                <PowerUpCard {...powerUp} revealed />
              </li>
            ))}
          </ul>
          {curses && curses.length > 0 && (
            <ul className='grid grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-3'>
              {curses.map((curse) => (
                <li key={curse.slug}>
                  <PowerUpCard {...curse} revealed />
                </li>
              ))}
            </ul>
          )}
        </section>
      )}

      {videoEmbedUrl && (
        <section className='flex flex-col gap-8'>
          <div className='w-full max-w-2xl'>
            <iframe
              className='aspect-video w-full rounded-sm'
              src={videoEmbedUrl}
              title={`Gamernes Gamer sesong ${seasonNumber}`}
              allow='accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share; fullscreen'
              allowFullScreen
              referrerPolicy='strict-origin-when-cross-origin'
            />
          </div>
        </section>
      )}
    </>
  );
}

/* -------------------------------------------------------------------------- */
/* Upcoming phase (the hype-building poster — unchanged behaviour)            */
/* -------------------------------------------------------------------------- */

function UpcomingSeason({
  sesong,
  seasonNumber,
}: {
  sesong: string;
  seasonNumber: number;
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
          aboveLine={`GG — Sesong ${seasonNumber}`}
          belowLine={meta.date}
        >
          Sesong {seasonNumber}
        </Heading>

        {meta.videoEmbedUrl && (
          <div className='mt-8 w-full max-w-2xl'>
            <iframe
              className='aspect-video w-full rounded-sm'
              src={meta.videoEmbedUrl}
              title={`Gamernes Gamer sesong ${seasonNumber}`}
              allow='accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share; fullscreen'
              allowFullScreen
              referrerPolicy='strict-origin-when-cross-origin'
            />
          </div>
        )}
      </section>

      <section id='participants' className='flex flex-col gap-8'>
        <Heading as='h2'>Spillere</Heading>
        {gamers.some((g) => g.stats) ? (
          <ul className='grid grid-cols-1 justify-items-center gap-10 sm:grid-cols-2'>
            {gamers.map((gamer) => (
              <li key={gamer.name}>
                <GamerCard
                  name={gamer.name}
                  nickname={gamer.nickname}
                  imagePath={gamer.imagePath}
                  stats={gamer.stats}
                  revealed={meta.revealGamerCards}
                />
              </li>
            ))}
          </ul>
        ) : (
          <ul className='grid grid-cols-1 gap-10 sm:grid-cols-2'>
            {gamers.map((gamer) => (
              <li key={gamer.name}>
                <div className='border-border-accent bg-bg flex w-full flex-col items-center border py-4'>
                  <img
                    src={gamer.imagePath}
                    alt={`Bilde av ${gamer.name}`}
                    className='mb-2 h-48'
                  />
                  <p className='border-border text-text w-full border-t px-3 pt-3 text-center text-sm font-semibold'>
                    {gamer.name} – {gamer.nickname}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section id='games' className='flex flex-col gap-8'>
        <Heading as='h2'>Spill</Heading>
        <ul className='grid grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-3'>
          {games.map((game) => (
            <li key={game.slug}>
              <GameCard
                title={game.title}
                slug={`/sesong/${sesong}/${game.slug}`}
                thumbnailPath={game.thumbnailPath}
                chosenBy={game.chosenBy}
                duration={game.duration}
                shortDescription={game.shortDescription}
                revealed={meta.revealGames}
              />
            </li>
          ))}
        </ul>
      </section>

      {powerUps && powerUps.length > 0 && (
        <section id='power-ups' className='flex flex-col gap-8'>
          <Heading as='h2'>Power-ups</Heading>
          <ul className='grid grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-3'>
            {powerUps.map((powerUp) => (
              <li key={powerUp.name}>
                <PowerUpCard {...powerUp} revealed={meta.revealPowerups} />
              </li>
            ))}
          </ul>
          {curses && curses.length > 0 && (
            <ul className='grid grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-3'>
              {curses.map((curse) => (
                <li key={curse.name}>
                  <PowerUpCard {...curse} revealed={meta.revealPowerups} />
                </li>
              ))}
            </ul>
          )}
        </section>
      )}
    </>
  );
}
