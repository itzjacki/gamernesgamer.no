import type { Season } from '@/data/sesong';
import { gamerCards } from '@/lib/cards';
import GamerCards from './card/GamerCards';
import SectionLabel from './SectionLabel';
import type { CareerCard } from '@/lib/results/view-models';

interface Props {
  cards: CareerCard[];
  playerName: string;
  label?: string;
}

export default function CardGallery({ cards, playerName, label }: Props) {
  return (
    <div className='flex flex-col gap-6'>
      {label && <SectionLabel as='h2'>{label}</SectionLabel>}
      <ul className='grid grid-cols-1 justify-items-center gap-10 sm:grid-cols-2'>
        {cards.map((c) => (
          <li key={c.seasonNumber} className='flex flex-col items-center gap-3'>
            <GamerCards
              cards={gamerCards(c.seasonSlug as Season, playerName)}
            />
            <span className='text-text-muted font-mono text-xs tracking-wide uppercase sm:tracking-widest'>
              Sesong {c.seasonNumber}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
