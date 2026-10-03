import type { SeasonBundle } from '../raw';

/**
 * Season 1 raw bundle fixture — a faithful snapshot of the seeded S1 data
 * (supabase/seed.sql), used to unit-test the pure derivation without a DB.
 *
 * UUIDs match the local seed at authoring time; the derivation only cares that
 * ids are consistent across tables, so these are stable identifiers for the
 * test, not asserted values. The ASSERTED facts are the derived numbers in the
 * tests: season totals 24/20/20/16, per-game points matrix, standings order,
 * and the two tiebreak notes.
 *
 * S1 has no power-ups, so powerUpUses is empty — power-up delta handling is
 * exercised by later-season fixtures.
 */

// season_player ids
const SP = {
  jakob: '318984ce-aedf-4001-902d-8d2a7f3a927f',
  jorgen: '9ad46606-f26a-4332-994f-44f55c9e78b5',
  tobias: '4b38bd23-abf6-4591-88c1-14177dd18009',
  william: '939d3c27-dd9a-4b3a-8806-1bbeed600e33',
} as const;

// player ids
const P = {
  jakob: '2a015cce-e93d-4420-8a7d-339c39a0542a',
  jorgen: '24131e53-e225-41a4-b64e-4661ed924bbe',
  tobias: '53cb79ee-a4ac-4f5f-9463-2f64371dfc1a',
  william: '9e80224a-ea37-4ab3-988b-60e680bed560',
} as const;

const SEASON_ID = '55f8acc3-1950-436b-90a0-9bd82c0ae5c7';
const TS = '2026-10-03T22:11:45.049287+00:00';

