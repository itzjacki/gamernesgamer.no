import SectionLabel from './SectionLabel';

interface Props {
  name: string;
  nickname: string;
  seasonNumber: number;
  totalPoints: number;
  imagePath: string;
  /**
   * A cutout bleeds to the panel edge; the fallback gamer image sits framed
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
    <section className='border-border bg-bg relative grid grid-cols-1 border sm:grid-cols-[1fr_auto]'>
      <div className='bg-accent absolute inset-x-0 top-0 h-px' aria-hidden />

      <div className='flex flex-col justify-center gap-3 p-6 sm:p-10'>
        <SectionLabel>Vinner · Sesong {seasonNumber}</SectionLabel>
        <p className='text-text text-5xl font-extrabold tracking-tight uppercase sm:text-6xl lg:text-7xl'>
          {name}
        </p>
        <p className='text-text-muted font-mono text-xs tracking-widest uppercase'>
          {nickname}
        </p>
        <p className='text-text-muted mt-2 font-mono text-xs tracking-widest uppercase'>
          <span className='text-accent tabular-nums'>{totalPoints}</span> poeng
        </p>
      </div>

      <div className='border-border flex items-end justify-center border-t sm:border-t-0 sm:border-l'>
        <img
          src={imagePath}
          alt={`Bilde av ${name}`}
          className={
            isCutout
              ? 'max-h-80 w-auto object-contain'
              : 'm-6 h-56 w-auto object-contain sm:m-10'
          }
        />
      </div>
    </section>
  );
}
