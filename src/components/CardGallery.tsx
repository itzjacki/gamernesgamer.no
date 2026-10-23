import GamerCard from './GamerCard';
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
      {label && <SectionLabel>{label}</SectionLabel>}
      <ul className='grid grid-cols-1 justify-items-center gap-10 sm:grid-cols-2'>
        {cards.map((c) => (
          <li key={c.seasonNumber} className='flex flex-col items-center gap-3'>
            <GamerCard
              name={playerName}
              nickname={c.nickname}
              stats={c.stats}
              imagePath={c.imagePath}
              revealed
            />
            <span className='text-text-muted font-mono text-xs tracking-widest uppercase'>
              Sesong {c.seasonNumber}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
