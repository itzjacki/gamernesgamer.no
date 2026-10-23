import SectionLabel from './SectionLabel';
import type { CareerHero } from '@/lib/results/view-models';

interface Props {
  hero: CareerHero;
}

/**
 * The accent hairline is drawn for EVERY player, not just champions: with
 * nothing to compare against, it is identity, not a ranking signal.
 */
export default function PlayerHero({ hero }: Props) {
  return (
    <section className='border-border bg-bg relative grid grid-cols-1 border sm:grid-cols-[1fr_auto]'>
      <div className='bg-accent absolute inset-x-0 top-0 h-px' aria-hidden />

      <div className='flex flex-col justify-center gap-3 p-6 sm:p-10'>
        <SectionLabel>Spiller</SectionLabel>
        <p className='text-text text-5xl font-extrabold tracking-tight uppercase sm:text-6xl lg:text-7xl'>
          {hero.name}
        </p>
        <p className='text-text-muted font-mono text-xs tracking-widest uppercase'>
          {hero.nickname}
        </p>
      </div>

      <div className='border-border flex items-end justify-center border-t sm:border-t-0 sm:border-l'>
        <img
          src={hero.imagePath}
          alt={`Bilde av ${hero.name}`}
          className={
            hero.heroImageIsFallback
              ? 'm-6 h-56 w-auto object-contain sm:m-10'
              : 'max-h-80 w-auto object-contain'
          }
        />
      </div>
    </section>
  );
}
