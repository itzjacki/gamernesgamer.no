import { describe, it, expect } from 'vitest';
import { assembleSeasonView } from '../derive';
import { composeSeasonView } from '../compose';
import { derivePowerUpImpact } from '../power-up-impact';
import { s1Bundle } from './s1.fixtures';
import { s2Bundle } from './s2.fixtures';

describe('derivePowerUpImpact', () => {
  it('splits each S2 total into base and power-up points', () => {
    const rows = derivePowerUpImpact(
      composeSeasonView(assembleSeasonView(s2Bundle)),
    )!;
    expect(
      rows.map((r) => [
        r.player.slug,
        r.basePoints,
        r.powerUpPoints,
        r.totalPoints,
      ]),
    ).toEqual([
      ['tobias', 34, 5, 39],
      // Level on base points: standings order holds.
      ['jorgen', 26, 6, 32],
      ['jakob', 26, 6, 32],
      ['william', 26, 4, 30],
    ]);
  });

  it('is null for a season without power-ups (S1)', () => {
    expect(
      derivePowerUpImpact(composeSeasonView(assembleSeasonView(s1Bundle))),
    ).toBeNull();
  });
});
