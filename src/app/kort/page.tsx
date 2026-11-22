import type { Metadata } from 'next';
import Card from '@/components/card/Card';
import Heading from '@/components/Heading';
import SectionLabel from '@/components/SectionLabel';
import { seasonData, type Season } from '@/data/sesong';
import { seasonCards } from '@/lib/cards';

export const metadata: Metadata = {
  title: 'Kort',
};

/** Every card, season by season. */
export default function CardShowcasePage() {
  const seasons = (Object.keys(seasonData) as Season[]).toReversed();
  const count = seasons.reduce((n, s) => n + seasonCards(s).length, 0);

  return (
    <section className='flex flex-col gap-16 pt-8'>
      <div className='flex flex-col gap-4'>
        <Heading as='h1' serial={[`${count} kort`]}>
          Kort
        </Heading>
        <p className='text-text-muted text-sm'>
          Her finner du alle spillerkortene som har blitt laget siden første
          sesong av Gamernes Gamer.
        </p>
      </div>

      {seasons.map((season) => (
        <div key={season} className='flex flex-col gap-6'>
          <SectionLabel as='h2'>Sesong {Number(season)}</SectionLabel>
          <ul className='grid grid-cols-1 justify-items-center gap-10 sm:grid-cols-2'>
            {seasonCards(season).map((card) => (
              <li key={`${card.type}-${card.number}`}>
                <Card card={card} />
              </li>
            ))}
          </ul>
        </div>
      ))}
    </section>
  );
}
