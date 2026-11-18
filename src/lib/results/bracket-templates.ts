import type { BracketKind } from './view-models';

/**
 * The fixed bracket of each stage kind, for 4 players. The DB stores only a
 * match's `slot_id`; which slot feeds which is this static wiring (there is no
 * feeds_into column). A new roster size needs its own templates.
 *
 * Positions are in layout units: `col` is a plate column, `row` a 20px row
 * (a plate is 5 rows: its slot strip and two 40px player rows). Desktop draws
 * the whole bracket on one grid; on phones a double-elim bracket is split
 * into its sections, each with its own `mobile` grid.
 */

export type SlotId =
  | 'SF1'
  | 'SF2'
  | 'F'
  | 'BR'
  | 'WB-SF1'
  | 'WB-SF2'
  | 'WB-F'
  | 'LB-R1'
  | 'LB-F'
  | 'GF'
  | 'GF2';

export type BracketSection = 'upper' | 'lower' | 'final';

export interface SlotPosition {
  col: number;
  row: number;
}

export interface SlotTemplate {
  id: SlotId;
  section: BracketSection;
  /** Drawn as a connector. Losers' routes are not drawn. */
  winnerTo: SlotId | null;
  desktop: SlotPosition;
  /** Only where the mobile layout differs (double-elim, by section). */
  mobile?: SlotPosition;
}

export interface BracketTemplate {
  slots: readonly SlotTemplate[];
  /** Phones split the bracket into sections; otherwise the desktop grid is used. */
  splitOnMobile: boolean;
}

const doubleElim = (reset: boolean): BracketTemplate => ({
  splitOnMobile: true,
  slots: [
    {
      id: 'WB-SF1',
      section: 'upper',
      winnerTo: 'WB-F',
      desktop: { col: 0, row: 0 },
      mobile: { col: 0, row: 0 },
    },
    {
      id: 'WB-SF2',
      section: 'upper',
      winnerTo: 'WB-F',
      desktop: { col: 0, row: 6 },
      mobile: { col: 0, row: 6 },
    },
    {
      id: 'WB-F',
      section: 'upper',
      winnerTo: 'GF',
      desktop: { col: 1, row: 3 },
      mobile: { col: 1, row: 3 },
    },
    {
      id: 'LB-R1',
      section: 'lower',
      winnerTo: 'LB-F',
      desktop: { col: 1, row: 12 },
      mobile: { col: 0, row: 0 },
    },
    {
      id: 'LB-F',
      section: 'lower',
      winnerTo: 'GF',
      desktop: { col: 2, row: 12 },
      mobile: { col: 1, row: 0 },
    },
    {
      id: 'GF',
      section: 'final',
      winnerTo: reset ? 'GF2' : null,
      desktop: { col: 3, row: 8 },
      mobile: { col: 0, row: 0 },
    },
    ...(reset
      ? [
          {
            id: 'GF2' as const,
            section: 'final' as const,
            winnerTo: null,
            desktop: { col: 4, row: 8 },
            mobile: { col: 1, row: 0 },
          },
        ]
      : []),
  ],
});

export const BRACKET_TEMPLATES: Record<BracketKind, BracketTemplate> = {
  'single-elim': {
    splitOnMobile: false,
    slots: [
      {
        id: 'SF1',
        section: 'upper',
        winnerTo: 'F',
        desktop: { col: 0, row: 0 },
      },
      {
        id: 'SF2',
        section: 'upper',
        winnerTo: 'F',
        desktop: { col: 0, row: 6 },
      },
      {
        id: 'F',
        section: 'final',
        winnerTo: null,
        desktop: { col: 1, row: 3 },
      },
      // Fed by the semi-final losers, so no connector.
      {
        id: 'BR',
        section: 'final',
        winnerTo: null,
        desktop: { col: 1, row: 10 },
      },
    ],
  },
  // The finalists come from an earlier stage, so nothing is wired.
  'final-bronze': {
    splitOnMobile: false,
    slots: [
      {
        id: 'F',
        section: 'final',
        winnerTo: null,
        desktop: { col: 0, row: 0 },
      },
      {
        id: 'BR',
        section: 'final',
        winnerTo: null,
        desktop: { col: 1, row: 0 },
      },
    ],
  },
  'double-elim-reset': doubleElim(true),
  'double-elim-no-reset': doubleElim(false),
};

/** The decisive slot: its winner takes the stage. GF2 only when played. */
export function deciderSlot(
  kind: BracketKind,
  played: ReadonlySet<SlotId>,
): SlotId {
  if (kind === 'single-elim' || kind === 'final-bronze') return 'F';
  return played.has('GF2') ? 'GF2' : 'GF';
}
