import {
  BRACKET_TEMPLATES,
  type BracketSection,
} from '@/lib/results/bracket-templates';
import type {
  BracketKind,
  BracketStageView,
  SlotId,
  StageMatch,
} from '@/lib/results/view-models';
import { gameLines, sideFigures } from './match-figures';
import Popover from './Popover';
import RecordLines from './RecordLines';
import SectionLabel from './SectionLabel';

/**
 * A drawn bracket. Plates sit on a CSS grid of plate and gutter columns
 * (5fr / 1fr) and 20px rows, so the 40px player rows stay on the page grid;
 * the connectors are one SVG over it in the same units. Only winners' routes
 * are drawn: the losers' would cross everything, and the slot names say it.
 * On phones a double-elim bracket splits into its sections.
 */

const SLOT_LABELS: Record<SlotId, string> = {
  SF1: 'Semifinale 1',
  SF2: 'Semifinale 2',
  F: 'Finale',
  BR: 'Bronsefinale',
  'WB-SF1': 'Semifinale 1',
  'WB-SF2': 'Semifinale 2',
  'WB-F': 'Vinnerfinale',
  'LB-R1': 'Taperrunde',
  'LB-F': 'Taperfinale',
  GF: 'Finale',
  GF2: 'Finale (omspill)',
};

const SECTION_LABELS = {
  upper: 'Vinnerside',
  lower: 'Taperside',
  final: 'Finale',
} satisfies Record<BracketSection, string>;

/* Geometry, in grid units: fr for columns, 20px rows. */
const PLATE = 5;
const GUTTER = 1;
const ROW_PX = 20;
/** The slot strip above a plate. */
const STRIP_ROWS = 1;
/** Two 40px player rows. */
const BODY_ROWS = 4;
const PLATE_ROWS = STRIP_ROWS + BODY_ROWS;

/** `col` is a plate column, `row` the 20px row the plate's strip starts on. */
type Layout = Partial<Record<SlotId, { col: number; row: number }>>;

const DOUBLE_ELIM: Layout = {
  'WB-SF1': { col: 0, row: 0 },
  'WB-SF2': { col: 0, row: 6 },
  'WB-F': { col: 1, row: 3 },
  'LB-R1': { col: 1, row: 12 },
  'LB-F': { col: 2, row: 12 },
  GF: { col: 3, row: 8 },
  GF2: { col: 4, row: 8 },
};

const DESKTOP: Record<BracketKind, Layout> = {
  'single-elim': {
    SF1: { col: 0, row: 0 },
    SF2: { col: 0, row: 6 },
    F: { col: 1, row: 3 },
    BR: { col: 1, row: 10 },
  },
  'final-bronze': {
    F: { col: 0, row: 0 },
    BR: { col: 1, row: 0 },
  },
  'double-elim-reset': DOUBLE_ELIM,
  'double-elim-no-reset': DOUBLE_ELIM,
};

/** Phones: a double-elim bracket's sections, each on its own grid. */
const DOUBLE_ELIM_MOBILE: Layout = {
  'WB-SF1': { col: 0, row: 0 },
  'WB-SF2': { col: 0, row: 6 },
  'WB-F': { col: 1, row: 3 },
  'LB-R1': { col: 0, row: 0 },
  'LB-F': { col: 1, row: 0 },
  GF: { col: 0, row: 0 },
  GF2: { col: 1, row: 0 },
};

interface Placed {
  id: SlotId;
  section: BracketSection;
  winnerTo: SlotId | null;
  col: number;
  row: number;
  match: StageMatch | null;
}

interface Props {
  /** Namespaces popover ids. */
  id: string;
  stage: BracketStageView;
}

export default function Bracket({ id, stage }: Props) {
  const matchBySlot = new Map(stage.slots.map((s) => [s.slotId, s.match]));
  const place = (layout: Layout): Placed[] =>
    BRACKET_TEMPLATES[stage.kind].map((slot) => ({
      ...slot,
      ...layout[slot.id]!,
      match: matchBySlot.get(slot.id) ?? null,
    }));
  const desktop = place(DESKTOP[stage.kind]);

  if (stage.kind === 'single-elim' || stage.kind === 'final-bronze') {
    return <BracketGrid id={id} slots={desktop} decider={stage.decider} />;
  }

  const mobile = place(DOUBLE_ELIM_MOBILE);
  const sections: BracketSection[] = ['upper', 'lower', 'final'];
  return (
    <>
      <div className='hidden md:block'>
        <BracketGrid id={`${id}-d`} slots={desktop} decider={stage.decider} />
      </div>
      <div className='flex flex-col gap-10 md:hidden'>
        {sections.map((section) => (
          <div key={section} className='flex flex-col gap-6'>
            <SectionLabel>{SECTION_LABELS[section]}</SectionLabel>
            <BracketGrid
              id={`${id}-m-${section}`}
              slots={mobile.filter((s) => s.section === section)}
              decider={stage.decider}
            />
          </div>
        ))}
      </div>
    </>
  );
}

