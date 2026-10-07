import type { SeasonBundle } from '../raw';

/**
 * Season 2 raw bundle fixture — a faithful snapshot of the seeded S2 data
 * (supabase/seed.sql), used to unit-test the pure derivation without a DB.
 *
 * S2 is the first season with POWER-UPS, so this fixture is what exercises the
 * power-up delta path (S1 has none). The ASSERTED facts are the derived numbers
 * in the tests: season totals 32/32/39/30, the per-game points matrix (ladder +
 * power-up deltas), the season-level tie (Jakob & Jørgen both 32, resolved by
 * season_result to Jørgen 2nd / Jakob 3rd), and the per-row power-up deltas.
 *
 * Base ladder: 7/4/2/1. UUIDs match the local seed at authoring time; the
 * derivation only cares that ids are consistent across tables.
 *
 * NOTE: the derivation consumes only game_result + ladder + power_up_use +
 * season_result (+ roster/players for name resolution). match/stage/round rows
 * are intentionally NOT part of this bundle — the read layer does not derive
 * match-level standings or round sums yet, so there is nothing to fixture for
 * them. The leg-based dual-round-robin / bracket-rematch modeling is verified
 * at the DB level in the seed run, not here.
 */

// season_player ids
const SP = {
  jakob: '1d9ebbbc-6126-430b-a4d1-259ab0790e5c',
  jorgen: '66f056c0-7826-4bae-8008-9e26b75a2669',
  tobias: '8514f120-4ec4-4f02-bda0-2196341a0f42',
  william: 'eb7f42a3-5d7a-46ab-ba6d-16b53b8ca8ed',
} as const;

// player ids
const P = {
  jakob: '18be7198-3bb4-4160-b182-192c472e607b',
  jorgen: '3a96e0f4-9a0a-4564-9860-289c0d31c734',
  tobias: '4872fb61-5f4f-4308-bf6d-ac18f5dcc853',
  william: 'ff3fa22d-569e-4bfb-84aa-5024067eea60',
} as const;

// power_up ids
const PU = {
  doubleUp: 'a9849959-7f8d-451b-b351-30bef39fc0c6',
  safetyNet: '83726e13-4a53-443a-8152-fd97e5b56ad5',
  gambaTime: '2b77a9e7-8082-4b08-93ee-fa9485c21b98',
} as const;

const SEASON_ID = '3f0c4b0f-30c3-4668-a8d9-240ca7436881';
const TS = '2026-10-04T00:44:00.587982+00:00';

// game ids by slug
const G = {
  hearthstone: 'bed69e67-2b81-410e-87fa-6a63edae6fba',
  curveFever: 'eca312d2-9c2f-4f56-93d0-7c0f96c6cca8',
  sims: '5cc85f78-efe4-4cf9-8d07-d26f6711fd06',
  warcraft: 'e2bbb8b9-d5e3-4abb-a097-5262d6ab0b51',
  poker: '92e5d393-d136-4c42-a698-6b7ff5baeb23',
  wreckfest: '1074397e-8b43-4d8c-a4d8-877a08db7be4',
  totalWar: '2f8bb00c-9566-4d06-bfbd-a190acc1822c',
  lol: 'c5885910-3aa6-4745-861e-da53c533b770',
} as const;

/** Helper: build the 4 game_result rows for a game from a placement map. */
function results(
  gameId: string,
  placements: { sp: string; placement: number; note?: string | null }[],
) {
  return placements.map(({ sp, placement, note = null }) => ({
    game_id: gameId,
    season_player_id: sp,
    placement,
    confirmed: true,
    created_at: TS,
    updated_at: TS,
    note,
  }));
}

/**
 * Helper: build one power_up_use row. affected === used_by always — every S1–S4
 * power-up only adjusts the user's own points (the schema's targeting field).
 */
let puSeq = 0;
function use(gameId: string, powerUpId: string, sp: string, delta: number) {
  return {
    id: `pu-${++puSeq}`,
    game_id: gameId,
    power_up_id: powerUpId,
    used_by_season_player_id: sp,
    affected_season_player_id: sp,
    points_delta: delta,
  };
}