// game ids by slug
const G = {
  sjakk: 'b1f4ca28-adda-4197-9922-a42a32ed3f64',
  osrs: '7cf283ed-8aba-4ce8-a4e8-d9913bcc6722',
  csgo: 'e963fad2-f8de-4ccf-9c54-80553c03b955',
  skyrim: 'b616f888-6bd0-4643-af4b-99cac8c9b068',
  tetris: '7438773c-a5a1-434b-81ac-c91fc69d49b8',
  pokemon: '70643b32-37ee-453d-ba48-295f1cc4d312',
  trackmania: '6a62514b-3f51-499e-98a1-8ea526adb197',
  flatout: '6c94cc58-71d2-45ba-91be-f378c5c67a45',
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

export const s1Bundle: SeasonBundle = {
  season: {
    id: SEASON_ID,
    number: 1,
    status: 'complete',
    started_at: '2023-03-18T09:00:00+00:00',
    ended_at: '2023-03-18T22:00:00+00:00',
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
    { season_id: SEASON_ID, placement: 1, points: 4 },
    { season_id: SEASON_ID, placement: 2, points: 3 },
    { season_id: SEASON_ID, placement: 3, points: 2 },
    { season_id: SEASON_ID, placement: 4, points: 1 },
  ],
  games: [
    {
      id: G.sjakk,
      season_id: SEASON_ID,
      slug: 'sjakk',
      ordinal: 1,
      status: 'complete',
    },
    {
      id: G.osrs,
      season_id: SEASON_ID,
      slug: 'old-school-runescape',
      ordinal: 2,
      status: 'complete',
    },
    {
      id: G.csgo,
      season_id: SEASON_ID,
      slug: 'counter-strike-global-offensive',
      ordinal: 3,
      status: 'complete',
    },
    {
      id: G.skyrim,
      season_id: SEASON_ID,
      slug: 'the-elder-scrolls-v-skyrim',
      ordinal: 4,
      status: 'complete',
    },
    {
      id: G.tetris,
      season_id: SEASON_ID,
      slug: 'tetris',
      ordinal: 5,
      status: 'complete',
    },
    {
      id: G.pokemon,
      season_id: SEASON_ID,
      slug: 'pokemon-showdown',
      ordinal: 6,
      status: 'complete',
    },
    {
      id: G.trackmania,
      season_id: SEASON_ID,
      slug: 'trackmania',
      ordinal: 7,
      status: 'complete',
    },
    {
      id: G.flatout,
      season_id: SEASON_ID,
      slug: 'flat-out-2',
      ordinal: 8,
      status: 'complete',
    },
  ],
  gameResults: [
    // Sjakk: 1 Jørgen, 2 Tobias, 3 Jakob, 4 William
    ...results(G.sjakk, [
      { sp: SP.jorgen, placement: 1 },
      { sp: SP.tobias, placement: 2 },
      { sp: SP.jakob, placement: 3 },
      { sp: SP.william, placement: 4 },
    ]),
    // OSRS: 1 Jørgen (tiebreak), 2 Jakob, 3 Tobias, 4 William
    ...results(G.osrs, [
      {
        sp: SP.jorgen,
        placement: 1,
        note: 'Jakob og Jørgen endte begge på 13 poeng. Jørgen vant tiebreakeren.',
      },
      { sp: SP.jakob, placement: 2 },
      { sp: SP.tobias, placement: 3 },
      { sp: SP.william, placement: 4 },
    ]),
    // CS:GO: 1 William, 2 Tobias, 3 Jakob, 4 Jørgen
    ...results(G.csgo, [
      { sp: SP.william, placement: 1 },
      { sp: SP.tobias, placement: 2 },
      { sp: SP.jakob, placement: 3 },
      { sp: SP.jorgen, placement: 4 },
    ]),
    // Skyrim: 1 Jakob, 2 Tobias, 3 Jørgen, 4 William
    ...results(G.skyrim, [
      { sp: SP.jorgen, placement: 3 },
      { sp: SP.tobias, placement: 2 },
      { sp: SP.jakob, placement: 1 },
      { sp: SP.william, placement: 4 },
    ]),
    // Tetris: 1 Tobias, 2 Jørgen, 3 William, 4 Jakob
    ...results(G.tetris, [
      { sp: SP.tobias, placement: 1 },
      { sp: SP.jakob, placement: 4 },
      { sp: SP.william, placement: 3 },
      { sp: SP.jorgen, placement: 2 },
    ]),
    // Pokémon: 1 Jørgen, 2 Jakob, 3 William, 4 Tobias
    ...results(G.pokemon, [
      { sp: SP.jakob, placement: 2 },
      { sp: SP.jorgen, placement: 1 },
      { sp: SP.william, placement: 3 },
      { sp: SP.tobias, placement: 4 },
    ]),
    // Trackmania: 1 Tobias, 2 Jakob, 3 William, 4 Jørgen
    ...results(G.trackmania, [
      { sp: SP.tobias, placement: 1 },
      { sp: SP.jorgen, placement: 4 },
      { sp: SP.jakob, placement: 2 },
      { sp: SP.william, placement: 3 },
    ]),
    // Flat Out 2: 1 Tobias, 2 William, 3 Jakob, 4 Jørgen
    ...results(G.flatout, [
      { sp: SP.tobias, placement: 1 },
      { sp: SP.william, placement: 2 },
      { sp: SP.jakob, placement: 3 },
      { sp: SP.jorgen, placement: 4 },
    ]),
  ],
  powerUpUses: [],
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
      note: 'Jakob og Jørgen endte begge på 20 poeng. Jørgen vant tiebreakeren med en Gen 6 random match på Pokémon Showdown.',
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

/** Expected per-game points matrix from game-placements.md (verified). */
export const s1ExpectedGamePoints: Record<
  string,
  { jakob: number; jorgen: number; tobias: number; william: number }
> = {
  sjakk: { jakob: 2, jorgen: 4, tobias: 3, william: 1 },
  'old-school-runescape': { jakob: 3, jorgen: 4, tobias: 2, william: 1 },
  'counter-strike-global-offensive': {
    jakob: 2,
    jorgen: 1,
    tobias: 3,
    william: 4,
  },
  'the-elder-scrolls-v-skyrim': { jakob: 4, jorgen: 2, tobias: 3, william: 1 },
  tetris: { jakob: 1, jorgen: 3, tobias: 4, william: 2 },
  'pokemon-showdown': { jakob: 3, jorgen: 4, tobias: 1, william: 2 },
  trackmania: { jakob: 3, jorgen: 1, tobias: 4, william: 2 },
  'flat-out-2': { jakob: 2, jorgen: 1, tobias: 4, william: 3 },
};

/** Expected season totals (verified). */
export const s1ExpectedTotals = {
  jakob: 20,
  jorgen: 20,
  tobias: 24,
  william: 16,
} as const;

export const slugBySeasonPlayerId: Record<
  string,
  keyof typeof s1ExpectedTotals
> = {
  [SP.jakob]: 'jakob',
  [SP.jorgen]: 'jorgen',
  [SP.tobias]: 'tobias',
  [SP.william]: 'william',
};
