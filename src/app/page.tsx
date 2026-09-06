import { seasonData, currentSeason } from '@/data/sesong';
import GamerCard from '@/components/GamerCard';
import GameCard from '@/components/GameCard';
import PowerUpCard from '@/components/PowerUpCard';
import LightningIcon from '@/components/LightningIcon';

const revealGamerCards = true;
const revealGames = true;
const revealPowerups = true;

export default function HomePage() {
  const season = seasonData[currentSeason];
  const { gamers, games } = season;
  const powerUps = 'powerUps' in season ? season.powerUps : undefined;
  const curses = 'curses' in season ? season.curses : undefined;

  return (
    <>
      <section className='flex max-w-prose flex-col items-center gap-4'>
        <h1 className='font-quantico text-4xl sm:text-6xl'>Gamernes Gamer</h1>
        <div className='flex gap-4'>
          <LightningIcon color='reddish' />
          <LightningIcon color='blueish' />
          <LightningIcon color='reddish' />
        </div>
        <p className='font-quantico'>13/12/2025 - 14/12/2025</p>
        <div className='border-t-blueish mb-8 w-1/6 border-t-2' />
        <p className='mb-8'>
          Gamernes Gamer sesong 4 er ferdig! Fire utøvere konkurrerte i 8 spill
          om den gjeve GG-pokalen. For andre sesong på rad stakk The Professor
          av med seieren, denne gangen bare to poeng foran The Maestro.
        </p>
      </section>

      <section
        id='participants'
        className='flex max-w-4xl flex-col items-center gap-8'
      >
        <h2 className='font-quantico text-3xl sm:text-4xl'>Utøvere</h2>
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
                slug={`/sesong/${currentSeason}/${game.slug}`}
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
          <p>
            I sesong 4 av Gamernes Gamer kunne hver deltaker fritt velge tre
            power-ups fra et større utvalg. Disse kunne gi en kjempefordel om de
            ble brukt riktig, så det å velge riktig power-ups var kritisk. I
            tillegg måtte hver spiller velge én <em>curse</em>, som ga de en
            betydelig ulempe.
          </p>
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