export const s2Bundle: SeasonBundle = {
  season: {
    id: SEASON_ID,
    number: 2,
    status: 'complete',
    started_at: '2023-10-07T08:00:00+00:00',
    ended_at: '2023-10-07T21:00:00+00:00',
    created_at: TS,
  },
  roster: [
    { id: SP.jakob, season_id: SEASON_ID, player_id: P.jakob },
    { id: SP.jorgen, season_id: SEASON_ID, player_id: P.jorgen },
    { id: SP.tobias, season_id: SEASON_ID, player_id: P.tobias },
    { id: SP.william, season_id: SEASON_ID, player_id: P.william },
  ],
  players: [
    { id: P.jakob, name: 'Jakob', slug: 'jakob', created_at: TS },
    { id: P.jorgen, name: 'Jørgen', slug: 'jorgen', created_at: TS },
    { id: P.tobias, name: 'Tobias', slug: 'tobias', created_at: TS },
    { id: P.william, name: 'William', slug: 'william', created_at: TS },
  ],
  ladder: [
    { season_id: SEASON_ID, placement: 1, points: 7 },
    { season_id: SEASON_ID, placement: 2, points: 4 },
    { season_id: SEASON_ID, placement: 3, points: 2 },
    { season_id: SEASON_ID, placement: 4, points: 1 },
  ],
  powerUps: [
    {
      id: PU.doubleUp,
      season_id: SEASON_ID,
      slug: 'double-up',
      is_curse: false,
      can_target_others: false,
    },
    {
      id: PU.safetyNet,
      season_id: SEASON_ID,
      slug: 'safety-net',
      is_curse: false,
      can_target_others: false,
    },
    {
      id: PU.gambaTime,
      season_id: SEASON_ID,
      slug: 'gamba-time',
      is_curse: false,
      can_target_others: false,
    },
  ],
  games: [
    {
      id: G.hearthstone,
      season_id: SEASON_ID,
      slug: 'hearthstone',
      ordinal: 1,
      status: 'complete',
    },
    {
      id: G.curveFever,
      season_id: SEASON_ID,
      slug: 'curve-fever',
      ordinal: 2,
      status: 'complete',
    },
    {
      id: G.sims,
      season_id: SEASON_ID,
      slug: 'the-sims-4',
      ordinal: 3,
      status: 'complete',
    },
    {
      id: G.warcraft,
      season_id: SEASON_ID,
      slug: 'warcraft-3',
      ordinal: 4,
      status: 'complete',
    },
    {
      id: G.poker,
      season_id: SEASON_ID,
      slug: 'poker',
      ordinal: 5,
      status: 'complete',
    },
    {
      id: G.wreckfest,
      season_id: SEASON_ID,
      slug: 'wreckfest',
      ordinal: 6,
      status: 'complete',
    },
    {
      id: G.totalWar,
      season_id: SEASON_ID,
      slug: 'total-war-empire',
      ordinal: 7,
      status: 'complete',
    },
    {
      id: G.lol,
      season_id: SEASON_ID,
      slug: 'league-of-legends-02',
      ordinal: 8,
      status: 'complete',
    },
  ],
  gameResults: [
    // Hearthstone: 1 William, 2 Jørgen, 3 Tobias, 4 Jakob
    ...results(G.hearthstone, [
      { sp: SP.william, placement: 1 },
      { sp: SP.jorgen, placement: 2 },
      { sp: SP.tobias, placement: 3 },
      { sp: SP.jakob, placement: 4 },
    ]),
    // Curve Fever: 1 Tobias, 2 William, 3 Jørgen, 4 Jakob
    ...results(G.curveFever, [
      { sp: SP.tobias, placement: 1 },
      { sp: SP.william, placement: 2 },
      { sp: SP.jorgen, placement: 3 },
      { sp: SP.jakob, placement: 4 },
    ]),
    // The Sims 4: 1 Jakob, 2 Tobias, 3 Jørgen, 4 William
    ...results(G.sims, [
      { sp: SP.jakob, placement: 1 },
      { sp: SP.tobias, placement: 2 },
      { sp: SP.jorgen, placement: 3 },
      { sp: SP.william, placement: 4 },
    ]),
    // Warcraft 3: 1 William, 2 Jakob, 3 Tobias, 4 Jørgen
    ...results(G.warcraft, [
      { sp: SP.william, placement: 1 },
      { sp: SP.jakob, placement: 2 },
      { sp: SP.tobias, placement: 3 },
      { sp: SP.jorgen, placement: 4 },
    ]),
    // Poker: 1 Jørgen, 2 Tobias, 3 William, 4 Jakob
    ...results(G.poker, [
      { sp: SP.jorgen, placement: 1 },
      { sp: SP.tobias, placement: 2 },
      { sp: SP.william, placement: 3 },
      { sp: SP.jakob, placement: 4 },
    ]),
    // Wreckfest: 1 Tobias, 2 Jakob, 3 William, 4 Jørgen
    ...results(G.wreckfest, [
      { sp: SP.tobias, placement: 1 },
      { sp: SP.jakob, placement: 2 },
      { sp: SP.william, placement: 3 },
      { sp: SP.jorgen, placement: 4 },
    ]),
    // Total War: Empire: 1 Jakob, 2 Tobias, 3 Jørgen, 4 William
    ...results(G.totalWar, [
      { sp: SP.jakob, placement: 1 },
      { sp: SP.tobias, placement: 2 },
      { sp: SP.jorgen, placement: 3 },
      { sp: SP.william, placement: 4 },
    ]),
    // League of Legends: 1 Jørgen, 2 Tobias, 3 William, 4 Jakob
    ...results(G.lol, [
      { sp: SP.jorgen, placement: 1 },
      { sp: SP.tobias, placement: 2 },
      { sp: SP.william, placement: 3 },
      { sp: SP.jakob, placement: 4 },
    ]),
  ],
  powerUpUses: [
    // Hearthstone: Jørgen Double Up (+4), Jakob Safety Net (+2)
    use(G.hearthstone, PU.doubleUp, SP.jorgen, 4),
    use(G.hearthstone, PU.safetyNet, SP.jakob, 2),
    // Warcraft 3: Tobias Safety Net (+1)
    use(G.warcraft, PU.safetyNet, SP.tobias, 1),
    // Poker: William Gamba Time (0 — missed)
    use(G.poker, PU.gambaTime, SP.william, 0),
    // Wreckfest: Jakob Double Up (+4), William Double Up (+2), Jørgen Safety Net (+2)
    use(G.wreckfest, PU.doubleUp, SP.jakob, 4),
    use(G.wreckfest, PU.doubleUp, SP.william, 2),
    use(G.wreckfest, PU.safetyNet, SP.jorgen, 2),
    // Total War: Tobias Double Up (+4), William Safety Net (+2), Jørgen Gamba Time (0)
    use(G.totalWar, PU.doubleUp, SP.tobias, 4),
    use(G.totalWar, PU.safetyNet, SP.william, 2),
    use(G.totalWar, PU.gambaTime, SP.jorgen, 0),
    // League of Legends: Jakob Gamba Time (0), Tobias Gamba Time (0)
    use(G.lol, PU.gambaTime, SP.jakob, 0),
    use(G.lol, PU.gambaTime, SP.tobias, 0),
  ],
  seasonResults: [
    {
      season_id: SEASON_ID,
      season_player_id: SP.tobias,
      placement: 1,
      note: null,
      confirmed: true,
      created_at: TS,
      updated_at: TS,
    },
    {
      season_id: SEASON_ID,
      season_player_id: SP.jorgen,
      placement: 2,
      note: 'Jakob og Jørgen endte begge på 32 poeng. Jørgen vant tiebreakeren med en any%-speedrun av Table Tennis World Tour.',
      confirmed: true,
      created_at: TS,
      updated_at: TS,
    },
    {
      season_id: SEASON_ID,
      season_player_id: SP.jakob,
      placement: 3,
      note: null,
      confirmed: true,
      created_at: TS,
      updated_at: TS,
    },
    {
      season_id: SEASON_ID,
      season_player_id: SP.william,
      placement: 4,
      note: null,
      confirmed: true,
      created_at: TS,
      updated_at: TS,
    },
  ],
};

