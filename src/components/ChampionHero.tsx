import ChampionTone, { CHAMPION_TONE } from './ChampionTone';
import Hero from './Hero';

interface Props {
  name: string;
  nickname: string;
  seasonNumber: number;
  totalPoints: number;
  imagePath: string;
  /**
   * A cutout fills a square box, bottom-anchored, so champions of different
   * crops come out at a comparable size; the fallback gamer image sits framed
   * so a square photo doesn't look broken.
   */
  isCutout: boolean;
}

export default function ChampionHero({
  name,
  nickname,
  seasonNumber,
  totalPoints,
  imagePath,
  isCutout,
}: Props) {
  return (
    <Hero
      eyebrow={`Vinner · Sesong ${seasonNumber}`}
      name={name}
      nickname={nickname}
      extra={
        <>
          <span className='text-text-accent tabular-nums'>{totalPoints}</span>{' '}
          poeng
        </>
      }
      picture={
        <>
          <ChampionTone />
          <img
            src={imagePath}
            alt={`Bilde av ${name}`}
            className={`${CHAMPION_TONE} ${
              isCutout
                ? 'aspect-square w-full max-w-80 object-contain object-bottom sm:w-80'
                : 'm-6 h-56 w-auto object-contain sm:m-10'
            }`}
          />
        </>
      }
    />
  );
}
