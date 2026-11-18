import {
  BRACKET_TEMPLATES,
  deciderSlot,
  type BracketSection,
  type SlotId,
  type SlotPosition,
} from '@/lib/results/bracket-templates';
import type { BracketStageView, StageMatch } from '@/lib/results/view-models';
import { gameLines, settledByTiebreak, sideFigures } from '@/lib/match-figures';
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

// TODO(copy): placeholder labels.
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
  GF: 'Storfinale',
  GF2: 'Storfinale 2',
};

// TODO(copy): placeholder labels.
const LABELS = {
  sections: {
    upper: 'Vinnerside',
    lower: 'Taperside',
    final: 'Finale',
  } satisfies Record<BracketSection, string>,
  notPlayed: 'Ikke spilt',
  tiebreak: 'TB',
  game: 'Kamp',
};

const PLATE = 5;
const GUTTER = 1;
const ROW_PX = 20;
/** A plate's height in rows: the slot strip and two 40px player rows. */
const PLATE_ROWS = 5;

interface Placed {
  id: SlotId;
  winnerTo: SlotId | null;
  pos: SlotPosition;
  match: StageMatch | null;
}

interface Props {
  /** Namespaces popover ids. */
  id: string;
  stage: BracketStageView;
}

export default function Bracket({ id, stage }: Props) {
  const template = BRACKET_TEMPLATES[stage.kind];
  const matchBySlot = new Map(stage.slots.map((s) => [s.slotId, s.match]));
  const played = new Set(
    stage.slots.filter((s) => s.match !== null).map((s) => s.slotId),
  );
  const decider = deciderSlot(stage.kind, played);

  const placed = (mobile: boolean) =>
    template.slots.map((slot) => ({
      id: slot.id,
      winnerTo: slot.winnerTo,
      pos: (mobile && slot.mobile) || slot.desktop,
      match: matchBySlot.get(slot.id) ?? null,
    }));

  if (!template.splitOnMobile) {
    return <BracketGrid id={id} slots={placed(false)} decider={decider} />;
  }

  const sections: BracketSection[] = ['upper', 'lower', 'final'];
  const mobile = placed(true);
  return (
    <>
      <div className='hidden md:block'>
        <BracketGrid id={`${id}-d`} slots={placed(false)} decider={decider} />
      </div>
      <div className='flex flex-col gap-10 md:hidden'>
        {sections.map((section) => {
          const ids = new Set(
            template.slots
              .filter((s) => s.section === section)
              .map((s) => s.id),
          );
          return (
            <div key={section} className='flex flex-col gap-6'>
              <SectionLabel>{LABELS.sections[section]}</SectionLabel>
              <BracketGrid
                id={`${id}-m-${section}`}
                slots={mobile.filter((s) => ids.has(s.id))}
                decider={decider}
              />
            </div>
          );
        })}
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
  const cols = Math.max(...slots.map((s) => s.pos.col)) + 1;
  const lastRow = Math.max(...slots.map((s) => s.pos.row)) + PLATE_ROWS;
  // Whole 40px cells.
  const rows = lastRow + (lastRow % 2);
  const width = cols * PLATE + (cols - 1) * GUTTER;
  const height = rows * ROW_PX;

  const left = (col: number) => col * (PLATE + GUTTER);
  const right = (col: number) => left(col) + PLATE;
  const centre = (pos: SlotPosition) => (pos.row + 1 + 2) * ROW_PX;
  const bySlot = new Map(slots.map((s) => [s.id, s]));

  const paths = slots.flatMap((slot) => {
    const target = slot.winnerTo ? bySlot.get(slot.winnerTo) : undefined;
    if (!target) return [];
    const bend = left(target.pos.col) - GUTTER / 2;
    return [
      `M ${right(slot.pos.col)} ${centre(slot.pos)} H ${bend} V ${centre(target.pos)} H ${left(target.pos.col)}`,
    ];
  });

  return (
    <div className='relative'>
      <svg
        aria-hidden='true'
        className='text-text-muted pointer-events-none absolute inset-0 h-full w-full'
        viewBox={`0 0 ${width} ${height}`}
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
              gridColumn: slot.pos.col * 2 + 1,
              gridRow: `${slot.pos.row + 1} / span ${PLATE_ROWS}`,
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
  const strip =
    'text-text-muted flex h-5 items-start justify-between gap-2 font-mono text-[10px] leading-none tracking-widest uppercase';
  const frame = `bg-bg border ${decides ? 'border-border-accent' : 'border-border'}`;

  if (!match) {
    return (
      <div>
        <p className={strip}>
          <span className='truncate'>{label}</span>
        </p>
        <div
          className={`${frame} text-text-muted grid h-20 place-items-center font-mono text-xs tracking-widest uppercase`}
        >
          {LABELS.notPlayed}
        </div>
      </div>
    );
  }

  const figures = sideFigures(match);
  const sides = [
    { side: 'a' as const, name: match.playerA.name, figure: figures.a },
    { side: 'b' as const, name: match.playerB.name, figure: figures.b },
  ];

  return (
    <div>
      <p className={strip}>
        <span className='truncate'>{label}</span>
        {settledByTiebreak(match) && <span>{LABELS.tiebreak}</span>}
      </p>
      <div className={`${frame} grid h-20 grid-cols-[1fr_2.5rem] grid-rows-2`}>
        {sides.map(({ side, name, figure }, i) => {
          const won = match.winner === side;
          const rule = i === 0 ? 'border-border border-b' : '';
          return (
            <div key={side} className='contents'>
              <span
                className={`flex items-center truncate px-3 text-sm ${rule} ${
                  won ? 'text-text font-semibold' : 'text-text-muted'
                }`}
              >
                <span className='truncate'>{name}</span>
              </span>
              <span
                className={`border-border relative flex items-center justify-center border-l font-mono text-sm tabular-nums ${rule} ${
                  won
                    ? decides
                      ? 'text-text-accent font-bold'
                      : 'text-text font-semibold'
                    : 'text-text-muted'
                }`}
              >
                {won && match.games ? (
                  <Popover
                    id={id}
                    label={`${label}, vis hver kamp`}
                    tone={decides ? 'accent' : 'word'}
                    panel={
                      <RecordLines lines={gameLines(match, LABELS.game)} />
                    }
                  >
                    {figure}
                  </Popover>
                ) : (
                  figure
                )}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
