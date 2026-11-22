import { describe, expect, it } from 'vitest';
import { seasonData, type Season } from '@/data/sesong';

// cards.ts is hand-written per season; these catch the slips a reader
// wouldn't: a card for someone who didn't play, or a broken serial.
describe.each(Object.keys(seasonData) as Season[])('S%s cards.ts', (season) => {
  const { gamers, cards } = seasonData[season];
  const names = new Set(gamers.map((g) => g.name));
  const spiller = cards.filter((c) => c.type === 'spiller');
  const regular = cards.filter((c) => !c.overnumbered);

  it('only has cards for gamers in gamers.ts', () => {
    for (const card of cards) expect(names).toContain(card.name);
  });

  it('numbers the cards 1..n in order, overnumbered cards last', () => {
    expect(cards.map((c) => c.number)).toEqual(cards.map((_, i) => i + 1));
    expect(cards.slice(0, regular.length)).toEqual(regular);
  });

  it('gives each gamer at most one SPILLER card', () => {
    const spillerNames = spiller.map((c) => c.name);
    expect(new Set(spillerNames).size).toBe(spillerNames.length);
  });
});