function BracketGrid({
  id,
  slots,
  decider,
}: {
  id: string;
  slots: Placed[];
  decider: SlotId;
}) {
  const cols = Math.max(...slots.map((s) => s.col)) + 1;
  const lastRow = Math.max(...slots.map((s) => s.row)) + PLATE_ROWS;
  // Whole 40px cells.
  const rows = lastRow + (lastRow % 2);
  const width = cols * PLATE + (cols - 1) * GUTTER;

  const left = (col: number) => col * (PLATE + GUTTER);
  const centre = (s: Placed) => (s.row + STRIP_ROWS + BODY_ROWS / 2) * ROW_PX;
  const bySlot = new Map(slots.map((s) => [s.id, s]));

  const paths = slots.flatMap((slot) => {
    const target = slot.winnerTo && bySlot.get(slot.winnerTo);
    if (!target) return [];
    const bend = left(target.col) - GUTTER / 2;
    return [
      `M ${left(slot.col) + PLATE} ${centre(slot)} H ${bend} V ${centre(target)} H ${left(target.col)}`,
    ];
  });

  return (
    <div className='relative'>
      <svg
        aria-hidden='true'
        className='text-text-muted pointer-events-none absolute inset-0 h-full w-full'
        viewBox={`0 0 ${width} ${rows * ROW_PX}`}
        preserveAspectRatio='none'
      >
        {paths.map((d) => (
          <path
            key={d}
            d={d}
            fill='none'
            stroke='currentColor'
            strokeWidth={1}
            vectorEffect='non-scaling-stroke'
          />
        ))}
      </svg>
      <ol
        className='relative grid'
        style={{
          gridTemplateColumns: Array.from(
            { length: cols },
            () => `${PLATE}fr`,
          ).join(` ${GUTTER}fr `),
          gridTemplateRows: `repeat(${rows}, ${ROW_PX}px)`,
        }}
      >
        {slots.map((slot) => (
          <li
            key={slot.id}
            style={{
              gridColumn: slot.col * 2 + 1,
              gridRow: `${slot.row + 1} / span ${PLATE_ROWS}`,
            }}
          >
            <Plate
              id={`${id}-${slot.id}`}
              slotId={slot.id}
              match={slot.match}
              decides={slot.id === decider}
            />
          </li>
        ))}
      </ol>
    </div>
  );
}

function Plate({
  id,
  slotId,
  match,
  decides,
}: {
  id: string;
  slotId: SlotId;
  match: StageMatch | null;
  decides: boolean;
}) {
  const label = SLOT_LABELS[slotId];

  return (
    <div>
      <p
        className='text-text-muted flex items-start justify-between gap-2 font-mono text-[10px] leading-none tracking-wide uppercase sm:tracking-widest'
        style={{ height: STRIP_ROWS * ROW_PX }}
      >
        <span className='truncate'>{label}</span>
        {match?.score?.byTiebreak && <span>Tiebreak</span>}
      </p>
      <div
        className={`bg-bg grid grid-cols-[1fr_2.5rem] grid-rows-2 border ${
          decides ? 'border-border-accent' : 'border-border'
        }`}
        style={{ height: BODY_ROWS * ROW_PX }}
      >
        {match ? (
          <>
            <PlateRow
              id={id}
              label={label}
              match={match}
              side='a'
              decides={decides}
            />
            <PlateRow
              id={id}
              label={label}
              match={match}
              side='b'
              decides={decides}
            />
          </>
        ) : (
          <span className='text-text-muted col-span-2 row-span-2 grid place-items-center font-mono text-xs tracking-wide uppercase sm:tracking-widest'>
            Ikke spilt
          </span>
        )}
      </div>
    </div>
  );
}

function PlateRow({
  id,
  label,
  match,
  side,
  decides,
}: {
  id: string;
  label: string;
  match: StageMatch;
  side: 'a' | 'b';
  decides: boolean;
}) {
  const won = match.winner === side;
  const name = side === 'a' ? match.playerA.name : match.playerB.name;
  const figure = sideFigures(match)[side];
  const rule = side === 'a' ? 'border-border border-b' : '';
  const figureTone = !won
    ? 'text-text-muted'
    : decides
      ? 'text-text-accent font-medium'
      : 'text-text font-medium';

  return (
    <>
      <span
        className={`flex min-w-0 items-center px-3 text-sm ${rule} ${
          won ? 'text-text font-semibold' : 'text-text-muted'
        }`}
      >
        <span className='truncate'>{name}</span>
      </span>
      <span
        className={`border-border relative flex items-center justify-center border-l font-mono text-sm tabular-nums ${rule} ${figureTone}`}
      >
        {won && match.games ? (
          <Popover
            id={id}
            label={`${label}, vis hver match`}
            tone={decides ? 'accent' : 'word'}
            panel={<RecordLines lines={gameLines(match, 'Match')} />}
          >
            {figure}
          </Popover>
        ) : (
          figure
        )}
      </span>
    </>
  );
}
