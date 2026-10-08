import GamerCard from './GamerCard';
import SectionLabel from './SectionLabel';
import type { CareerCard } from '@/lib/results/view-models';

/**
 * The FUTBIN-style card gallery: every one of a player's per-season FIFA cards
 * in a grid, each under a mono "plaque" naming its season. Reuses the existing
 * GamerCard (a 'use client' component for its tilt effect) — a Server Component
 * can render it fine. Cards are always revealed here (career archive). A season
 * whose static data has no stat block renders GamerCard's own stats-less state;
 * no guard needed since GamerCard already takes `stats?`.
 */

interface Props {
  cards: CareerCard[];
  /** The player's display name — GamerCard's identity line. */
  playerName: string;
  /** Optional mono eyebrow rendered above the gallery grid. */
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
