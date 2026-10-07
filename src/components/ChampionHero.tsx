import SectionLabel from './SectionLabel';

interface Props {
  /** Champion display name. */
  name: string;
  /** Champion nickname (shown as the mono sub-line). */
  nickname: string;
  /** Season number, for the eyebrow context. */
  seasonNumber: number;
  /** Derived total season points. */
  totalPoints: number;
  /** Resolved image src — a background-removed cutout when available. */
  imagePath: string;
  /**
   * True when `imagePath` is a dedicated background-removed cutout. Drives the
   * treatment: a cutout bleeds to the panel edge (no frame); the fallback
   * gamer image sits framed so a square photo doesn't look broken.
   */
  isCutout: boolean;
}

/**
 * The champion centrepiece for a finished season — the single above-the-fold
 * accent moment. A full-width VERKSTED band (solid bg, hairline border, no
 * shadow/radius) with the champion name in Neue Montreal 800 and ONE accent
 * hairline marking P1. The cutout PNG, when present, is the hero image; without
 * it we fall back to the regular gamer portrait, framed.
 */
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
