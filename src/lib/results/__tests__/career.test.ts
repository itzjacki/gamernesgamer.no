import { describe, it, expect } from 'vitest';
import { assembleCareer } from '../derive/career';
import { deriveTrophies } from '../derive/career/trophies';
import { composeCareerView } from '../compose';
import type { PlayerRef, SeasonView } from '../view-models';
import { s1Bundle } from './s1.fixtures';
import { s2Bundle } from './s2.fixtures';

/**
 * Career derivation over the verified S1 + S2 oracle. The career layer runs the
 * per-season assembler and reads its authoritative output, so these numbers are
 * tied by construction to the season tests:
 *
 *   placements   S1 & S2:   tobias 1, jorgen 2, jakob 3, william 4
 *   season totals S1:       tobias 24, jakob 20, jorgen 20, william 16
 *   season totals S2:       tobias 39, jakob 32, jorgen 32, william 30
 *   per-game golds (p1):
 *     tobias: S1 tetris/trackmania/flat-out + S2 curve-fever/wreckfest  = 5
 *     jorgen: S1 sjakk/osrs/pokemon        + S2 poker/lol               = 5
 *     william:S1 csgo                      + S2 hearthstone/warcraft    = 3
 *     jakob:  S1 skyrim                     + S2 the-sims/total-war      = 3
 */

const bundles = [s1Bundle, s2Bundle];

describe('assembleCareer — Tobias (champion both seasons)', () => {
  const career = assembleCareer(bundles, 'tobias')!;

  it('resolves identity and seasons played', () => {
    expect(career).not.toBeNull();
    expect(career.name).toBe('Tobias');
    expect(career.ledger.seasonsPlayed).toBe(2);
    expect(career.seasons.map((s) => s.seasonNumber)).toEqual([1, 2]);
  });

  it('derives career points as the sum of season totals (24 + 39)', () => {
    expect(career.ledger.careerPoints).toBe(63);
  });

  it('derives average placement 1.0 (1st both seasons)', () => {
    expect(career.ledger.averagePlacement).toBe(1);
  });

  it('awards two season-golds and five game-golds', () => {
    const kinds = career.trophies.map((t) => t.kind);
    expect(kinds.filter((k) => k === 'season-gold')).toHaveLength(2);
    expect(kinds.filter((k) => k === 'game-gold')).toHaveLength(5);
    expect(kinds.filter((k) => k === 'season-silver')).toHaveLength(0);
  });

  it('orders trophies: season trophies first, then game-golds by season/ordinal', () => {
    const kinds = career.trophies.map((t) => t.kind);
    // Two season-golds lead, then all game-golds.
    expect(kinds.slice(0, 2)).toEqual(['season-gold', 'season-gold']);
    expect(kinds.slice(2).every((k) => k === 'game-gold')).toBe(true);
    // Game-golds are season-ascending.
    const gameSeasons = career.trophies
      .filter((t) => t.kind === 'game-gold')
      .map((t) => t.seasonNumber);
    expect(gameSeasons).toEqual([...gameSeasons].sort((a, b) => a - b));
  });
});

describe('assembleCareer — placements and tiebreak', () => {
  it('derives average placement 3.0 for Jakob (3rd both seasons)', () => {
    const jakob = assembleCareer(bundles, 'jakob')!;
    expect(jakob.ledger.averagePlacement).toBe(3);
    expect(jakob.ledger.careerPoints).toBe(52); // 20 + 32
  });

  it('awards Jørgen two season-silvers (2nd both seasons) and five game-golds', () => {
    const jorgen = assembleCareer(bundles, 'jorgen')!;
    const kinds = jorgen.trophies.map((t) => t.kind);
    expect(kinds.filter((k) => k === 'season-silver')).toHaveLength(2);
    expect(kinds.filter((k) => k === 'game-gold')).toHaveLength(5);
    expect(jorgen.ledger.averagePlacement).toBe(2);
  });

  it('gives William no season podium (4th both seasons) but three game-golds', () => {
    const william = assembleCareer(bundles, 'william')!;
    const kinds = william.trophies.map((t) => t.kind);
    expect(kinds.filter((k) => k.startsWith('season-'))).toHaveLength(0);
    expect(kinds.filter((k) => k === 'game-gold')).toHaveLength(3);
    expect(william.ledger.averagePlacement).toBe(4);
  });

  it('breaks a best/worst-season placement tie on closeness (points vs field max)', () => {
    // Jakob is 3rd in BOTH seasons, so placement can't separate best from worst.
    // Closeness = player points / field-max points that season:
    //   S1: 20/24 = 0.833   S2: 32/39 = 0.821
    // S1 is closer to the leader, so best = S1, worst = S2.
    const jakob = assembleCareer(bundles, 'jakob')!;
    expect(jakob.ledger.bestSeasonNumber).toBe(1);
    expect(jakob.ledger.worstSeasonNumber).toBe(2);
  });
});

