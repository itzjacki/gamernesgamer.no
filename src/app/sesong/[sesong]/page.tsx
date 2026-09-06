import { notFound } from 'next/navigation';
import { seasonData, isSeason } from '@/data/sesong';
import GamerCard from '@/components/GamerCard';
import GameCard from '@/components/GameCard';
import PowerUpCard from '@/components/PowerUpCard';
import Heading from '@/components/Heading';

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
  const { meta, gamers, games } = season;
  const powerUps = 'powerUps' in season ? season.powerUps : undefined;
  const curses = 'curses' in season ? season.curses : undefined;
  const seasonNumber = Number(sesong);

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
        <Heading as='h2'>Utøvere</Heading>
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
