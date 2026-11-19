import type { BracketKind, SlotId } from './view-models';

/**
 * The fixed bracket of each stage kind, for 4 players. The DB stores only a
 * match's `slot_id`; which slot feeds which is this static wiring (there is no
 * feeds_into column). A new roster size needs its own templates. Where each
 * slot is drawn is the Bracket component's business.
 */

export type BracketSection = 'upper' | 'lower' | 'final';

export interface SlotTemplate {
  id: SlotId;
  section: BracketSection;
  /** Losers' routes are not wired: the bracket draws only winners'. */
  winnerTo: SlotId | null;
}

const GRAND_FINAL_RESET: SlotTemplate = {
  id: 'GF2',
  section: 'final',
  winnerTo: null,
};

const doubleElim = (reset: boolean): SlotTemplate[] => [
  { id: 'WB-SF1', section: 'upper', winnerTo: 'WB-F' },
  { id: 'WB-SF2', section: 'upper', winnerTo: 'WB-F' },
  { id: 'WB-F', section: 'upper', winnerTo: 'GF' },
  { id: 'LB-R1', section: 'lower', winnerTo: 'LB-F' },
  { id: 'LB-F', section: 'lower', winnerTo: 'GF' },
  { id: 'GF', section: 'final', winnerTo: reset ? 'GF2' : null },
  ...(reset ? [GRAND_FINAL_RESET] : []),
];

export const BRACKET_TEMPLATES: Record<BracketKind, readonly SlotTemplate[]> = {
  'single-elim': [
    { id: 'SF1', section: 'upper', winnerTo: 'F' },
    { id: 'SF2', section: 'upper', winnerTo: 'F' },
    { id: 'F', section: 'final', winnerTo: null },
    // Fed by the semi-final losers.
    { id: 'BR', section: 'final', winnerTo: null },
  ],
  // The finalists come from an earlier stage, so nothing is wired.
  'final-bronze': [
    { id: 'F', section: 'final', winnerTo: null },
    { id: 'BR', section: 'final', winnerTo: null },
  ],
  'double-elim-reset': doubleElim(true),
  'double-elim-no-reset': doubleElim(false),
};
