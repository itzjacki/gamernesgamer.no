import { seasonData, type Season } from '@/data/sesong';
import type { CardData } from '@/types/card';

/** A season's cards, in `cards.ts` order, with their serial's total. */
export function seasonCards(season: Season): CardData[] {
  const { cards } = seasonData[season];
  const of = cards.filter((c) => !c.overnumbered).length;
  return cards.map((c) => ({ ...c, season, of }));
}

/** One gamer's cards in a season: their base card first, then any specials. */
export function gamerCards(season: Season, name: string): CardData[] {
  return seasonCards(season).filter((c) => c.name === name);
}
