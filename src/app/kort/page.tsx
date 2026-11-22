import type { Metadata } from 'next';
import Card from '@/components/card/Card';
import SectionLabel from '@/components/SectionLabel';
import { seasonData, type Season } from '@/data/sesong';
import { seasonCards } from '@/lib/cards';

export const metadata: Metadata = {
  title: 'Kort',
};

/** Every card, season by season. Public; not linked from the nav yet. */
export default function CardShowcasePage() {
  const seasons = (Object.keys(seasonData) as Season[]).toReversed();

  return (
    <section className='flex flex-col gap-16 pt-8'>
      <div className='flex flex-col gap-2'>
        <h1 className='text-text text-3xl font-extrabold'>Kort</h1>
        <p className='text-text-muted text-sm'>
          Her finner du en alle spillerkortene som har blitt laget siden første
          sesong med Gamernes Gamer.
        </p>
      </div>

      {seasons.map((season) => (
        <div key={season} className='flex flex-col gap-6'>
          <SectionLabel as='h2'>Sesong {Number(season)}</SectionLabel>
          <ul className='flex flex-wrap gap-10'>
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
