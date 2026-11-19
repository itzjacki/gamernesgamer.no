import type { CareerHero } from '@/lib/results/view-models';
import Hero from './Hero';
import { PORTRAIT_TONE } from './portrait-tone';

interface Props {
  hero: CareerHero;
}

export default function PlayerHero({ hero }: Props) {
  return (
    <Hero
      name={hero.name}
      nameAs='h1'
      nickname={hero.nickname}
      picture={
        <img
          src={hero.imagePath}
          alt={`Bilde av ${hero.name}`}
          className={`${PORTRAIT_TONE} ${
            hero.heroImageIsFallback
              ? 'm-6 h-56 w-auto object-contain sm:m-10'
              : 'max-h-80 w-auto object-contain'
          }`}
        />
      }
    />
  );
}
