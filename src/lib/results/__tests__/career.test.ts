import { describe, it, expect } from 'vitest';
import { assembleCareer } from '../derive/career';
import { deriveTrophies } from '../derive/career/trophies';
import { deriveTagStats } from '../derive/career/tags';
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

describe('assembleCareer — per-game rows', () => {
  const career = assembleCareer(bundles, 'tobias')!;

  it('emits one row per game played, season-ascending', () => {
    expect(career.games).toHaveLength(16);
    const seasons = career.games.map((g) => g.seasonNumber);
    expect(seasons).toEqual([...seasons].sort((a, b) => a - b));
  });

  it('carries the authoritative game placement (wins match the game-golds)', () => {
    const wins = career.games
      .filter((g) => g.placement === 1)
      .map((g) => g.gameSlug);
    expect(wins).toEqual([
      'tetris',
      'trackmania',
      'flat-out-2',
      'curve-fever',
      'wreckfest',
    ]);
  });
});

describe('deriveTagStats', () => {
  const p = (placement: number) => ({ placement });

  it('counts a multi-tag game toward every one of its tags', () => {
    const stats = deriveTagStats([
      { tags: ['a', 'b'], result: p(1) },
      { tags: ['a'], result: p(3) },
    ]);
    expect(stats.find((s) => s.tag === 'a')).toEqual({
      tag: 'a',
      games: 2,
      wins: 1,
      averagePlacement: 2,
      results: [p(1), p(3)],
    });
    expect(stats.find((s) => s.tag === 'b')).toEqual({
      tag: 'b',
      games: 1,
      wins: 1,
      averagePlacement: 1,
      results: [p(1)],
    });
  });

  it('ignores untagged games and applies no minimum sample', () => {
    const stats = deriveTagStats([
      { tags: [], result: p(2) },
      { tags: ['solo'], result: p(4) },
    ]);
    expect(stats).toEqual([
      { tag: 'solo', games: 1, wins: 0, averagePlacement: 4, results: [p(4)] },
    ]);
  });

  it('carries each result through untouched, in input order', () => {
    const first = { placement: 2, id: 'first' };
    const second = { placement: 1, id: 'second' };
    const [stat] = deriveTagStats([
      { tags: ['a'], result: first },
      { tags: ['a'], result: second },
    ]);
    expect(stat.results).toEqual([first, second]);
  });

  it('orders best first: average placement, then games, then wins, then tag', () => {
    const stats = deriveTagStats([
      // avg 2.0 — three games, no wins.
      { tags: ['more-games'], result: p(2) },
      { tags: ['more-games'], result: p(2) },
      { tags: ['more-games'], result: p(2) },
      // avg 2.0 — two games, one win: fewer games loses despite the win.
      { tags: ['fewer-games'], result: p(1) },
      { tags: ['fewer-games'], result: p(3) },
      // avg 2.0 — two games, no wins: same games, fewer wins.
      { tags: ['no-wins'], result: p(2) },
      { tags: ['no-wins'], result: p(2) },
      // avg 2.0 — identical to no-wins, so tag name decides.
      { tags: ['a-no-wins'], result: p(2) },
      { tags: ['a-no-wins'], result: p(2) },
      { tags: ['best'], result: p(1) },
    ]);
    expect(stats.map((s) => s.tag)).toEqual([
      'best',
      'more-games',
      'fewer-games',
      'a-no-wins',
      'no-wins',
    ]);
  });

  it('treats averages that display the same (one decimal) as tied', () => {
    // 2.25 and 2.333… both show as 2.3, so the tag with more games leads even
    // though its raw average is the higher one.
    const stats = deriveTagStats([
      ...[2, 2, 2, 3].map((n) => ({ tags: ['four'], result: p(n) })),
      ...[2, 2, 3, 2, 2, 3].map((n) => ({ tags: ['six'], result: p(n) })),
    ]);
    expect(stats.map((s) => s.tag)).toEqual(['six', 'four']);
    expect(stats[0].averagePlacement).toBeCloseTo(2.333, 3);
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

  it('aggregates a genre tag through the title (Tobias won all three racing games)', () => {
    // trackmania + flat-out-2 (S1) + wreckfest (S2), all placement 1.
    const racing = view.tagStats.find((s) => s.tag === 'racing')!;
    expect(racing).toMatchObject({
      tag: 'racing',
      games: 3,
      wins: 3,
      averagePlacement: 1,
    });
    // The games behind the row, chronological, with their static titles joined.
    expect(racing.results).toEqual([
      {
        seasonNumber: 1,
        seasonSlug: '01',
        gameSlug: 'trackmania',
        gameTitle: 'Trackmania',
        placement: 1,
        ownPick: true,
      },
      {
        seasonNumber: 1,
        seasonSlug: '01',
        gameSlug: 'flat-out-2',
        gameTitle: 'Flat Out 2',
        placement: 1,
        ownPick: false,
      },
      {
        seasonNumber: 2,
        seasonSlug: '02',
        gameSlug: 'wreckfest',
        gameTitle: 'Wreckfest',
        placement: 1,
        ownPick: true,
      },
    ]);
  });

  it('counts a multi-genre title toward each genre', () => {
    // card: hearthstone, poker. strategy: sjakk, pokemon, warcraft-3,
    // total-war-empire + hearthstone (tagged card AND strategy).
    expect(view.tagStats.find((s) => s.tag === 'card')?.games).toBe(2);
    expect(view.tagStats.find((s) => s.tag === 'strategy')?.games).toBe(5);
  });

  it('aggregates a format tag from the instance', () => {
    // duel: sjakk, csgo, pokemon, hearthstone, total-war-empire, lol-02.
    expect(view.tagStats.find((s) => s.tag === 'duel')?.games).toBe(6);
  });

  it('ranks genre and format tags together in one best-first list', () => {
    // 16 games: one genre tag each (hearthstone has two) = 17, plus one format
    // tag each except trackmania (none) = 15.
    expect(view.tagStats.reduce((n, s) => n + s.games, 0)).toBe(32);
    const averages = view.tagStats.map((s) =>
      Number(s.averagePlacement.toFixed(1)),
    );
    expect(averages).toEqual([...averages].sort((a, b) => a - b));
  });

  it('flags the games the player chose and offers the stats without them', () => {
    const own = view.tagStats
      .flatMap((s) => s.results)
      .filter((r) => r.ownPick)
      .map((r) => r.gameSlug);
    // Tobias chose two games per season in S1 + S2.
    expect(new Set(own).size).toBe(4);

    const without = view.tagStatsWithoutOwnPicks.flatMap((s) => s.results);
    expect(without.some((r) => r.ownPick)).toBe(false);
    // 32 tag-counted games in total (see above), minus those under own picks.
    const all = view.tagStats.flatMap((s) => s.results);
    expect(without).toHaveLength(all.filter((r) => !r.ownPick).length);
    expect(without.length).toBeLessThan(all.length);
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
