import Link from 'next/link';
import SectionLabel from './SectionLabel';
import { getSeasonChanges } from '@/lib/results/queries';
import { RECORD_PLATES } from '@/lib/record-plates';
import type { HolderChangeKind, RecordEntry } from '@/lib/results/view-models';
import { MIN_RANKED_GAMES } from '@/lib/tag-ranking';

/**
 * The records the latest finished season beat or improved. Only `taken` and
 * `improved` are shown to keep the list short; `diffRecords` reports more.
 * Calm on purpose, since the just-crowned hero carries the red: accent only
 * on a beaten record's kind tag.
 */

const KIND: Partial<Record<HolderChangeKind, string>> = {
  taken: 'Slått',
  improved: 'Forbedret',
};

/** Row order; within a kind, the diff's order holds. */
const SHOWN: HolderChangeKind[] = ['taken', 'improved'];

const holderNames = (entries: RecordEntry[]) =>
  entries
    .map((e) =>
      e.partner ? `${e.player.name} – ${e.partner.name}` : e.player.name,
    )
    .join(', ');

const row =
  'grid grid-cols-2 items-baseline gap-y-1 px-4 py-2.5 sm:h-10 sm:grid-cols-[30%_20%_25%_25%] sm:items-center sm:px-0 sm:py-0';
const cell = 'min-w-0 truncate sm:px-4';
const eyebrow =
  'text-text-muted font-mono text-xs tracking-wide uppercase sm:tracking-widest';
const labelLink =
  'text-text hover:text-accent focus-visible:outline-accent underline underline-offset-2 transition-colors duration-150 focus-visible:outline-2 focus-visible:outline-offset-2';
const mono = 'font-mono text-sm tabular-nums';

function Head() {
  return (
    <li className={`${row} ${eyebrow}`}>
      <span className={`${cell} col-span-2`}>Rekord</span>
      <span className={`${cell} hidden sm:block`}>Før</span>
      <span className={`${cell} hidden sm:block`}>Etter</span>
    </li>
  );
}

function Kind({ kind }: { kind: HolderChangeKind }) {
  return (
    <span
      className={`${cell} text-right font-mono text-xs tracking-wide uppercase sm:text-left ${
        kind === 'taken' ? 'text-accent' : 'text-text-muted'
      }`}
    >
      {KIND[kind]}
    </span>
  );
}

function Side({
  when,
  names,
  figure,
}: {
  when: 'before' | 'after';
  names: string;
  figure?: React.ReactNode;
}) {
  const after = when === 'after';
  return (
    <span
      className={`${cell} ${
        after ? 'text-text text-right sm:text-left' : 'text-text-muted'
      }`}
    >
      <span className='sr-only'>{after ? 'Nå: ' : 'Før: '}</span>
      {after && (
        <span aria-hidden className='text-text-muted mr-2 sm:hidden'>
          →
        </span>
      )}
      {names}
      {figure !== undefined && (
        <span
          className={`${mono} ${names ? 'ml-2' : ''} ${after ? 'font-medium' : ''}`}
        >
          {figure}
        </span>
      )}
    </span>
  );
}

export default async function SeasonChanges() {
  const changes = await getSeasonChanges({ minCrownGames: MIN_RANKED_GAMES });
  if (!changes) return null;

  const { season } = changes;
  // Beaten means the figure moved: a rate record can change hands downward.
  const records = SHOWN.flatMap((kind) =>
    changes.records.filter((change) => change.kind === kind && change.better),
  );
  const quiet = records.length === 0;

  return (
    <section className='flex flex-col gap-6'>
      <SectionLabel as='h2'>{`Rekorder slått i sesong ${season.seasonNumber}`}</SectionLabel>

      <ul className='border-border bg-bg divide-border divide-y border'>
        {quiet && (
          <li className={`${row} ${eyebrow} normal-case`}>
            <span className={`${cell} col-span-2 sm:col-span-4`}>
              Ingen rekorder slått
            </span>
          </li>
        )}

        {!quiet && <Head />}
        {records.map((change) => {
          const { id, label, figure } = RECORD_PLATES[change.key];
          const was = change.before[0];
          return (
            <li key={change.key} className={row}>
              <span className={cell}>
                <Link href={`/records#${id}`} className={labelLink}>
                  {label}
                </Link>
              </span>
              <Kind kind={change.kind} />
              <Side
                when='before'
                names={was ? holderNames(change.before) : '–'}
                figure={was && figure(was)}
              />
              <Side
                when='after'
                names={holderNames(change.after)}
                figure={figure(change.after[0])}
              />
            </li>
          );
        })}
      </ul>
    </section>
  );
}