/**
 * Expected per-game points matrix (ladder + power-up deltas), verified against
 * game-placements.md / the season Poeng sheet.
 */
export const s2ExpectedGamePoints: Record<
  string,
  { jakob: number; jorgen: number; tobias: number; william: number }
> = {
  hearthstone: { jakob: 3, jorgen: 8, tobias: 2, william: 7 },
  'curve-fever': { jakob: 1, jorgen: 2, tobias: 7, william: 4 },
  'the-sims-4': { jakob: 7, jorgen: 2, tobias: 4, william: 1 },
  'warcraft-3': { jakob: 4, jorgen: 1, tobias: 3, william: 7 },
  poker: { jakob: 1, jorgen: 7, tobias: 4, william: 2 },
  wreckfest: { jakob: 8, jorgen: 3, tobias: 7, william: 4 },
  'total-war-empire': { jakob: 7, jorgen: 2, tobias: 8, william: 3 },
  'league-of-legends-02': { jakob: 1, jorgen: 7, tobias: 4, william: 2 },
};

/**
 * Expected per-game power-up deltas (0 where none). The sum of a player's
 * deltas across all games is their total power-up contribution.
 */
export const s2ExpectedPowerUpDeltas: Record<
  string,
  { jakob: number; jorgen: number; tobias: number; william: number }
