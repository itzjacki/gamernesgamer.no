import SectionLabel from './SectionLabel';
import type { CareerHero } from '@/lib/results/view-models';

interface Props {
  hero: CareerHero;
}

/**
 * The player-career nameplate. Structurally mirrors ChampionHero (full-width
 * VERKSTED band, solid bg, hairline border, no shadow/radius; name in Neue
 * Montreal 800, mono nickname sub-line), but with ONE deliberate difference:
 * the single accent hairline is drawn for EVERY player, not just champions.
 *
 * Rationale (owner decision): a career page shows one player with nothing to
 * compare against, so champion-gating the accent would read as unexplained
 * flatness. Here the accent is the identity treatment, not a ranking signal —
 * so it is intentionally unconditional. This is the documented exception to the
 * site-wide "accent at rest = champion/P1 only" rule.
 *
 * Image: when `heroImageIsFallback` is true we're showing square-ish card art,
 * so it sits framed (like ChampionHero's fallback) rather than bleeding to the
 * panel edge; a dedicated hero portrait (when one exists) fills the panel.
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
