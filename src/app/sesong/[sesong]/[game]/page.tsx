import { notFound } from 'next/navigation';
import Link from 'next/link';
import { seasonData, isSeason } from '@/data/sesong';
import { getGameView } from '@/lib/results/queries';
import type { StageView } from '@/lib/results/view-models';
import Heading from '@/components/Heading';
import SectionLabel from '@/components/SectionLabel';
import GameStandings from '@/components/GameStandings';
import RoundRobinStage from '@/components/RoundRobinStage';
import Bracket from '@/components/Bracket';
import RoundsTable from '@/components/RoundsTable';
import PowerUpUseList from '@/components/PowerUpUseList';

interface Props {
  params: Promise<{ sesong: string; game: string }>;
}

// TODO(copy): placeholder labels.
const LABELS = {
  details: 'Detaljer',
  powerUps: 'Power-ups',
  singleRound: 'Resultat',
  stages: {
    'round-robin': 'Gruppespill',
    'single-elim': 'Sluttspill',
    'final-bronze': 'Finaler',
    'double-elim-reset': 'Dobbel utslagning',
    'double-elim-no-reset': 'Dobbel utslagning',
    rounds: 'Runder',
  } satisfies Record<StageView['kind'], string>,
};

export function generateStaticParams() {
  return Object.entries(seasonData).flatMap(([sesong, data]) =>
    data.games.map((game) => ({ sesong, game: game.slug })),
  );
}

export default async function GamePage({ params }: Props) {
  const { sesong, game: gameSlug } = await params;

  if (!isSeason(sesong)) {
    notFound();
  }

  const game = seasonData[sesong].games.find((g) => g.slug === gameSlug);
  if (!game) {
    notFound();
  }

  const { results, stages } = await getGameView(Number(sesong), gameSlug);
  const id = `g${sesong}-${gameSlug}`;

  // A one-round table of placements entered as scores repeats the standings;
  // only a measured score (gold, altitude) is worth its own table.
  const isSingleRound = (s: StageView) =>
    s.kind === 'rounds' && s.rounds.length === 1;
  const detailStages = stages.filter(
    (s) => !isSingleRound(s) || game.roundScore === 'value',
  );
  const lastStage = stages[stages.length - 1];
  const winnerId = results.find((r) => r.placement === 1)?.player
    .seasonPlayerId;
  const notes = results.flatMap((r) => (r.note ? [r.note] : []));
  const hasPowerUps = results.some((r) => r.powerUpUses.length > 0);

  const media = game.videoEmbedUrl ? (
    <iframe
      src={game.videoEmbedUrl}
      title={`${game.title} – video`}
      allow='accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share; fullscreen'
      allowFullScreen
      referrerPolicy='strict-origin-when-cross-origin'
      className='aspect-video w-full'
    />
  ) : (
    <img
      className='w-full'
      src={game.thumbnailPath}
      alt={`Skjermdump fra ${game.title}`}
    />
  );

  return (
    <>
      <section className='flex flex-col gap-10 pt-8'>
        <div className='flex flex-col gap-4'>
          <Link
            href={`/sesong/${sesong}`}
            className='text-text-muted hover:text-text-accent focus-visible:outline-accent w-fit font-mono text-xs tracking-widest uppercase underline transition-colors duration-150 focus-visible:outline-2 focus-visible:outline-offset-2'
          >
            &larr; Sesong {Number(sesong)}
          </Link>

          <Heading as='h1' aboveLine={`GG — Sesong ${Number(sesong)}`}>
            {game.title}
          </Heading>

          <div className='mt-2 flex gap-8'>
            <SectionLabel>Valgt av: {game.chosenBy}</SectionLabel>
            <SectionLabel>Varighet: {game.duration}</SectionLabel>
          </div>
        </div>

        {results.length > 0 ? (
          <div className='grid grid-cols-1 items-start gap-10 lg:grid-cols-[1fr_auto]'>
            {media}
            <div className='flex min-w-0 flex-col gap-6'>
              <GameStandings id={id} rows={results} />
              {notes.map((note) => (
                // w-0 + min-w-full: wraps to the table's width instead of
                // widening the column.
                <p
                  key={note}
                  className='text-text-muted w-0 min-w-full text-sm'
                >
                  {note}
                </p>
              ))}
            </div>
          </div>
        ) : (
          <div className='w-full max-w-2xl'>{media}</div>
        )}
      </section>

      <section className='flex flex-col gap-8'>
        <Heading as='h2'>Beskrivelse &amp; regler</Heading>
        {game.longDescription ? (
          <article
            className='prose prose-invert text-text-muted'
            dangerouslySetInnerHTML={{ __html: game.longDescription }}
          />
        ) : game.shortDescription ? (
          <p className='text-text-muted'>{game.shortDescription}</p>
        ) : (
          <em className='text-text-muted block'>
            Vær litt mer tålmodig, utfyllende beskrivelse og regler kommer
            snart!
          </em>
        )}
      </section>

      {detailStages.length > 0 && (
        <section className='flex flex-col gap-8'>
          <Heading as='h2'>{LABELS.details}</Heading>
          <div className='flex flex-col gap-20'>
            {detailStages.map((stage) => (
              <div key={stage.ordinal} className='flex flex-col gap-10'>
                {/* A surface band, not a rule: a hairline reads as one more grid line. */}
                <div className='bg-surface flex h-15 items-center gap-5 px-5'>
                  <span className='text-text-muted font-mono text-xs tracking-widest'>
                    {String(stage.ordinal).padStart(2, '0')}
                  </span>
                  <Heading as='h3' styleAs='h5'>
                    {stage.kind === 'rounds' && isSingleRound(stage)
                      ? (stage.rounds[0].label ?? LABELS.singleRound)
                      : LABELS.stages[stage.kind]}
                  </Heading>
                </div>
                {stage.kind === 'round-robin' ? (
                  <RoundRobinStage
                    id={`${id}-s${stage.ordinal}`}
                    stage={stage}
                  />
                ) : stage.kind === 'rounds' ? (
                  <RoundsTable
                    stage={stage}
                    scoreKind={game.roundScore}
                    winnerId={stage === lastStage ? winnerId : undefined}
                  />
                ) : (
                  <Bracket id={`${id}-s${stage.ordinal}`} stage={stage} />
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {hasPowerUps && (
        <section className='flex flex-col gap-8'>
          <Heading as='h2'>{LABELS.powerUps}</Heading>
          <PowerUpUseList id={`${id}-pu`} rows={results} />
        </section>
      )}
    </>
  );
}
