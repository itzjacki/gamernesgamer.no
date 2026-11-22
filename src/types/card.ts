import type { GamerStats } from './gamer';

/** The type code in a card's serial (`GG-04 / SPILLER / 03`). */
export type CardType = 'spiller' | 'mester';

/**
 * A card beyond the base SPILLER card every gamer gets. Fully formed here, by
 * hand: cards never read results from the DB, so a MESTER card's points
 * duplicate the season's result on purpose.
 */
export interface SpecialCard {
  type: 'mester';
  /** Joins to `Gamer.name` in the same season. */
  gamer: string;
  points: number;
  /** Replaces the base card's stats, e.g. for an upgraded variant. */
  stats?: GamerStats;
}

/** Everything one card face shows. */
export interface CardData {
  type: CardType;
  /** Zero-padded season slug, e.g. "04". */
  season: string;
  /** 1-based; special cards are numbered past `of`, the roster size. */
  number: number;
  of: number;
  name: string;
  nickname: string;
  imagePath: string;
  stats: GamerStats;
  /** MESTER only. Not printed; kept for a hidden spot later. */
  points?: number;
}
