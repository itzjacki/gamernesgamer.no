/** A card's printed ratings, each 50–99. */
export interface CardStats {
  overall: number;
  focus: number;
  strategy: number;
  mechanics: number;
  mental: number;
  versatility: number;
  consistency: number;
  tactics: number;
}

/** The type code in a card's serial (`GG-04 · S · 01/04`). */
export type CardType = 'spiller' | 'mester';

/**
 * A card as written in a season's `cards.ts`: fully formed by hand. Cards
 * read nothing from `gamers.ts`, other seasons or the DB, so a printed card
 * never changes when other data does.
 */
interface CardFields {
  /** 1-based: the regular cards are 1..n, overnumbered ones count on past n. */
  number: number;
  /**
   * Numbered past the season's set, like a chase card (05/04). The serial's
   * total counts only the cards that aren't.
   */
  overnumbered: boolean;
  /** Joins to `Gamer.name` in the same season. */
  name: string;
  nickname: string;
  imagePath: string;
  stats: CardStats;
}

export interface SpillerCard extends CardFields {
  type: 'spiller';
  /** The overall's change since the gamer's previous card, if any. */
  overallChange?: number;
}

export interface MesterCard extends CardFields {
  type: 'mester';
  /** The champion's season points, engraved in the etch. */
  points: number;
  /** Titles won up to and including this one, printed as stars. */
  titles: number;
}

export type SeasonCard = SpillerCard | MesterCard;

/** Everything one card face shows. */
export interface CardData {
  type: CardType;
  /** Zero-padded season slug, e.g. "04". */
  season: string;
  number: number;
  /** The season's count of cards that aren't overnumbered: the `/04`. */
  of: number;
  name: string;
  nickname: string;
  imagePath: string;
  stats: CardStats;
  overallChange?: number;
  points?: number;
  titles?: number;
}