describe('assembleCareer — edges', () => {
  it('returns null for a slug that never competed', () => {
    expect(assembleCareer(bundles, 'nobody')).toBeNull();
  });

  it('handles a single-season career: best === worst, avg = that placement', () => {
    const soloS1 = assembleCareer([s1Bundle], 'william')!;
    expect(soloS1.ledger.seasonsPlayed).toBe(1);
    expect(soloS1.ledger.averagePlacement).toBe(4);
    expect(soloS1.ledger.bestSeasonNumber).toBe(1);
    expect(soloS1.ledger.worstSeasonNumber).toBe(1);
  });
});

describe('composeCareerView — static content join', () => {
  const view = composeCareerView(assembleCareer(bundles, 'tobias')!);

  it('builds one card per season, ascending, with per-season gamer content', () => {
    expect(view.cards.map((c) => c.seasonNumber)).toEqual([1, 2]);
    for (const card of view.cards) {
      expect(card.nickname).toBeTruthy();
      expect(card.imagePath).toBeTruthy();
    }
  });

  it('derives the hero from the latest season with a card-art fallback', () => {
    expect(view.hero.name).toBe('Tobias');
    // compose always sets the fallback flag; queries.ts flips it if a hero file exists.
    expect(view.hero.heroImageIsFallback).toBe(true);
    expect(view.hero.imagePath).toBe(
      view.cards[view.cards.length - 1].imagePath,
    );
  });

  it('joins game titles onto game-gold trophies only', () => {
    for (const t of view.trophies) {
      if (t.kind === 'game-gold') {
        expect(t.gameTitle, `${t.gameSlug}`).toBeTruthy();
      } else {
        expect(t.gameTitle).toBeUndefined();
      }
    }
  });
});

describe('deriveTrophies — season podium ordering', () => {
  // Minimal SeasonView stub: deriveTrophies only reads seasonNumber,
  // seasonSlug, standings, and games. A player holding `placement` in a season
  // where no games are won.
  const ref = (slug: string): PlayerRef => ({
    seasonPlayerId: `${slug}-sp`,
    slug,
    name: slug,
  });

  function seasonWith(seasonNumber: number, placement: number): SeasonView {
    return {
      seasonNumber,
      seasonSlug: String(seasonNumber).padStart(2, '0'),
      players: [ref('hero')],
      standings: [
        {
          player: ref('hero'),
          placement,
          totalPoints: 0,
          isChampion: placement === 1,
          note: null,
        },
      ],
      games: [],
      series: [],
    };
  }

  it('sorts by significance (gold→silver→bronze), then by season age within a tier', () => {
    // Deliberately out of order: a bronze (S1), a gold (S3), a silver (S2),
    // plus a second gold in an older season (S0) to prove age sorts inside gold.
    const views = [
      seasonWith(1, 3), // bronze, S1
      seasonWith(3, 1), // gold, S3
      seasonWith(2, 2), // silver, S2
      seasonWith(0, 1), // gold, S0
    ];

    const trophies = deriveTrophies('hero', views);

    expect(trophies.map((t) => [t.kind, t.seasonNumber])).toEqual([
      ['season-gold', 0], // golds first, oldest gold leads
      ['season-gold', 3],
      ['season-silver', 2], // then silver
      ['season-bronze', 1], // then bronze
    ]);
  });
});
