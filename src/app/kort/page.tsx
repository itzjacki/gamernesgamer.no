import type { Metadata } from 'next';
import Card from '@/components/card/Card';
import SectionLabel from '@/components/SectionLabel';
import { seasonData, type Season } from '@/data/sesong';
import { seasonCards } from '@/lib/cards';

// TODO(copy): the title, intro and section labels are placeholders.
export const metadata: Metadata = {
  title: 'Kort',
  robots: { index: false },
};

/**
 * Public but unlinked workshop for the card redesign: every card, before it
 * replaces GamerCard.
 */
export default function CardShowcasePage() {
  const seasons = (Object.keys(seasonData) as Season[]).toReversed();
  const sample = seasonCards(seasons[0])[0];

  return (
    <section className='flex flex-col gap-16 pt-8'>
      <div className='flex flex-col gap-2'>
        <h1 className='text-text text-3xl font-extrabold'>Kort</h1>
        <p className='text-text-muted text-sm'>
          Prototype av de nye samlekortene. Vipp med musen, klikk for å snu.
        </p>
      </div>

      {sample && (
        <div className='flex flex-col gap-6'>
          <SectionLabel as='h2'>Bakside</SectionLabel>
          <Card card={sample} showBack />
        </div>
      )}

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
