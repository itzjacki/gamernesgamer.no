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
        hero.imagePath && (
          <img
            src={hero.imagePath}
            alt={`Bilde av ${hero.name}`}
            className={`${PORTRAIT_TONE} max-h-80 w-auto object-contain`}
          />
        )
      }
    />
  );
}
