import type { CardType } from '@/types/card';

/**
 * The family system: every card shares Card's chassis (format, border,
 * layout, stats, serial, back, tilt). A type may change only these slots. A
 * type that needs more is a new chassis, decided on purpose.
 */
export interface CardTypeSkin {
  /** The serial's middle part: `GG-04 · S · 01/04`. */
  code: string;
  /**
   * How much of the card the foil covers, read as rarity: the small silver
   * logo only, or also an etched texture over the whole face.
   */
  foil: 'mark' | 'texture';
  /** Full art: the print runs to the edge, with no black border. */
  bleed: boolean;
  stock: 'black' | 'red';
  /** The overall's ink. */
  ink: 'accent' | 'silver';
}

export const CARD_TYPES: Record<CardType, CardTypeSkin> = {
  spiller: {
    code: 'S',
    foil: 'mark',
    bleed: false,
    stock: 'black',
    ink: 'accent',
  },
  mester: {
    code: 'M',
    foil: 'texture',
    bleed: true,
    stock: 'red',
    ink: 'silver',
  },
};
