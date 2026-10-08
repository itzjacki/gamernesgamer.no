import SectionLabel from './SectionLabel';
import type { CareerLedger as CareerLedgerData } from '@/lib/results/view-models';

/**
 * The career ledger as a motorsport INSTRUMENT PANEL, not a settings <dl>.
 *
 * The plain Panel + StatList readout (label left, small value right) reads flat
 * next to this page's trophy shelf, timing-sheet table and FIFA cards — the
 * numbers are the whole point of a career, so here they ARE the subject: each
 * figure is a large Martian Mono tabular number under a small mono eyebrow, in
 * bordered grid cells with shared hairlines (no radius, no shadow, solid bg-bg
 * masking the blueprint grid — VERKSTED surface language).
 *
 * Average placement is the headline skill stat, so it spans wider and prints
 * larger than the rest. The single accent is NOT spent here (no champion datum
 * in a career aggregate) — accent stays reserved for the hero + P1 rows.
 */

interface Props {
  ledger: CareerLedgerData;
}

/** One instrument cell: a mono eyebrow over a large tabular figure. */
function Stat({
  label,
  value,
  big = false,
  wide = false,
}: {
  label: string;
  value: React.ReactNode;
  big?: boolean;
  wide?: boolean;
}) {
  return (
    <div
      className={`bg-bg flex flex-col gap-3 p-5 ${wide ? 'sm:col-span-2' : ''}`}
    >
      <SectionLabel>{label}</SectionLabel>
      <span
        className={`text-text font-mono tabular-nums ${
          big ? 'text-5xl sm:text-6xl' : 'text-3xl'
        }`}
      >
        {value}
      </span>
    </div>
  );
}

export default function CareerLedger({ ledger }: Props) {
  const singleSeason = ledger.bestSeasonNumber === ledger.worstSeasonNumber;

  return (
    // The grid background IS the hairline grid: a `bg-border` surface with a 1px
    // gap lets single crisp rules show between the `bg-bg` cells (no doubled
    // borders), and the outer border closes the frame — aligned to the 40px
    // blueprint grid, VERKSTED surface language, no radius/shadow.
    <div className='border-border bg-border grid grid-cols-2 gap-px border sm:grid-cols-4'>
      <Stat
        label='Gjennomsnittlig plassering'
        value={ledger.averagePlacement.toFixed(1)}
        big
        wide
      />
      <Stat label='Karrierepoeng' value={ledger.careerPoints} />
      <Stat label='Sesonger spilt' value={ledger.seasonsPlayed} />

      {singleSeason ? (
        <Stat label='Sesong' value={`S${ledger.bestSeasonNumber}`} wide />
      ) : (
        <>
          <Stat label='Beste sesong' value={`S${ledger.bestSeasonNumber}`} />
          <Stat
            label='Dårligste sesong'
            value={`S${ledger.worstSeasonNumber}`}
          />
        </>
      )}
    </div>
  );
}
