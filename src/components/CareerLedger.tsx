import SectionLabel from './SectionLabel';
import { tagLabels } from '@/data/tag-labels';
import type {
  CareerLedger as CareerLedgerData,
  TagStat,
} from '@/lib/results/view-models';
import { splitRanked } from '@/lib/tag-ranking';
import type { Tag } from '@/types/tag';

/** No accent here: a career aggregate holds no rank-1 datum. */

interface Props {
  ledger: CareerLedgerData;
  /** Best first. */
  tagStats: TagStat<Tag>[];
}

/** `word`: display face, for the one cell that holds a name. */
function Stat({
  label,
  value,
  big = false,
  wide = false,
  word = false,
}: {
  label: string;
  value: React.ReactNode;
  big?: boolean;
  wide?: boolean;
  word?: boolean;
}) {
  const valueClass = word
    ? 'text-xl font-semibold wrap-break-word hyphens-auto sm:text-2xl'
    : `font-mono tabular-nums ${big ? 'text-5xl sm:text-6xl' : 'text-3xl'}`;

  return (
    <div
      className={`bg-bg flex flex-col justify-between gap-3 p-5 ${wide ? 'col-span-2' : ''}`}
    >
      <SectionLabel>{label}</SectionLabel>
      <span className={`text-text ${valueClass}`}>{value}</span>
    </div>
  );
}

export default function CareerLedger({ ledger, tagStats }: Props) {
  const singleSeason = ledger.bestSeasonNumber === ledger.worstSeasonNumber;
  const bestTag = splitRanked(tagStats).ranked[0];

  return (
    // A `bg-border` surface with a 1px gap draws single hairlines between the
    // cells, with no doubled borders.
    <div className='border-border bg-border grid grid-cols-2 gap-px border sm:grid-cols-4'>
      <Stat
        label='Snittplassering (per hele sesong)'
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

      <Stat
        label='Beste kategori'
        value={bestTag ? tagLabels[bestTag.tag] : '–'}
        word
      />
      <Stat
        label='Snittplassering (per spill)'
        value={ledger.averageGamePlacement.toFixed(1)}
      />
    </div>
  );
}
