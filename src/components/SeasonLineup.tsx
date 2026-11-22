import type { Season, SeasonData } from '@/data/sesong';
import { gamerCards } from '@/lib/cards';
import Button from './Button';
import GameCard from './GameCard';
import Card from './card/Card';
import GamerCards from './card/GamerCards';
import PowerUpCard from './PowerUpCard';
import SectionLabel from './SectionLabel';

/**
 * The upcoming season's lineup: the season page's own cards, with compact
 * games and power-ups so they fit the front page. Each card follows its
 * category's reveal flag, as on the season page.
 */

interface Props {
  /** Zero-padded slug, e.g. "05". */
  season: string;
  data: SeasonData;
}

export default function SeasonLineup({ season, data }: Props) {
  const { meta, gamers, games } = data;
  // Power-ups and curses share one grid but are numbered apart.
  const powerUps = [
    ...(data.powerUps ?? []).map((p, i) => ({ ...p, number: i + 1 })),
    ...(data.curses ?? []).map((c, i) => ({ ...c, number: i + 1 })),
  ];

  const band = (id: string, label: string, children: React.ReactNode) => (
    <section aria-labelledby={id} className='flex flex-col gap-6'>
      <SectionLabel as='h2'>
        <span id={id}>{label}</span>
      </SectionLabel>
      {children}
    </section>
  );

  return (
    <div className='flex flex-col gap-10'>
      {(meta.revealGamerCards ? data.cards.length : gamers.length) > 0 &&
        band(
          'lineup-spillere',
          'Spillere',
          <ul className='grid grid-cols-1 justify-items-center gap-10 sm:grid-cols-2'>
            {gamers.map((gamer) => (
              <li key={gamer.name}>
                {meta.revealGamerCards ? (
                  <GamerCards
                    cards={gamerCards(season as Season, gamer.name)}
                  />
                ) : (
                  <Card />
                )}
              </li>
            ))}
          </ul>,
        )}

      <Button
        as='link'
        href={`/sesong/${season}`}
        width='responsive'
        className='hover:text-text-accent h-12 self-center px-10 font-mono tracking-wide uppercase sm:tracking-widest'
      >
        Se mer om sesong {season}
      </Button>

      {games.length > 0 &&
        band(
          'lineup-spill',
          'Spill',
          <ul className='grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4'>
            {games.map((game, i) => (
              <li key={game.slug}>
                <GameCard
                  {...game}
                  slug={`/sesong/${season}/${game.slug}`}
                  revealed={meta.revealGames}
                  season={season}
                  number={i + 1}
                  compact
                />
              </li>
            ))}
          </ul>,
        )}

      {powerUps.length > 0 &&
        band(
          'lineup-power-ups',
          'Power-ups',
          <ul className='grid grid-cols-2 gap-3 sm:grid-cols-4'>
            {powerUps.map((powerUp) => (
              <li key={`${powerUp.isCurse ? 'cu' : 'pu'}-${powerUp.slug}`}>
                <PowerUpCard
                  {...powerUp}
                  revealed={meta.revealPowerups}
                  season={season}
                  compact
                />
              </li>
            ))}
          </ul>,
        )}
    </div>
  );
}
