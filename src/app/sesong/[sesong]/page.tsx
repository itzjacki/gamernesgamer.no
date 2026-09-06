import { notFound } from 'next/navigation';
import { seasonData, isSeason, type Season } from '@/data/sesong';
import GamerCard from '@/components/GamerCard';
import GameCard from '@/components/GameCard';
import PowerUpCard from '@/components/PowerUpCard';
import LightningIcon from '@/components/LightningIcon';

const revealGamerCards = true;
const revealGames = true;
const revealPowerups = true;

const seasonMeta: Record<Season, { date: string; videoEmbedUrl?: string }> = {
  '01': { date: '18/03/2023' },
  '02': {
    date: '07/10/2023',
    videoEmbedUrl:
      'https://www.youtube.com/embed/3BN1IVT0164?si=g4KGFm-B_WSL2Yoy',
  },
  '03': { date: '16/03/2024 - 17/03/2024' },
  '04': { date: '13/12/2025 - 14/12/2025' },
};

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
  const { gamers, games } = season;
  const powerUps = 'powerUps' in season ? season.powerUps : undefined;
  const curses = 'curses' in season ? season.curses : undefined;
  const meta = seasonMeta[sesong];
  const seasonNumber = Number(sesong);

  return (
    <>
      <section className='flex w-full max-w-prose flex-col items-center gap-4'>
        <h1 className='font-quantico text-4xl sm:text-6xl'>
          Sesong {seasonNumber}
        </h1>
        <div className='flex gap-4'>
          <LightningIcon color='reddish' />
          <LightningIcon color='blueish' />
          <LightningIcon color='reddish' />
        </div>
        <p className='font-quantico'>{meta.date}</p>
        <div className='border-t-blueish w-1/6 border-t-2' />

        {meta.videoEmbedUrl && (
          <div className='mt-8 w-5/6'>
            <iframe
              className='aspect-video w-full rounded-2xl'
              src={meta.videoEmbedUrl}
              title={`Gamernes Gamer sesong ${seasonNumber}`}
              allow='accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share; fullscreen'
              allowFullScreen
              referrerPolicy='strict-origin-when-cross-origin'
            />
          </div>
        )}
      </section>

      <section
        id='participants'
        className='flex max-w-4xl flex-col items-center gap-8'
      >
        <h2 className='font-quantico text-3xl sm:text-4xl'>Utøvere</h2>
        {gamers.some((g) => g.stats) ? (
          <ul className='flex flex-wrap justify-center gap-16'>
            {gamers.map((gamer) => (
              <li key={gamer.name}>
                <GamerCard
                  name={gamer.name}
                  nickname={gamer.nickname}
                  imagePath={gamer.imagePath}
                  stats={gamer.stats}
                  revealed={revealGamerCards}
                />
              </li>
            ))}
          </ul>
        ) : (
          <ul className='grid grid-cols-1 justify-center gap-16 md:grid-cols-2'>
            {gamers.map((gamer) => (
              <li key={gamer.name}>
                <div className='bg-darkblueish flex w-64 flex-col items-center rounded-lg py-4'>
                  <img
                    src={gamer.imagePath}
                    alt={`Bilde av ${gamer.name}`}
                    className='mb-2 h-48'
                  />
                  <p className='border-reddish w-full rounded-b-lg border-t-2 text-center text-lg font-semibold'>
                    {gamer.name} - {gamer.nickname}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section
        id='games'
        className='flex max-w-5xl flex-col items-center gap-8'
      >
        <h2 className='font-quantico text-3xl sm:text-4xl'>Spill</h2>
        <ul className='flex flex-wrap justify-center gap-x-20 gap-y-16'>
          {games.map((game) => (
            <li key={game.slug}>
              <GameCard
                title={game.title}
                slug={`/sesong/${sesong}/${game.slug}`}
                thumbnailPath={game.thumbnailPath}
                chosenBy={game.chosenBy}
                duration={game.duration}
                shortDescription={game.shortDescription}
                revealed={revealGames}
              />
            </li>
          ))}
        </ul>
      </section>

      {powerUps && powerUps.length > 0 && (
        <section
          id='power-ups'
          className='flex max-w-5xl flex-col items-center gap-8'
        >
          <h2 className='font-quantico text-3xl sm:text-4xl'>Power-ups</h2>
          <ul className='flex flex-wrap justify-center gap-8'>
            {powerUps.map((powerUp) => (
              <li key={powerUp.name}>
                <PowerUpCard {...powerUp} revealed={revealPowerups} />
              </li>
            ))}
          </ul>
          {curses && curses.length > 0 && (
            <ul className='flex flex-wrap justify-center gap-8'>
              {curses.map((curse) => (
                <li key={curse.name}>
                  <PowerUpCard {...curse} revealed={revealPowerups} />
                </li>
              ))}
            </ul>
          )}
        </section>
      )}
    </>
  );
}