> = {
  hearthstone: { jakob: 2, jorgen: 4, tobias: 0, william: 0 },
  'curve-fever': { jakob: 0, jorgen: 0, tobias: 0, william: 0 },
  'the-sims-4': { jakob: 0, jorgen: 0, tobias: 0, william: 0 },
  'warcraft-3': { jakob: 0, jorgen: 0, tobias: 1, william: 0 },
  poker: { jakob: 0, jorgen: 0, tobias: 0, william: 0 },
  wreckfest: { jakob: 4, jorgen: 2, tobias: 0, william: 2 },
  'total-war-empire': { jakob: 0, jorgen: 0, tobias: 4, william: 2 },
  'league-of-legends-02': { jakob: 0, jorgen: 0, tobias: 0, william: 0 },
};

/** Expected season totals (ladder + power-ups), verified. */
export const s2ExpectedTotals = {
  jakob: 32,
  jorgen: 32,
  tobias: 39,
  william: 30,
} as const;

/**
 * Expected per-cell power-up USE lists (slug + delta), for the new per-use
 * breakdown. Only cells with at least one use are listed; every other cell has
 * an empty list. Slugs match the static power-up content (double-up etc.).
 * Deterministic order: slug asc, then delta asc, then DB order — the one cell
 * with two uses (none in S2; all S2 cells have a single use) would follow it.
 */
export const s2ExpectedUses: Record<
  string,
  Record<string, { slug: string; isCurse: boolean; pointsDelta: number }[]>
> = {
  hearthstone: {
    jorgen: [{ slug: 'double-up', isCurse: false, pointsDelta: 4 }],
    jakob: [{ slug: 'safety-net', isCurse: false, pointsDelta: 2 }],
  },
  'warcraft-3': {
    tobias: [{ slug: 'safety-net', isCurse: false, pointsDelta: 1 }],
  },
  poker: {
    william: [{ slug: 'gamba-time', isCurse: false, pointsDelta: 0 }],
  },
  wreckfest: {
    jakob: [{ slug: 'double-up', isCurse: false, pointsDelta: 4 }],
    william: [{ slug: 'double-up', isCurse: false, pointsDelta: 2 }],
    jorgen: [{ slug: 'safety-net', isCurse: false, pointsDelta: 2 }],
  },
  'total-war-empire': {
    tobias: [{ slug: 'double-up', isCurse: false, pointsDelta: 4 }],
    william: [{ slug: 'safety-net', isCurse: false, pointsDelta: 2 }],
    jorgen: [{ slug: 'gamba-time', isCurse: false, pointsDelta: 0 }],
  },
  'league-of-legends-02': {
    jakob: [{ slug: 'gamba-time', isCurse: false, pointsDelta: 0 }],
    tobias: [{ slug: 'gamba-time', isCurse: false, pointsDelta: 0 }],
  },
};
