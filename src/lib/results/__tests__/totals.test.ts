import { describe, it, expect } from 'vitest';
import { deriveArchiveTotals } from '../derive/totals';
import type {
  GameMatch,
  GamePlacementRow,
  GameSummary,
  PlayerRef,
  PowerUpUseEntry,
  SeasonView,
} from '../view-models';

const ref = (slug: string): PlayerRef => ({
  seasonPlayerId: `sp-${slug}`,
  slug,
  name: slug,
});

const row = (slug: string, uses: PowerUpUseEntry[] = []): GamePlacementRow => ({
  player: ref(slug),
  placement: 1,
  ladderPoints: 0,
  powerUpDelta: 0,
  points: 0,
  powerUpUses: uses,
  note: null,
});

const match: GameMatch = {
  playerA: ref('a'),
  playerB: ref('b'),
  bestOf: 1,
  winsA: 1,
  winsB: 0,
  slotId: null,
};

const use = (isCurse = false): PowerUpUseEntry => ({
  slug: 'x',
  isCurse,
  pointsDelta: 0,
});

const game = (
  results: GamePlacementRow[],
  matches: GameMatch[] = [],
): GameSummary => ({ slug: 'g', ordinal: 1, results, matches });

const season = (games: GameSummary[], crowned: boolean): SeasonView => ({
  seasonNumber: 1,
  seasonSlug: '01',
  players: [],
  standings: crowned
    ? [
        {
          player: ref('a'),
          placement: 1,
          totalPoints: 0,
          isChampion: true,
          note: null,
        },
      ]
    : [],
  games,
  series: [],
});

describe('deriveArchiveTotals', () => {
  it('is all zeros with no seasons', () => {
    expect(deriveArchiveTotals([])).toEqual({
      seasons: 0,
      games: 0,
      matches: 0,
      powerUpsFired: 0,
    });
  });

  it('counts crowned seasons, played games, decided matches and every use', () => {
    const totals = deriveArchiveTotals([
      season(
        [
          game([row('a', [use(), use(true)]), row('b', [use()])], [match]),
          game([row('a')], [match, match]),
          game([]), // not played yet: not counted
        ],
        true,
      ),
      // A season under way: its played game counts, the season does not.
      season([game([row('a', [use()])])], false),
    ]);

    expect(totals).toEqual({
      seasons: 1,
      games: 3,
      matches: 3,
      powerUpsFired: 4,
    });
  });
});
