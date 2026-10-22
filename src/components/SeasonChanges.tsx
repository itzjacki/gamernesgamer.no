import Link from 'next/link';
import SectionLabel from './SectionLabel';
import { getSeasonChanges } from '@/lib/results/queries';
import { RECORD_PLATES } from '@/lib/record-plates';
import type { HolderChangeKind, RecordEntry } from '@/lib/results/view-models';
import { MIN_RANKED_GAMES } from '@/lib/tag-ranking';

/**
 * The front page's state slot while just crowned: the records the latest
 * finished season beat or improved. Not a copy of /records: one row per
 * record, label + kind + before and after, each linking to its plate. Career
 * totals only appear when their holder changes (see `diffRecords`).
 *
 * Only `taken` and `improved` are shown (Jakob, 2026-10-23): new, tied and
 * untied records, board movement and category crowns are left out to keep
 * the list short; `diffRecords` still reports them all.
 *
 * A `SectionLabel` heading above one frame, opened by a header row with the
 * column labels; beaten records come before improved ones. From `sm` up every row is one 40px
 * grid cell tall and the columns split the 20-cell content width 6/4/5/5;
 * on phones a row is two lines, label + kind over before → after.
 *
 * Calm on purpose — the just-crowned hero already carries the red: figures
 * are neutral, accent only on the kind tag of a beaten record.
 *
 * Renders nothing when there is no finished season with one before it to
 * compare against; a quiet season gets one row saying so.
 */

// TODO(copy): placeholder kind labels — Jakob writes these.
const KIND: Partial<Record<HolderChangeKind, string>> = {
  taken: '[slått]',
  improved: '[forbedret]',
};

/** The kinds shown, in row order; within a kind, the diff's order holds. */
const SHOWN: HolderChangeKind[] = ['taken', 'improved'];

/** "Jørgen, Tobias" for shared holders; a pair record names both halves. */
const holderNames = (entries: RecordEntry[]) =>
  entries
    .map((e) =>
      e.partner ? `${e.player.name} – ${e.partner.name}` : e.player.name,
    )
    .join(', ');

/** Phones: two lines (label + kind, before + after). `sm`: one 40px row. */
const row =
  'grid grid-cols-2 items-baseline gap-y-1 px-4 py-2.5 sm:h-10 sm:grid-cols-[30%_20%_25%_25%] sm:items-center sm:px-0 sm:py-0';
/** A cell of the one-line layout: padded, clipped to its column. */
const cell = 'min-w-0 truncate sm:px-4';
const eyebrow =
  'text-text-muted font-mono text-xs tracking-wide uppercase sm:tracking-widest';
const labelLink =
  'text-text hover:text-accent focus-visible:outline-accent underline underline-offset-2 transition-colors duration-150 focus-visible:outline-2 focus-visible:outline-offset-2';
const mono = 'font-mono text-sm tabular-nums';

/** The header row: the column labels. */
function Head() {
  return (
    <li className={`${row} ${eyebrow}`}>
      {/* TODO(copy): placeholder column labels. */}
      <span className={`${cell} col-span-2`}>[Rekord]</span>
      <span className={`${cell} hidden sm:block`}>[Før]</span>
      <span className={`${cell} hidden sm:block`}>[Etter]</span>
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

/** One side of a change: who held it, and the figure (when there is one). */
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
      {/* TODO(copy): placeholder heading. */}
      <SectionLabel as='h2'>{`[Hva S${season.seasonNumber} endret]`}</SectionLabel>

      <ul className='border-border bg-bg divide-border divide-y border'>
        {quiet && (
          <li className={`${row} ${eyebrow} normal-case`}>
            {/* TODO(copy): placeholder for a season that changed nothing. */}
            <span className={`${cell} col-span-2 sm:col-span-4`}>
              [Ingen rekorder endret]
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
