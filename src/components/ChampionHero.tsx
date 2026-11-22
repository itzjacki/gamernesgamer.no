import ChampionTone, { CHAMPION_TONE } from './ChampionTone';
import Hero from './Hero';

interface Props {
  name: string;
  nickname: string;
  seasonNumber: number;
  totalPoints: number;
  /**
   * The champion cutout; none, no picture. It fills a square box,
   * bottom-anchored, so champions of different crops come out at a
   * comparable size.
   */
  imagePath: string | null;
}

export default function ChampionHero({
  name,
  nickname,
  seasonNumber,
  totalPoints,
  imagePath,
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
        imagePath && (
          <>
            <ChampionTone />
            <img
              src={imagePath}
              alt={`Bilde av ${name}`}
              className={`${CHAMPION_TONE} aspect-square w-full max-w-80 object-contain object-bottom sm:w-80`}
            />
          </>
        )
      }
    />
  );
}
