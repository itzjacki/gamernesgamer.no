import { seasonData, type Season } from '@/data/sesong';
import type { CardData } from '@/types/card';

/**
 * A season's cards: a SPILLER card for every gamer with stats, in roster
 * order, then the season's special cards from its `cards.ts`, numbered on
 * past the roster.
 */
export function seasonCards(season: Season): CardData[] {
  const { gamers, cards } = seasonData[season];

  const base: CardData[] = gamers.flatMap((g, i) =>
    g.stats
      ? [
          {
            type: 'spiller' as const,
            season,
            number: i + 1,
            of: gamers.length,
            name: g.name,
            nickname: g.nickname,
            imagePath: g.imagePath,
            stats: g.stats,
          },
        ]
      : [],
  );

  const special: CardData[] = cards.map((c, i) => {
    const gamer = gamers.find((g) => g.name === c.gamer);
    const stats = c.stats ?? gamer?.stats;
    if (!gamer || !stats) {
      throw new Error(`Card ${c.type} in S${season}: no gamer "${c.gamer}"`);
    }
    return {
      type: c.type,
      season,
      // Overnumbered: a MESTER card counts on past the roster (05/04).
      number: gamers.length + i + 1,
      of: gamers.length,
      name: gamer.name,
      nickname: gamer.nickname,
      imagePath: gamer.imagePath,
      stats,
      points: c.points,
    };
  });

  return [...base, ...special];
}
