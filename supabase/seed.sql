-- =============================================================================
-- Gamernes Gamer — Seed: historical results
-- =============================================================================
-- Data (not schema). Kept OUT of migrations so prod never re-runs it.
-- Applied locally by `supabase db reset` (which replays migrations + this file).
--
-- Idempotent: wrapped so a re-run first clears any previously-seeded seasons,
-- then re-inserts. Safe to run repeatedly against the local stack.
--
-- Player identity (cross-season) is seeded once here. Season rosters, ladders,
-- games, stages, matches/rounds and results follow per season.
--
-- CONSTRAINT NOTE — match.player_a < match.player_b (by uuid):
-- season_player ids are random uuids, so "player_a" is whichever of the two
-- has the lesser uuid, decided at insert time. The seed_h2h_match() helper
-- normalises this: callers pass (winner, loser, winner_score, loser_score) in
-- natural terms and the helper figures out which side is a/b and flips the
-- stored scores to match. tiebreak_winner is set only when the two scores are
-- equal (no such case in Season 1).
-- =============================================================================

begin;

-- ---------------------------------------------------------------------------
-- Clean slate for the seasons this file seeds (idempotent re-runs).
-- season cascades to season_player → game → stage → match/round → results,
-- and to season_ladder / season_result. player rows are shared cross-season,
-- so we reset them too and re-insert.
-- ---------------------------------------------------------------------------
delete from season where number in (1, 2, 3, 4);
delete from player where slug in ('jakob', 'jorgen', 'tobias', 'william');


-- ---------------------------------------------------------------------------
-- PLAYERS (cross-season identity)
-- ---------------------------------------------------------------------------
insert into player (name, slug) values
  ('Jakob',   'jakob'),
  ('Jørgen',  'jorgen'),
  ('Tobias',  'tobias'),
  ('William', 'william');


-- ---------------------------------------------------------------------------
-- Helper: insert an H2H match plus its game rows, normalising the
-- player_a < player_b uuid ordering and flipping scores to match.
--
--   p_stage      stage.id
--   p_slot       match.slot_id (null for round-robin)
--   p_series     series_length
--   p_sp1,p_sp2  the two season_player ids (any order)
--   p_scores1    int[] — p_sp1's score in each game of the series (game 1..n)
--   p_scores2    int[] — p_sp2's score in each game, same length
--   p_leg        match.leg (default 1). 2+ for a rematch in a dual round-robin
--                or a swiss-finish; the unique key is
--                (stage_id, player_a, player_b, leg).
--
-- For Season 1 every match is bo1 (single-element arrays), leg 1, and no game
-- is a draw, so tiebreak_winner is never set. The helper still handles bo3/bo5,
-- extra legs, and draws for reuse by later seasons.
-- ---------------------------------------------------------------------------
create or replace function pg_temp.seed_h2h_match(
  p_stage   uuid,
  p_slot    text,
  p_series  series_length,
  p_sp1     uuid,
  p_sp2     uuid,
  p_scores1 int[],
  p_scores2 int[],
  p_leg     smallint default 1
) returns void
language plpgsql
as $$
declare
  v_a        uuid;
  v_b        uuid;
  v_match    uuid;
  v_flip     boolean;
  v_sa       int;
  v_sb       int;
  v_tb       tiebreak_winner;
  i          int;
begin
  if array_length(p_scores1, 1) is distinct from array_length(p_scores2, 1) then
    raise exception 'score arrays differ in length for stage % slot %', p_stage, p_slot;
  end if;

  -- Normalise to player_a < player_b by uuid. v_flip tracks whether sp1 ended
  -- up as player_b (so its scores belong on side b).
  if p_sp1 < p_sp2 then
    v_a := p_sp1; v_b := p_sp2; v_flip := false;
  else
    v_a := p_sp2; v_b := p_sp1; v_flip := true;
  end if;

  insert into match (stage_id, slot_id, player_a, player_b, leg, series_len)
  values (p_stage, p_slot, v_a, v_b, p_leg, p_series)
  returning id into v_match;

  for i in 1 .. array_length(p_scores1, 1) loop
    if v_flip then
      v_sa := p_scores2[i]; v_sb := p_scores1[i];
    else
      v_sa := p_scores1[i]; v_sb := p_scores2[i];
    end if;

    if v_sa = v_sb then
      -- A drawn game needs tiebreak_winner. None occur in Season 1; guard so a
      -- future caller can't silently violate the tiebreak_iff_draw constraint.
      raise exception 'drawn game (% - %) at stage % slot % needs an explicit tiebreak_winner; seed_h2h_match does not infer it', v_sa, v_sb, p_stage, p_slot;
    end if;

    v_tb := null;

    insert into match_game (match_id, game_number, score_a, score_b, tiebreak_winner)
    values (v_match, i, v_sa, v_sb, v_tb);
  end loop;
end;
$$;


-- =============================================================================
-- SEASON 1  (2023-03-18)
-- Base ladder 4/3/2/1. No power-ups. Final totals 20/20/24/16
-- (Jakob/Jørgen/Tobias/William). Jakob & Jørgen tie on 20; Jørgen takes 2nd on
-- a Gen 6 random-match Pokémon Showdown tiebreak → Jørgen 2nd, Jakob 3rd.
-- =============================================================================
do $$
declare
  v_season uuid;
  -- season_player ids
  sp_jakob   uuid;
  sp_jorgen  uuid;
  sp_tobias  uuid;
  sp_william uuid;
  -- reusable ids
  v_game   uuid;
  v_stage  uuid;
  v_stage2 uuid;
  v_round  uuid;
begin
  ---------------------------------------------------------------------------
  -- Season + roster + ladder
  ---------------------------------------------------------------------------
  insert into season (number, status, started_at, ended_at)
  values (1, 'complete', timestamptz '2023-03-18 10:00:00+01', timestamptz '2023-03-18 23:00:00+01')
  returning id into v_season;

  insert into season_player (season_id, player_id)
  select v_season, id from player where slug = 'jakob'   returning id into sp_jakob;
  insert into season_player (season_id, player_id)
  select v_season, id from player where slug = 'jorgen'  returning id into sp_jorgen;
  insert into season_player (season_id, player_id)
  select v_season, id from player where slug = 'tobias'  returning id into sp_tobias;
  insert into season_player (season_id, player_id)
  select v_season, id from player where slug = 'william' returning id into sp_william;

  insert into season_ladder (season_id, placement, points) values
    (v_season, 1, 4),
    (v_season, 2, 3),
    (v_season, 3, 2),
    (v_season, 4, 1);

  -------------------------------------------------------------------------
  -- GAME 1 — Sjakk (round-robin → single-elim, bo1, win-loss)
  -- Final: 1 Jørgen, 2 Tobias, 3 Jakob, 4 William
  -------------------------------------------------------------------------
  insert into game (season_id, slug, ordinal, status)
  values (v_season, 'sjakk', 1, 'complete') returning id into v_game;

  -- Stage 1: round-robin (slot_id null). Wins stored 1-0.
  insert into stage (game_id, ordinal, kind) values (v_game, 1, 'round-robin')
    returning id into v_stage;
  -- Group results (winner, loser): Tobias>Jakob, Jørgen>William, Jørgen>Jakob,
  -- Tobias>William, Jakob>William, Tobias>Jørgen.
  perform pg_temp.seed_h2h_match(v_stage, null, 'bo1', sp_tobias,  sp_jakob,   array[1], array[0]);
  perform pg_temp.seed_h2h_match(v_stage, null, 'bo1', sp_jorgen,  sp_william, array[1], array[0]);
  perform pg_temp.seed_h2h_match(v_stage, null, 'bo1', sp_jorgen,  sp_jakob,   array[1], array[0]);
  perform pg_temp.seed_h2h_match(v_stage, null, 'bo1', sp_tobias,  sp_william, array[1], array[0]);
  perform pg_temp.seed_h2h_match(v_stage, null, 'bo1', sp_jakob,   sp_william, array[1], array[0]);
  perform pg_temp.seed_h2h_match(v_stage, null, 'bo1', sp_tobias,  sp_jorgen,  array[1], array[0]);

  -- Stage 2: single-elim. Seeds by group wins: Tobias 3, Jørgen 2, Jakob 1, William 0.
  -- SF1 1v4 Tobias-William, SF2 2v3 Jørgen-Jakob, BR, F.
  insert into stage (game_id, ordinal, kind) values (v_game, 2, 'single-elim')
    returning id into v_stage;
  perform pg_temp.seed_h2h_match(v_stage, 'SF1', 'bo1', sp_tobias, sp_william, array[1], array[0]);
  perform pg_temp.seed_h2h_match(v_stage, 'SF2', 'bo1', sp_jorgen, sp_jakob,   array[1], array[0]);
  perform pg_temp.seed_h2h_match(v_stage, 'BR',  'bo1', sp_jakob,  sp_william, array[1], array[0]);
  perform pg_temp.seed_h2h_match(v_stage, 'F',   'bo1', sp_jorgen, sp_tobias,  array[1], array[0]);

  insert into game_result (game_id, season_player_id, placement, confirmed) values
    (v_game, sp_jorgen,  1, true),
    (v_game, sp_tobias,  2, true),
    (v_game, sp_jakob,   3, true),
    (v_game, sp_william, 4, true);

  -------------------------------------------------------------------------
  -- GAME 2 — Old School RuneScape (LMS) (rounds, sum, 3 rounds)
  -- raw_score per round = placement-points + kills-points (summed, lossy by
  -- design — see game-formats.md). Totals 13/13/7/6.
  -- Jakob & Jørgen tie on 13; Jørgen won the game-level tiebreaker.
  -- Final: 1 Jørgen, 2 Jakob, 3 Tobias, 4 William.
  -------------------------------------------------------------------------
  insert into game (season_id, slug, ordinal, status)
  values (v_season, 'old-school-runescape', 2, 'complete') returning id into v_game;

  insert into stage (game_id, ordinal, kind, aggregation)
  values (v_game, 1, 'rounds', 'sum') returning id into v_stage;

  -- Round 1: plassering J4 Jø3 T2 W1 + kills J2 Jø1 T0 W0 → 6/4/2/1
  insert into round (stage_id, ordinal, label) values (v_stage, 1, 'Runde 1') returning id into v_round;
  insert into round_result (round_id, season_player_id, raw_score) values
    (v_round, sp_jakob, 6), (v_round, sp_jorgen, 4), (v_round, sp_tobias, 2), (v_round, sp_william, 1);
  -- Round 2: plassering J1 Jø4 T3 W2 + kills J0 Jø2 T1 W0 → 1/6/4/2
  insert into round (stage_id, ordinal, label) values (v_stage, 2, 'Runde 2') returning id into v_round;
  insert into round_result (round_id, season_player_id, raw_score) values
    (v_round, sp_jakob, 1), (v_round, sp_jorgen, 6), (v_round, sp_tobias, 4), (v_round, sp_william, 2);
  -- Round 3: plassering J4 Jø2 T1 W3 + kills J2 Jø1 T0 W0 → 6/3/1/3
  insert into round (stage_id, ordinal, label) values (v_stage, 3, 'Runde 3') returning id into v_round;
  insert into round_result (round_id, season_player_id, raw_score) values
    (v_round, sp_jakob, 6), (v_round, sp_jorgen, 3), (v_round, sp_tobias, 1), (v_round, sp_william, 3);
  -- Sums: Jakob 13, Jørgen 13, Tobias 7, William 6.

  insert into game_result (game_id, season_player_id, placement, confirmed, note) values
    (v_game, sp_jorgen,  1, true, 'Jakob og Jørgen endte begge på 13 poeng. Jørgen vant tiebreakeren med en 1v1 i duel arena.'),
    (v_game, sp_jakob,   2, true, null),
    (v_game, sp_tobias,  3, true, null),
    (v_game, sp_william, 4, true, null);

  -------------------------------------------------------------------------
  -- GAME 3 — CS:GO (round-robin → single-elim, bo1, score — real scores)
  -- Final: 1 William, 2 Tobias, 3 Jakob, 4 Jørgen.
  -------------------------------------------------------------------------
  insert into game (season_id, slug, ordinal, status)
  values (v_season, 'counter-strike-global-offensive', 3, 'complete') returning id into v_game;

  -- Stage 1: round-robin, real scores stored.
  insert into stage (game_id, ordinal, kind) values (v_game, 1, 'round-robin')
    returning id into v_stage;
  -- Jakob 9-4 Tobias, Jørgen 0-9 William, Jakob 9-0 Jørgen, William 9-4 Tobias,
  -- William 9-1 Jakob, Tobias 3-9 Jørgen.
  perform pg_temp.seed_h2h_match(v_stage, null, 'bo1', sp_jakob,   sp_tobias,  array[9], array[4]);
  perform pg_temp.seed_h2h_match(v_stage, null, 'bo1', sp_william, sp_jorgen,  array[9], array[0]);
  perform pg_temp.seed_h2h_match(v_stage, null, 'bo1', sp_jakob,   sp_jorgen,  array[9], array[0]);
  perform pg_temp.seed_h2h_match(v_stage, null, 'bo1', sp_william, sp_tobias,  array[9], array[4]);
  perform pg_temp.seed_h2h_match(v_stage, null, 'bo1', sp_william, sp_jakob,   array[9], array[1]);
  perform pg_temp.seed_h2h_match(v_stage, null, 'bo1', sp_jorgen,  sp_tobias,  array[9], array[3]);

  -- Stage 2: single-elim. Group wins: William 3, Jakob 2, Tobias 1, Jørgen 0.
  -- SF1 1v4 William-Jørgen, SF2 2v3 Jakob-Tobias, BR, F.
  insert into stage (game_id, ordinal, kind) values (v_game, 2, 'single-elim')
    returning id into v_stage;
  perform pg_temp.seed_h2h_match(v_stage, 'SF1', 'bo1', sp_william, sp_jorgen, array[9], array[0]);
  perform pg_temp.seed_h2h_match(v_stage, 'SF2', 'bo1', sp_tobias,  sp_jakob,  array[9], array[7]);
  perform pg_temp.seed_h2h_match(v_stage, 'BR',  'bo1', sp_jakob,   sp_jorgen, array[9], array[2]);
  perform pg_temp.seed_h2h_match(v_stage, 'F',   'bo1', sp_william, sp_tobias, array[9], array[4]);

  insert into game_result (game_id, season_player_id, placement, confirmed) values
    (v_game, sp_william, 1, true),
    (v_game, sp_tobias,  2, true),
    (v_game, sp_jakob,   3, true),
    (v_game, sp_jorgen,  4, true);

  -------------------------------------------------------------------------
  -- GAME 4 — Skyrim (score, high) — single rounds stage, one round.
  -- Jakob 3566, Tobias 1542, Jørgen 1142, William 842.
  -- Final: 1 Jakob, 2 Tobias, 3 Jørgen, 4 William.
  -------------------------------------------------------------------------
  insert into game (season_id, slug, ordinal, status)
  values (v_season, 'the-elder-scrolls-v-skyrim', 4, 'complete') returning id into v_game;

  insert into stage (game_id, ordinal, kind, aggregation)
  values (v_game, 1, 'rounds', 'sum') returning id into v_stage;
  insert into round (stage_id, ordinal, label) values (v_stage, 1, 'Gull') returning id into v_round;
  insert into round_result (round_id, season_player_id, raw_score) values
    (v_round, sp_jakob, 3566), (v_round, sp_jorgen, 1142), (v_round, sp_tobias, 1542), (v_round, sp_william, 842);

  insert into game_result (game_id, season_player_id, placement, confirmed) values
    (v_game, sp_jakob,   1, true),
    (v_game, sp_tobias,  2, true),
    (v_game, sp_jorgen,  3, true),
    (v_game, sp_william, 4, true);

  -------------------------------------------------------------------------
  -- GAME 5 — Tetris (score, high) — single rounds stage, one round.
  -- Tobias 432797, Jørgen 428142, William 158175, Jakob 47383.
  -- Final: 1 Tobias, 2 Jørgen, 3 William, 4 Jakob.
  -------------------------------------------------------------------------
  insert into game (season_id, slug, ordinal, status)
  values (v_season, 'tetris', 5, 'complete') returning id into v_game;

  insert into stage (game_id, ordinal, kind, aggregation)
  values (v_game, 1, 'rounds', 'sum') returning id into v_stage;
  insert into round (stage_id, ordinal, label) values (v_stage, 1, 'Score') returning id into v_round;
  insert into round_result (round_id, season_player_id, raw_score) values
    (v_round, sp_jakob, 47383), (v_round, sp_jorgen, 428142), (v_round, sp_tobias, 432797), (v_round, sp_william, 158175);

  insert into game_result (game_id, season_player_id, placement, confirmed) values
    (v_game, sp_tobias,  1, true),
    (v_game, sp_jorgen,  2, true),
    (v_game, sp_william, 3, true),
    (v_game, sp_jakob,   4, true);

  -------------------------------------------------------------------------
  -- GAME 6 — Pokémon Showdown (round-robin → single-elim, bo1, win-loss)
  -- Final: 1 Jørgen, 2 Jakob, 3 William, 4 Tobias.
  -------------------------------------------------------------------------
  insert into game (season_id, slug, ordinal, status)
  values (v_season, 'pokemon-showdown', 6, 'complete') returning id into v_game;

  insert into stage (game_id, ordinal, kind) values (v_game, 1, 'round-robin')
    returning id into v_stage;
  -- Jakob>Tobias, Jørgen>William, Jørgen>Jakob, Tobias>William, Jakob>William, Jørgen>Tobias.
  perform pg_temp.seed_h2h_match(v_stage, null, 'bo1', sp_jakob,  sp_tobias,  array[1], array[0]);
  perform pg_temp.seed_h2h_match(v_stage, null, 'bo1', sp_jorgen, sp_william, array[1], array[0]);
  perform pg_temp.seed_h2h_match(v_stage, null, 'bo1', sp_jorgen, sp_jakob,   array[1], array[0]);
  perform pg_temp.seed_h2h_match(v_stage, null, 'bo1', sp_tobias, sp_william, array[1], array[0]);
  perform pg_temp.seed_h2h_match(v_stage, null, 'bo1', sp_jakob,  sp_william, array[1], array[0]);
  perform pg_temp.seed_h2h_match(v_stage, null, 'bo1', sp_jorgen, sp_tobias,  array[1], array[0]);

  -- Stage 2: single-elim. Group wins: Jørgen 3, Jakob 2, Tobias 1, William 0.
  -- SF1 1v4 Jørgen-William, SF2 2v3 Jakob-Tobias, BR, F.
  insert into stage (game_id, ordinal, kind) values (v_game, 2, 'single-elim')
    returning id into v_stage;
  perform pg_temp.seed_h2h_match(v_stage, 'SF1', 'bo1', sp_jorgen, sp_william, array[1], array[0]);
  perform pg_temp.seed_h2h_match(v_stage, 'SF2', 'bo1', sp_jakob,  sp_tobias,  array[1], array[0]);
  perform pg_temp.seed_h2h_match(v_stage, 'BR',  'bo1', sp_william, sp_tobias, array[1], array[0]);
  perform pg_temp.seed_h2h_match(v_stage, 'F',   'bo1', sp_jorgen, sp_jakob,   array[1], array[0]);

  insert into game_result (game_id, season_player_id, placement, confirmed) values
    (v_game, sp_jorgen,  1, true),
    (v_game, sp_jakob,   2, true),
    (v_game, sp_william, 3, true),
    (v_game, sp_tobias,  4, true);

  -------------------------------------------------------------------------
  -- GAME 7 — Trackmania (rounds, sum, 5 tracks)
  -- Placement points per track (4=best). Tracks named 1, 2, 7, 9, 12.
  -- Totals: Jakob 14, Jørgen 5, Tobias 20, William 11.
  -- Final: 1 Tobias, 2 Jakob, 3 William, 4 Jørgen.
  -------------------------------------------------------------------------
  insert into game (season_id, slug, ordinal, status)
  values (v_season, 'trackmania', 7, 'complete') returning id into v_game;

  insert into stage (game_id, ordinal, kind, aggregation)
  values (v_game, 1, 'rounds', 'sum') returning id into v_stage;
  insert into round (stage_id, ordinal, label) values (v_stage, 1, 'Track 1') returning id into v_round;
  insert into round_result (round_id, season_player_id, raw_score) values
    (v_round, sp_jakob, 3), (v_round, sp_jorgen, 1), (v_round, sp_tobias, 4), (v_round, sp_william, 2);
  insert into round (stage_id, ordinal, label) values (v_stage, 2, 'Track 2') returning id into v_round;
  insert into round_result (round_id, season_player_id, raw_score) values
    (v_round, sp_jakob, 3), (v_round, sp_jorgen, 1), (v_round, sp_tobias, 4), (v_round, sp_william, 2);
  insert into round (stage_id, ordinal, label) values (v_stage, 3, 'Track 7') returning id into v_round;
  insert into round_result (round_id, season_player_id, raw_score) values
    (v_round, sp_jakob, 2), (v_round, sp_jorgen, 1), (v_round, sp_tobias, 4), (v_round, sp_william, 3);
  insert into round (stage_id, ordinal, label) values (v_stage, 4, 'Track 9') returning id into v_round;
  insert into round_result (round_id, season_player_id, raw_score) values
    (v_round, sp_jakob, 3), (v_round, sp_jorgen, 1), (v_round, sp_tobias, 4), (v_round, sp_william, 2);
  insert into round (stage_id, ordinal, label) values (v_stage, 5, 'Track 12') returning id into v_round;
  insert into round_result (round_id, season_player_id, raw_score) values
    (v_round, sp_jakob, 3), (v_round, sp_jorgen, 1), (v_round, sp_tobias, 4), (v_round, sp_william, 2);
  -- Sums: Jakob 14, Jørgen 5, Tobias 20, William 11.

  insert into game_result (game_id, season_player_id, placement, confirmed) values
    (v_game, sp_tobias,  1, true),
    (v_game, sp_jakob,   2, true),
    (v_game, sp_william, 3, true),
    (v_game, sp_jorgen,  4, true);

  -------------------------------------------------------------------------
  -- GAME 8 — Flat Out 2 (rounds, sum, 12 stunt events)
  -- Placement points per event (4=best).
  -- Totals: Jakob 30, Jørgen 16, Tobias 41, William 33.
  -- Final: 1 Tobias, 2 William, 3 Jakob, 4 Jørgen.
  -------------------------------------------------------------------------
  insert into game (season_id, slug, ordinal, status)
  values (v_season, 'flat-out-2', 8, 'complete') returning id into v_game;

  insert into stage (game_id, ordinal, kind, aggregation)
  values (v_game, 1, 'rounds', 'sum') returning id into v_stage;

  insert into round (stage_id, ordinal, label) values (v_stage, 1, 'High Jump') returning id into v_round;
  insert into round_result (round_id, season_player_id, raw_score) values
    (v_round, sp_jakob, 2), (v_round, sp_jorgen, 1), (v_round, sp_tobias, 3), (v_round, sp_william, 4);
  insert into round (stage_id, ordinal, label) values (v_stage, 2, 'Bowling') returning id into v_round;
  insert into round_result (round_id, season_player_id, raw_score) values
    (v_round, sp_jakob, 2), (v_round, sp_jorgen, 1), (v_round, sp_tobias, 4), (v_round, sp_william, 3);
  insert into round (stage_id, ordinal, label) values (v_stage, 3, 'Ski Jump') returning id into v_round;
  insert into round_result (round_id, season_player_id, raw_score) values
    (v_round, sp_jakob, 4), (v_round, sp_jorgen, 2), (v_round, sp_tobias, 1), (v_round, sp_william, 3);
  insert into round (stage_id, ordinal, label) values (v_stage, 4, 'Curling') returning id into v_round;
  insert into round_result (round_id, season_player_id, raw_score) values
    (v_round, sp_jakob, 3), (v_round, sp_jorgen, 1), (v_round, sp_tobias, 4), (v_round, sp_william, 2);
  insert into round (stage_id, ordinal, label) values (v_stage, 5, 'Stone Skipping') returning id into v_round;
  insert into round_result (round_id, season_player_id, raw_score) values
    (v_round, sp_jakob, 2), (v_round, sp_jorgen, 1), (v_round, sp_tobias, 3), (v_round, sp_william, 4);
  insert into round (stage_id, ordinal, label) values (v_stage, 6, 'Ring of Fire') returning id into v_round;
  insert into round_result (round_id, season_player_id, raw_score) values
    (v_round, sp_jakob, 3), (v_round, sp_jorgen, 1), (v_round, sp_tobias, 4), (v_round, sp_william, 2);
  insert into round (stage_id, ordinal, label) values (v_stage, 7, 'Field Goal') returning id into v_round;
  insert into round_result (round_id, season_player_id, raw_score) values
    (v_round, sp_jakob, 2), (v_round, sp_jorgen, 3), (v_round, sp_tobias, 4), (v_round, sp_william, 1);
  insert into round (stage_id, ordinal, label) values (v_stage, 8, 'Royal Flush') returning id into v_round;
  insert into round_result (round_id, season_player_id, raw_score) values
    (v_round, sp_jakob, 2), (v_round, sp_jorgen, 1), (v_round, sp_tobias, 4), (v_round, sp_william, 3);
  insert into round (stage_id, ordinal, label) values (v_stage, 9, 'Basketball') returning id into v_round;
  insert into round_result (round_id, season_player_id, raw_score) values
    (v_round, sp_jakob, 2), (v_round, sp_jorgen, 1), (v_round, sp_tobias, 4), (v_round, sp_william, 3);
  insert into round (stage_id, ordinal, label) values (v_stage, 10, 'Darts') returning id into v_round;
  insert into round_result (round_id, season_player_id, raw_score) values
    (v_round, sp_jakob, 2), (v_round, sp_jorgen, 1), (v_round, sp_tobias, 4), (v_round, sp_william, 3);
  insert into round (stage_id, ordinal, label) values (v_stage, 11, 'Baseball') returning id into v_round;
  insert into round_result (round_id, season_player_id, raw_score) values
    (v_round, sp_jakob, 3), (v_round, sp_jorgen, 1), (v_round, sp_tobias, 2), (v_round, sp_william, 4);
  insert into round (stage_id, ordinal, label) values (v_stage, 12, 'Soccer') returning id into v_round;
  insert into round_result (round_id, season_player_id, raw_score) values
    (v_round, sp_jakob, 3), (v_round, sp_jorgen, 2), (v_round, sp_tobias, 4), (v_round, sp_william, 1);
  -- Sums: Jakob 30, Jørgen 16, Tobias 41, William 33.

  insert into game_result (game_id, season_player_id, placement, confirmed) values
    (v_game, sp_tobias,  1, true),
    (v_game, sp_william, 2, true),
    (v_game, sp_jakob,   3, true),
    (v_game, sp_jorgen,  4, true);

  ---------------------------------------------------------------------------
  -- SEASON RESULT
  -- Totals 20/20/24/16. Tobias 1st. Jakob & Jørgen tie on 20 — Jørgen takes
  -- 2nd on a Gen 6 random-match Pokémon Showdown tiebreak. William 4th.
  ---------------------------------------------------------------------------
  insert into season_result (season_id, season_player_id, placement, confirmed, note) values
    (v_season, sp_tobias,  1, true, null),
    (v_season, sp_jorgen,  2, true, 'Jakob og Jørgen endte begge på 20 poeng. Jørgen vant tiebreakeren med en Gen 6 random match på Pokémon Showdown.'),
    (v_season, sp_jakob,   3, true, null),
    (v_season, sp_william, 4, true, null);
end $$;


-- =============================================================================
-- SEASON 2  (2023-10-07)
-- Base ladder 7/4/2/1. Power-ups in play (Double Up, Safety Net, Gamba Time) —
-- all affect ONLY the user's own points (affected = used_by). Final totals
-- 32/32/39/30 (Jakob/Jørgen/Tobias/William). Tobias 1st. Jakob & Jørgen tie on
-- 32; Jørgen takes 2nd on a Table Tennis World Tour any% speedrun tiebreak.
--
-- Points reconcile as season_ladder[placement] + Σ power_up_use.points_delta:
--   Hearthstone  W7 Jø4+4 T2 J1+2  = 3/8/2/7
--   Curve Fever  T7 W4 Jø2 J1       = 1/2/7/4   (no power-ups)
--   The Sims 4   J7 T4 Jø2 W1       = 7/2/4/1   (no power-ups)
--   Warcraft 3   W7 J4 T2+1 Jø1     = 4/1/3/7
--   Poker        Jø7 T4 W2 J1       = 1/7/4/2   (Gamba Time 0)
--   Wreckfest    T7 J4+4 W2+2 Jø1+2 = 8/3/7/4
--   Total War    J7 T4+4 Jø2 W1+2   = 7/2/8/3   (Gamba Time 0)
--   League       Jø7 T4 W2 J1       = 1/7/4/2   (Gamba Time 0)
-- =============================================================================
do $$
declare
  v_season uuid;
  -- season_player ids
  sp_jakob   uuid;
  sp_jorgen  uuid;
  sp_tobias  uuid;
  sp_william uuid;
  -- power_up ids
  pu_double  uuid;
  pu_safety  uuid;
  pu_gamba   uuid;
  -- reusable ids
  v_game   uuid;
  v_stage  uuid;
  v_round  uuid;
begin
  ---------------------------------------------------------------------------
  -- Season + roster + ladder + power-up anchors
  ---------------------------------------------------------------------------
  insert into season (number, status, started_at, ended_at)
  values (2, 'complete', timestamptz '2023-10-07 10:00:00+02', timestamptz '2023-10-07 23:00:00+02')
  returning id into v_season;

  insert into season_player (season_id, player_id)
  select v_season, id from player where slug = 'jakob'   returning id into sp_jakob;
  insert into season_player (season_id, player_id)
  select v_season, id from player where slug = 'jorgen'  returning id into sp_jorgen;
  insert into season_player (season_id, player_id)
  select v_season, id from player where slug = 'tobias'  returning id into sp_tobias;
  insert into season_player (season_id, player_id)
  select v_season, id from player where slug = 'william' returning id into sp_william;

  insert into season_ladder (season_id, placement, points) values
    (v_season, 1, 7),
    (v_season, 2, 4),
    (v_season, 3, 2),
    (v_season, 4, 1);

  -- Power-up anchors. can_target_others=false for all: in S1–S4 every power-up
  -- only ever adjusts the USER's own points (affected_season_player_id =
  -- used_by_season_player_id). Gamba Time "predicts" another player, but that
  -- is a game mechanic, not a points-target — the schema target stays the user.
  insert into power_up (season_id, slug, is_curse, can_target_others)
  values (v_season, 'double-up', false, false) returning id into pu_double;
  insert into power_up (season_id, slug, is_curse, can_target_others)
  values (v_season, 'safety-net', false, false) returning id into pu_safety;
  insert into power_up (season_id, slug, is_curse, can_target_others)
  values (v_season, 'gamba-time', false, false) returning id into pu_gamba;

  -------------------------------------------------------------------------
  -- GAME 1 — Hearthstone (round-robin → final-bronze, bo1, win-loss)
  -- Group wins: William 3, Jørgen 2, Jakob 1, Tobias 0.
  -- Bronze: Tobias beat Jakob. Final: William beat Jørgen.
  -- Final: 1 William, 2 Jørgen, 3 Tobias, 4 Jakob.
  -------------------------------------------------------------------------
  insert into game (season_id, slug, ordinal, status)
  values (v_season, 'hearthstone', 1, 'complete') returning id into v_game;

  insert into stage (game_id, ordinal, kind) values (v_game, 1, 'round-robin')
    returning id into v_stage;
  -- Jakob>Tobias, William>Jørgen, Jørgen>Jakob, William>Tobias, William>Jakob, Jørgen>Tobias.
  perform pg_temp.seed_h2h_match(v_stage, null, 'bo1', sp_jakob,   sp_tobias,  array[1], array[0]);
  perform pg_temp.seed_h2h_match(v_stage, null, 'bo1', sp_william, sp_jorgen,  array[1], array[0]);
  perform pg_temp.seed_h2h_match(v_stage, null, 'bo1', sp_jorgen,  sp_jakob,   array[1], array[0]);
  perform pg_temp.seed_h2h_match(v_stage, null, 'bo1', sp_william, sp_tobias,  array[1], array[0]);
  perform pg_temp.seed_h2h_match(v_stage, null, 'bo1', sp_william, sp_jakob,   array[1], array[0]);
  perform pg_temp.seed_h2h_match(v_stage, null, 'bo1', sp_jorgen,  sp_tobias,  array[1], array[0]);

  -- Stage 2: final-bronze. BR Tobias>Jakob, F William>Jørgen.
  insert into stage (game_id, ordinal, kind) values (v_game, 2, 'final-bronze')
    returning id into v_stage;
  perform pg_temp.seed_h2h_match(v_stage, 'BR', 'bo1', sp_tobias,  sp_jakob,  array[1], array[0]);
  perform pg_temp.seed_h2h_match(v_stage, 'F',  'bo1', sp_william, sp_jorgen, array[1], array[0]);

  insert into game_result (game_id, season_player_id, placement, confirmed) values
    (v_game, sp_william, 1, true),
    (v_game, sp_jorgen,  2, true),
    (v_game, sp_tobias,  3, true),
    (v_game, sp_jakob,   4, true);

  -- Power-ups: Jørgen Double Up (+4), Jakob Safety Net (+2).
  insert into power_up_use (game_id, power_up_id, used_by_season_player_id, affected_season_player_id, points_delta) values
    (v_game, pu_double, sp_jorgen, sp_jorgen, 4),
    (v_game, pu_safety, sp_jakob,  sp_jakob,  2);

  -------------------------------------------------------------------------
  -- GAME 2 — Curve Fever (rounds, sum, 8 rounds)
  -- Placement points per round (4=best). Sums: Jakob 11, Jørgen 17,
  -- Tobias 32, William 20. Final: 1 Tobias, 2 William, 3 Jørgen, 4 Jakob.
  -- No power-ups.
  -------------------------------------------------------------------------
  insert into game (season_id, slug, ordinal, status)
  values (v_season, 'curve-fever', 2, 'complete') returning id into v_game;

  insert into stage (game_id, ordinal, kind, aggregation)
  values (v_game, 1, 'rounds', 'sum') returning id into v_stage;
  insert into round (stage_id, ordinal, label) values (v_stage, 1, 'Runde 1') returning id into v_round;
  insert into round_result (round_id, season_player_id, raw_score) values
    (v_round, sp_jakob, 2), (v_round, sp_jorgen, 1), (v_round, sp_tobias, 4), (v_round, sp_william, 3);
  insert into round (stage_id, ordinal, label) values (v_stage, 2, 'Runde 2') returning id into v_round;
  insert into round_result (round_id, season_player_id, raw_score) values
    (v_round, sp_jakob, 1), (v_round, sp_jorgen, 2), (v_round, sp_tobias, 4), (v_round, sp_william, 3);
  insert into round (stage_id, ordinal, label) values (v_stage, 3, 'Runde 3') returning id into v_round;
  insert into round_result (round_id, season_player_id, raw_score) values
    (v_round, sp_jakob, 2), (v_round, sp_jorgen, 1), (v_round, sp_tobias, 4), (v_round, sp_william, 3);
  insert into round (stage_id, ordinal, label) values (v_stage, 4, 'Runde 4') returning id into v_round;
  insert into round_result (round_id, season_player_id, raw_score) values
    (v_round, sp_jakob, 1), (v_round, sp_jorgen, 3), (v_round, sp_tobias, 4), (v_round, sp_william, 2);
  insert into round (stage_id, ordinal, label) values (v_stage, 5, 'Runde 5') returning id into v_round;
  insert into round_result (round_id, season_player_id, raw_score) values
    (v_round, sp_jakob, 1), (v_round, sp_jorgen, 3), (v_round, sp_tobias, 4), (v_round, sp_william, 2);
  insert into round (stage_id, ordinal, label) values (v_stage, 6, 'Runde 6') returning id into v_round;
  insert into round_result (round_id, season_player_id, raw_score) values
    (v_round, sp_jakob, 1), (v_round, sp_jorgen, 3), (v_round, sp_tobias, 4), (v_round, sp_william, 2);
  insert into round (stage_id, ordinal, label) values (v_stage, 7, 'Runde 7') returning id into v_round;
  insert into round_result (round_id, season_player_id, raw_score) values
    (v_round, sp_jakob, 2), (v_round, sp_jorgen, 1), (v_round, sp_tobias, 4), (v_round, sp_william, 3);
  insert into round (stage_id, ordinal, label) values (v_stage, 8, 'Runde 8') returning id into v_round;
  insert into round_result (round_id, season_player_id, raw_score) values
    (v_round, sp_jakob, 1), (v_round, sp_jorgen, 3), (v_round, sp_tobias, 4), (v_round, sp_william, 2);
  -- Sums: Jakob 11, Jørgen 17, Tobias 32, William 20.

  insert into game_result (game_id, season_player_id, placement, confirmed) values
    (v_game, sp_tobias,  1, true),
    (v_game, sp_william, 2, true),
    (v_game, sp_jorgen,  3, true),
    (v_game, sp_jakob,   4, true);

  -------------------------------------------------------------------------
  -- GAME 3 — The Sims 4 (score, high) — single rounds stage, one round.
  -- Simoleons: Jakob 20300, Tobias 19150, Jørgen 18990, William 16000.
  -- Final: 1 Jakob, 2 Tobias, 3 Jørgen, 4 William. No power-ups.
  -------------------------------------------------------------------------
  insert into game (season_id, slug, ordinal, status)
  values (v_season, 'the-sims-4', 3, 'complete') returning id into v_game;

  insert into stage (game_id, ordinal, kind, aggregation)
  values (v_game, 1, 'rounds', 'sum') returning id into v_stage;
  insert into round (stage_id, ordinal, label) values (v_stage, 1, 'Simoleons') returning id into v_round;
  insert into round_result (round_id, season_player_id, raw_score) values
    (v_round, sp_jakob, 20300), (v_round, sp_jorgen, 18990), (v_round, sp_tobias, 19150), (v_round, sp_william, 16000);

  insert into game_result (game_id, season_player_id, placement, confirmed) values
    (v_game, sp_jakob,   1, true),
    (v_game, sp_tobias,  2, true),
    (v_game, sp_jorgen,  3, true),
    (v_game, sp_william, 4, true);

  -------------------------------------------------------------------------
  -- GAME 4 — Warcraft 3 (placement) — 4-way FFA last-man-standing.
  -- Single rounds stage, one round, raw_score = 4..1 placement.
  -- Final: 1 William, 2 Jakob, 3 Tobias, 4 Jørgen.
  -------------------------------------------------------------------------
  insert into game (season_id, slug, ordinal, status)
  values (v_season, 'warcraft-3', 4, 'complete') returning id into v_game;

  insert into stage (game_id, ordinal, kind, aggregation)
  values (v_game, 1, 'rounds', 'sum') returning id into v_stage;
  insert into round (stage_id, ordinal, label) values (v_stage, 1, 'Free for all') returning id into v_round;
  insert into round_result (round_id, season_player_id, raw_score) values
    (v_round, sp_william, 4), (v_round, sp_jakob, 3), (v_round, sp_tobias, 2), (v_round, sp_jorgen, 1);

  insert into game_result (game_id, season_player_id, placement, confirmed) values
    (v_game, sp_william, 1, true),
    (v_game, sp_jakob,   2, true),
    (v_game, sp_tobias,  3, true),
    (v_game, sp_jorgen,  4, true);

  -- Power-up: Tobias Safety Net (+1).
  insert into power_up_use (game_id, power_up_id, used_by_season_player_id, affected_season_player_id, points_delta) values
    (v_game, pu_safety, sp_tobias, sp_tobias, 1);

  -------------------------------------------------------------------------
  -- GAME 5 — Poker (placement) — Texas Hold'em cash game, bust-out order.
  -- Single rounds stage, one round, raw_score = 4..1 placement.
  -- Final: 1 Jørgen, 2 Tobias, 3 William, 4 Jakob.
  -------------------------------------------------------------------------
  insert into game (season_id, slug, ordinal, status)
  values (v_season, 'poker', 5, 'complete') returning id into v_game;

  insert into stage (game_id, ordinal, kind, aggregation)
  values (v_game, 1, 'rounds', 'sum') returning id into v_stage;
  insert into round (stage_id, ordinal, label) values (v_stage, 1, 'Cash game') returning id into v_round;
  insert into round_result (round_id, season_player_id, raw_score) values
    (v_round, sp_jorgen, 4), (v_round, sp_tobias, 3), (v_round, sp_william, 2), (v_round, sp_jakob, 1);

  insert into game_result (game_id, season_player_id, placement, confirmed) values
    (v_game, sp_jorgen,  1, true),
    (v_game, sp_tobias,  2, true),
    (v_game, sp_william, 3, true),
    (v_game, sp_jakob,   4, true);

  -- Power-up: William Gamba Time (0 — prediction missed).
  insert into power_up_use (game_id, power_up_id, used_by_season_player_id, affected_season_player_id, points_delta) values
    (v_game, pu_gamba, sp_william, sp_william, 0);

  -------------------------------------------------------------------------
  -- GAME 6 — Wreckfest (rounds, sum, 10 tracks)
  -- raw_score per track = placement points + fastest-lap bonus, combined (lossy
  -- by design — see game-formats.md). Sums: Jakob 32, Jørgen 10, Tobias 37,
  -- William 31. Final: 1 Tobias, 2 Jakob, 3 William, 4 Jørgen.
  -------------------------------------------------------------------------
  insert into game (season_id, slug, ordinal, status)
  values (v_season, 'wreckfest', 6, 'complete') returning id into v_game;

  insert into stage (game_id, ordinal, kind, aggregation)
  values (v_game, 1, 'rounds', 'sum') returning id into v_stage;
  insert into round (stage_id, ordinal, label) values (v_stage, 1, 'Espedalen') returning id into v_round;
  insert into round_result (round_id, season_player_id, raw_score) values
    (v_round, sp_jakob, 2), (v_round, sp_jorgen, 1), (v_round, sp_tobias, 5), (v_round, sp_william, 3);
  insert into round (stage_id, ordinal, label) values (v_stage, 2, 'Dirt Devil Stadium') returning id into v_round;
  insert into round_result (round_id, season_player_id, raw_score) values
    (v_round, sp_jakob, 3), (v_round, sp_jorgen, 1), (v_round, sp_tobias, 5), (v_round, sp_william, 2);
  insert into round (stage_id, ordinal, label) values (v_stage, 3, 'Hill Street Circuit') returning id into v_round;
  insert into round_result (round_id, season_player_id, raw_score) values
    (v_round, sp_jakob, 4), (v_round, sp_jorgen, 1), (v_round, sp_tobias, 4), (v_round, sp_william, 2);
  insert into round (stage_id, ordinal, label) values (v_stage, 4, 'Rockfield Rough spot') returning id into v_round;
  insert into round_result (round_id, season_player_id, raw_score) values
    (v_round, sp_jakob, 4), (v_round, sp_jorgen, 1), (v_round, sp_tobias, 3), (v_round, sp_william, 3);
  insert into round (stage_id, ordinal, label) values (v_stage, 5, 'Sandstone') returning id into v_round;
  insert into round_result (round_id, season_player_id, raw_score) values
    (v_round, sp_jakob, 5), (v_round, sp_jorgen, 1), (v_round, sp_tobias, 3), (v_round, sp_william, 2);
  insert into round (stage_id, ordinal, label) values (v_stage, 6, 'Hellride') returning id into v_round;
  insert into round_result (round_id, season_player_id, raw_score) values
    (v_round, sp_jakob, 2), (v_round, sp_jorgen, 1), (v_round, sp_tobias, 3), (v_round, sp_william, 5);
  insert into round (stage_id, ordinal, label) values (v_stage, 7, 'Finncross') returning id into v_round;
  insert into round_result (round_id, season_player_id, raw_score) values
    (v_round, sp_jakob, 2), (v_round, sp_jorgen, 1), (v_round, sp_tobias, 5), (v_round, sp_william, 3);
  insert into round (stage_id, ordinal, label) values (v_stage, 8, 'Wrecknado') returning id into v_round;
  insert into round_result (round_id, season_player_id, raw_score) values
    (v_round, sp_jakob, 2), (v_round, sp_jorgen, 1), (v_round, sp_tobias, 4), (v_round, sp_william, 4);
  insert into round (stage_id, ordinal, label) values (v_stage, 9, 'Boulder') returning id into v_round;
  insert into round_result (round_id, season_player_id, raw_score) values
    (v_round, sp_jakob, 3), (v_round, sp_jorgen, 1), (v_round, sp_tobias, 3), (v_round, sp_william, 4);
  insert into round (stage_id, ordinal, label) values (v_stage, 10, 'Maasten moto center') returning id into v_round;
  insert into round_result (round_id, season_player_id, raw_score) values
    (v_round, sp_jakob, 5), (v_round, sp_jorgen, 1), (v_round, sp_tobias, 2), (v_round, sp_william, 3);
  -- Sums: Jakob 32, Jørgen 10, Tobias 37, William 31.

  insert into game_result (game_id, season_player_id, placement, confirmed) values
    (v_game, sp_tobias,  1, true),
    (v_game, sp_jakob,   2, true),
    (v_game, sp_william, 3, true),
    (v_game, sp_jorgen,  4, true);

  -- Power-ups: Jakob Double Up (+4), William Double Up (+2), Jørgen Safety Net (+2).
  insert into power_up_use (game_id, power_up_id, used_by_season_player_id, affected_season_player_id, points_delta) values
    (v_game, pu_double, sp_jakob,   sp_jakob,   4),
    (v_game, pu_double, sp_william, sp_william, 2),
    (v_game, pu_safety, sp_jorgen,  sp_jorgen,  2);

  -------------------------------------------------------------------------
  -- GAME 7 — Total War: Empire (double-elim-reset, bo1, win-loss)
  -- Seeds from AI speedrun: 1 Jakob, 2 Tobias, 3 Jørgen, 4 William.
  -- WB-SF1 Jakob>William, WB-SF2 Tobias>Jørgen, WB-F Jakob>Tobias,
  -- LB-R1 Jørgen>William, LB-F Tobias>Jørgen, GF Jakob>Tobias (no reset —
  -- the WB survivor won the first GF, so GF2 was never played).
  -- Final: 1 Jakob, 2 Tobias, 3 Jørgen, 4 William.
  -------------------------------------------------------------------------
  insert into game (season_id, slug, ordinal, status)
  values (v_season, 'total-war-empire', 7, 'complete') returning id into v_game;

  insert into stage (game_id, ordinal, kind) values (v_game, 1, 'double-elim-reset')
    returning id into v_stage;
  perform pg_temp.seed_h2h_match(v_stage, 'WB-SF1', 'bo1', sp_jakob,  sp_william, array[1], array[0]);
  perform pg_temp.seed_h2h_match(v_stage, 'WB-SF2', 'bo1', sp_tobias, sp_jorgen,  array[1], array[0]);
  perform pg_temp.seed_h2h_match(v_stage, 'WB-F',   'bo1', sp_jakob,  sp_tobias,  array[1], array[0]);
  perform pg_temp.seed_h2h_match(v_stage, 'LB-R1',  'bo1', sp_jorgen, sp_william, array[1], array[0]);
  -- LB-F and GF are rematches of earlier pairings in this stage (Tobias-Jørgen
  -- from WB-SF2; Jakob-Tobias from WB-F), so they carry leg=2 to satisfy the
  -- (stage, player_a, player_b, leg) unique key. slot_id still carries the
  -- bracket meaning; leg is just the meeting number of the pairing.
  perform pg_temp.seed_h2h_match(v_stage, 'LB-F',   'bo1', sp_tobias, sp_jorgen,  array[1], array[0], 2::smallint);
  perform pg_temp.seed_h2h_match(v_stage, 'GF',     'bo1', sp_jakob,  sp_tobias,  array[1], array[0], 2::smallint);

  insert into game_result (game_id, season_player_id, placement, confirmed) values
    (v_game, sp_jakob,   1, true),
    (v_game, sp_tobias,  2, true),
    (v_game, sp_jorgen,  3, true),
    (v_game, sp_william, 4, true);

  -- Power-ups: Tobias Double Up (+4), William Safety Net (+2),
  -- Jørgen Gamba Time (0 — prediction missed).
  insert into power_up_use (game_id, power_up_id, used_by_season_player_id, affected_season_player_id, points_delta) values
    (v_game, pu_double, sp_tobias,  sp_tobias,  4),
    (v_game, pu_safety, sp_william, sp_william, 2),
    (v_game, pu_gamba,  sp_jorgen,  sp_jorgen,  0);

  -------------------------------------------------------------------------
  -- GAME 8 — League of Legends (dual round-robin → final-bronze, bo3, win-loss)
  -- Mundo Dodgeball. Every pair plays twice (leg 1 + leg 2) in the group.
  -- Group match wins: Jørgen 5, Tobias 4, William 2, Jakob 1.
  -- Bronze: William beat Jakob. Final: Jørgen beat Tobias.
  -- Final: 1 Jørgen, 2 Tobias, 3 William, 4 Jakob.
  -------------------------------------------------------------------------
  insert into game (season_id, slug, ordinal, status)
  values (v_season, 'league-of-legends-02', 8, 'complete') returning id into v_game;

  insert into stage (game_id, ordinal, kind) values (v_game, 1, 'round-robin')
    returning id into v_stage;
  -- Leg 1 (first meeting of each pair):
  perform pg_temp.seed_h2h_match(v_stage, null, 'bo3', sp_tobias,  sp_jakob,   array[2], array[1], 1::smallint);
  perform pg_temp.seed_h2h_match(v_stage, null, 'bo3', sp_jorgen,  sp_william, array[2], array[0], 1::smallint);
  perform pg_temp.seed_h2h_match(v_stage, null, 'bo3', sp_jorgen,  sp_jakob,   array[2], array[1], 1::smallint);
  perform pg_temp.seed_h2h_match(v_stage, null, 'bo3', sp_william, sp_tobias,  array[2], array[1], 1::smallint);
  perform pg_temp.seed_h2h_match(v_stage, null, 'bo3', sp_jakob,   sp_william, array[2], array[0], 1::smallint);
  perform pg_temp.seed_h2h_match(v_stage, null, 'bo3', sp_jorgen,  sp_tobias,  array[2], array[1], 1::smallint);
  -- Leg 2 (second meeting of each pair):
  perform pg_temp.seed_h2h_match(v_stage, null, 'bo3', sp_tobias,  sp_jakob,   array[2], array[0], 2::smallint);
  perform pg_temp.seed_h2h_match(v_stage, null, 'bo3', sp_jorgen,  sp_william, array[2], array[0], 2::smallint);
  perform pg_temp.seed_h2h_match(v_stage, null, 'bo3', sp_jorgen,  sp_jakob,   array[2], array[1], 2::smallint);
  perform pg_temp.seed_h2h_match(v_stage, null, 'bo3', sp_tobias,  sp_william, array[2], array[1], 2::smallint);
  perform pg_temp.seed_h2h_match(v_stage, null, 'bo3', sp_william, sp_jakob,   array[2], array[1], 2::smallint);
  perform pg_temp.seed_h2h_match(v_stage, null, 'bo3', sp_tobias,  sp_jorgen,  array[2], array[0], 2::smallint);

  -- Stage 2: final-bronze. BR William>Jakob (2-1), F Jørgen>Tobias (2-1).
  insert into stage (game_id, ordinal, kind) values (v_game, 2, 'final-bronze')
    returning id into v_stage;
  perform pg_temp.seed_h2h_match(v_stage, 'BR', 'bo3', sp_william, sp_jakob,  array[2], array[1]);
  perform pg_temp.seed_h2h_match(v_stage, 'F',  'bo3', sp_jorgen,  sp_tobias, array[2], array[1]);

  insert into game_result (game_id, season_player_id, placement, confirmed) values
    (v_game, sp_jorgen,  1, true),
    (v_game, sp_tobias,  2, true),
    (v_game, sp_william, 3, true),
    (v_game, sp_jakob,   4, true);

  -- Power-ups: Jakob Gamba Time (0), Tobias Gamba Time (0) — both missed.
  insert into power_up_use (game_id, power_up_id, used_by_season_player_id, affected_season_player_id, points_delta) values
    (v_game, pu_gamba, sp_jakob,  sp_jakob,  0),
    (v_game, pu_gamba, sp_tobias, sp_tobias, 0);

  ---------------------------------------------------------------------------
  -- SEASON RESULT
  -- Totals (ladder + power-ups) 32/32/39/30. Tobias 1st. Jakob & Jørgen tie on
  -- 32 — Jørgen takes 2nd on a Table Tennis World Tour any% speedrun tiebreak.
  -- William 4th.
  ---------------------------------------------------------------------------
  insert into season_result (season_id, season_player_id, placement, confirmed, note) values
    (v_season, sp_tobias,  1, true, null),
    (v_season, sp_jorgen,  2, true, 'Jakob og Jørgen endte begge på 32 poeng. Jørgen vant tiebreakeren med en any%-speedrun av Table Tennis World Tour.'),
    (v_season, sp_jakob,   3, true, null),
    (v_season, sp_william, 4, true, null);
end $$;


-- =============================================================================
-- SEASON 3  (2024-03-16 — 2024-03-17, two days)
-- Base ladder 8/5/3/1. Power-ups: Double-Edged Sword (doubles, 3-cost),
-- Crystal Ballin' (+2 if you call the full finishing order), Accounting Error
-- (game-specific improvement). All affect ONLY the user's own points
-- (affected = used_by). Final totals 75/33/58/20 (Jakob/Jørgen/Tobias/William).
-- Jakob champion outright — no season-level tie.
--
-- Points reconcile as season_ladder[placement] + Σ power_up_use.points_delta:
--   WoW            J8 Jø1 T3 W5      (Accounting Error 0 ×3)
--   BattleBlock    J5 Jø3 T8 W1
--   KSP            J10 Jø5 T7 W3     (Crystal Ballin' +2 ×4)
--   GeoGuessr      J5 Jø8 T1 W3
--   Jump King      J5 Jø1 T8 W3
--   Planet Coaster J13 Jø5 T3 W1     (Jakob DES +5; Jørgen Accounting 0)
--   War Thunder    J8 Jø3 T5 W1
--   Hollow Knight  J5 Jø1 T13 W3     (Tobias DES +5)
--   Pummel Party   J8 Jø3 T5 W-1     (William DES -2)
--   PUBG           J8 Jø3 T5 W1      (Jørgen DES 0)
-- =============================================================================
do $$
declare
  v_season uuid;
  -- season_player ids
  sp_jakob   uuid;
  sp_jorgen  uuid;
  sp_tobias  uuid;
  sp_william uuid;
  -- power_up ids
  pu_sword  uuid;
  pu_ball   uuid;
  pu_acct   uuid;
  -- reusable ids
  v_game   uuid;
  v_stage  uuid;
  v_round  uuid;
begin
  ---------------------------------------------------------------------------
  -- Season + roster + ladder + power-up anchors
  ---------------------------------------------------------------------------
  insert into season (number, status, started_at, ended_at)
  values (3, 'complete', timestamptz '2024-03-16 10:00:00+01', timestamptz '2024-03-17 23:00:00+01')
  returning id into v_season;

  insert into season_player (season_id, player_id)
  select v_season, id from player where slug = 'jakob'   returning id into sp_jakob;
  insert into season_player (season_id, player_id)
  select v_season, id from player where slug = 'jorgen'  returning id into sp_jorgen;
  insert into season_player (season_id, player_id)
  select v_season, id from player where slug = 'tobias'  returning id into sp_tobias;
  insert into season_player (season_id, player_id)
  select v_season, id from player where slug = 'william' returning id into sp_william;

  insert into season_ladder (season_id, placement, points) values
    (v_season, 1, 8),
    (v_season, 2, 5),
    (v_season, 3, 3),
    (v_season, 4, 1);

  -- Power-up anchors. can_target_others=false for all (same rule as S1–S4:
  -- every power-up only adjusts the USER's own points).
  insert into power_up (season_id, slug, is_curse, can_target_others)
  values (v_season, 'double-edged-sword', false, false) returning id into pu_sword;
  insert into power_up (season_id, slug, is_curse, can_target_others)
  values (v_season, 'crystal-ballin', false, false) returning id into pu_ball;
  insert into power_up (season_id, slug, is_curse, can_target_others)
  values (v_season, 'accounting-error', false, false) returning id into pu_acct;

  -------------------------------------------------------------------------
  -- GAME 1 — World of Warcraft (score, high — gold) single rounds stage.
  -- Gold: Jakob 1396, William 1210, Tobias 382, Jørgen 175.
  -- Final: 1 Jakob, 2 William, 3 Tobias, 4 Jørgen.
  -------------------------------------------------------------------------
  insert into game (season_id, slug, ordinal, status)
  values (v_season, 'world-of-warcraft', 1, 'complete') returning id into v_game;

  insert into stage (game_id, ordinal, kind, aggregation)
  values (v_game, 1, 'rounds', 'sum') returning id into v_stage;
  insert into round (stage_id, ordinal, label) values (v_stage, 1, 'Gull') returning id into v_round;
  insert into round_result (round_id, season_player_id, raw_score) values
    (v_round, sp_jakob, 1396), (v_round, sp_jorgen, 175), (v_round, sp_tobias, 382), (v_round, sp_william, 1210);

  insert into game_result (game_id, season_player_id, placement, confirmed) values
    (v_game, sp_jakob,   1, true),
    (v_game, sp_william, 2, true),
    (v_game, sp_tobias,  3, true),
    (v_game, sp_jorgen,  4, true);

  -- Power-ups: Jakob, Tobias, William each used Accounting Error here (0 each).
  insert into power_up_use (game_id, power_up_id, used_by_season_player_id, affected_season_player_id, points_delta) values
    (v_game, pu_acct, sp_jakob,   sp_jakob,   0),
    (v_game, pu_acct, sp_tobias,  sp_tobias,  0),
    (v_game, pu_acct, sp_william, sp_william, 0);

  -------------------------------------------------------------------------
  -- GAME 2 — BattleBlock Theater (rounds, sum, 11 levels)
  -- Per-level combined points (clear/gems/yarn minus deaths), summary table.
  -- The detailed sub-scores are intentionally not stored (lossy flatten, as
  -- with S1 OSRS / S2 Wreckfest). Sums: Jakob 30, Jørgen -11, Tobias 43,
  -- William -14. Final: 1 Tobias, 2 Jakob, 3 Jørgen, 4 William.
  -------------------------------------------------------------------------
  insert into game (season_id, slug, ordinal, status)
  values (v_season, 'battleblock-theater', 2, 'complete') returning id into v_game;

  insert into stage (game_id, ordinal, kind, aggregation)
  values (v_game, 1, 'rounds', 'sum') returning id into v_stage;
  insert into round (stage_id, ordinal, label) values (v_stage, 1, 'Level 1') returning id into v_round;
  insert into round_result (round_id, season_player_id, raw_score) values
    (v_round, sp_jakob, 4), (v_round, sp_jorgen, 3), (v_round, sp_tobias, 4), (v_round, sp_william, 3);
  insert into round (stage_id, ordinal, label) values (v_stage, 2, 'Level 2') returning id into v_round;
  insert into round_result (round_id, season_player_id, raw_score) values
    (v_round, sp_jakob, 3), (v_round, sp_jorgen, 0), (v_round, sp_tobias, 4), (v_round, sp_william, 1);
  insert into round (stage_id, ordinal, label) values (v_stage, 3, 'Level 3') returning id into v_round;
  insert into round_result (round_id, season_player_id, raw_score) values
    (v_round, sp_jakob, 4), (v_round, sp_jorgen, 3), (v_round, sp_tobias, 4), (v_round, sp_william, -1);
  insert into round (stage_id, ordinal, label) values (v_stage, 4, 'Level 4') returning id into v_round;
  insert into round_result (round_id, season_player_id, raw_score) values
    (v_round, sp_jakob, 3), (v_round, sp_jorgen, 1), (v_round, sp_tobias, 4), (v_round, sp_william, 1);
  insert into round (stage_id, ordinal, label) values (v_stage, 5, 'Level 5') returning id into v_round;
  insert into round_result (round_id, season_player_id, raw_score) values
    (v_round, sp_jakob, 3), (v_round, sp_jorgen, 1), (v_round, sp_tobias, 4), (v_round, sp_william, 1);
  insert into round (stage_id, ordinal, label) values (v_stage, 6, 'Level 6') returning id into v_round;
  insert into round_result (round_id, season_player_id, raw_score) values
    (v_round, sp_jakob, 4), (v_round, sp_jorgen, 0), (v_round, sp_tobias, 4), (v_round, sp_william, 1);
  insert into round (stage_id, ordinal, label) values (v_stage, 7, 'Level 7') returning id into v_round;
  insert into round_result (round_id, season_player_id, raw_score) values
    (v_round, sp_jakob, 2), (v_round, sp_jorgen, -1), (v_round, sp_tobias, 3), (v_round, sp_william, 0);
  insert into round (stage_id, ordinal, label) values (v_stage, 8, 'Level 8') returning id into v_round;
  insert into round_result (round_id, season_player_id, raw_score) values
    (v_round, sp_jakob, 2), (v_round, sp_jorgen, 0), (v_round, sp_tobias, 4), (v_round, sp_william, -3);
  insert into round (stage_id, ordinal, label) values (v_stage, 9, 'Level 9') returning id into v_round;
  insert into round_result (round_id, season_player_id, raw_score) values
    (v_round, sp_jakob, 2), (v_round, sp_jorgen, -8), (v_round, sp_tobias, 4), (v_round, sp_william, -7);
  insert into round (stage_id, ordinal, label) values (v_stage, 10, 'Boss 1') returning id into v_round;
  insert into round_result (round_id, season_player_id, raw_score) values
    (v_round, sp_jakob, 1), (v_round, sp_jorgen, -3), (v_round, sp_tobias, 4), (v_round, sp_william, -3);
  insert into round (stage_id, ordinal, label) values (v_stage, 11, 'Boss 2') returning id into v_round;
  insert into round_result (round_id, season_player_id, raw_score) values
    (v_round, sp_jakob, 2), (v_round, sp_jorgen, -7), (v_round, sp_tobias, 4), (v_round, sp_william, -7);
  -- Sums: Jakob 30, Jørgen -11, Tobias 43, William -14.

  insert into game_result (game_id, season_player_id, placement, confirmed) values
    (v_game, sp_tobias,  1, true),
    (v_game, sp_jakob,   2, true),
    (v_game, sp_jorgen,  3, true),
    (v_game, sp_william, 4, true);

  -------------------------------------------------------------------------
  -- GAME 3 — Kerbal Space Program (score, high — techs unlocked) single round.
  -- Techs: Jakob 37, Tobias 18, Jørgen 11, William 1.
  -- Final: 1 Jakob, 2 Tobias, 3 Jørgen, 4 William.
  -------------------------------------------------------------------------
  insert into game (season_id, slug, ordinal, status)
  values (v_season, 'kerbal-space-program', 3, 'complete') returning id into v_game;

  insert into stage (game_id, ordinal, kind, aggregation)
  values (v_game, 1, 'rounds', 'sum') returning id into v_stage;
  insert into round (stage_id, ordinal, label) values (v_stage, 1, 'Techs') returning id into v_round;
  insert into round_result (round_id, season_player_id, raw_score) values
    (v_round, sp_jakob, 37), (v_round, sp_jorgen, 11), (v_round, sp_tobias, 18), (v_round, sp_william, 1);

  insert into game_result (game_id, season_player_id, placement, confirmed) values
    (v_game, sp_jakob,   1, true),
    (v_game, sp_tobias,  2, true),
    (v_game, sp_jorgen,  3, true),
    (v_game, sp_william, 4, true);

  -- Power-ups: all four used Crystal Ballin' here (+2 each).
  insert into power_up_use (game_id, power_up_id, used_by_season_player_id, affected_season_player_id, points_delta) values
    (v_game, pu_ball, sp_jakob,   sp_jakob,   2),
    (v_game, pu_ball, sp_jorgen,  sp_jorgen,  2),
    (v_game, pu_ball, sp_tobias,  sp_tobias,  2),
    (v_game, pu_ball, sp_william, sp_william, 2);

  -------------------------------------------------------------------------
  -- GAME 4 — GeoGuessr (score, high — number of 1st-place round finishes)
  -- single rounds stage. #1sts: Jørgen 10, Jakob 5, William 2, Tobias 0.
  -- Final: 1 Jørgen, 2 Jakob, 3 William, 4 Tobias.
  -------------------------------------------------------------------------
  insert into game (season_id, slug, ordinal, status)
  values (v_season, 'geoguessr', 4, 'complete') returning id into v_game;

  insert into stage (game_id, ordinal, kind, aggregation)
  values (v_game, 1, 'rounds', 'sum') returning id into v_stage;
  insert into round (stage_id, ordinal, label) values (v_stage, 1, 'Førsteplasser') returning id into v_round;
  insert into round_result (round_id, season_player_id, raw_score) values
    (v_round, sp_jakob, 5), (v_round, sp_jorgen, 10), (v_round, sp_tobias, 0), (v_round, sp_william, 2);

  insert into game_result (game_id, season_player_id, placement, confirmed) values
    (v_game, sp_jorgen,  1, true),
    (v_game, sp_jakob,   2, true),
    (v_game, sp_william, 3, true),
    (v_game, sp_tobias,  4, true);

  -------------------------------------------------------------------------
  -- GAME 5 — Jump King (placement — highest point after 60 min) single round.
  -- raw_score = 4..1 placement. Final: 1 Tobias, 2 Jakob, 3 William, 4 Jørgen.
  -------------------------------------------------------------------------
  insert into game (season_id, slug, ordinal, status)
  values (v_season, 'jump-king', 5, 'complete') returning id into v_game;

  insert into stage (game_id, ordinal, kind, aggregation)
  values (v_game, 1, 'rounds', 'sum') returning id into v_stage;
  insert into round (stage_id, ordinal, label) values (v_stage, 1, 'Høyde') returning id into v_round;
  insert into round_result (round_id, season_player_id, raw_score) values
    (v_round, sp_tobias, 4), (v_round, sp_jakob, 3), (v_round, sp_william, 2), (v_round, sp_jorgen, 1);

  insert into game_result (game_id, season_player_id, placement, confirmed) values
    (v_game, sp_tobias,  1, true),
    (v_game, sp_jakob,   2, true),
    (v_game, sp_william, 3, true),
    (v_game, sp_jorgen,  4, true);

  -------------------------------------------------------------------------
  -- GAME 6 — Planet Coaster (score, high — park visitors @ 60 min) single round.
  -- Visitors: Jakob 3985, Jørgen 2222, Tobias 1800, William 169.
  -- Final: 1 Jakob, 2 Jørgen, 3 Tobias, 4 William.
  -------------------------------------------------------------------------
  insert into game (season_id, slug, ordinal, status)
  values (v_season, 'planet-coaster', 6, 'complete') returning id into v_game;

  insert into stage (game_id, ordinal, kind, aggregation)
  values (v_game, 1, 'rounds', 'sum') returning id into v_stage;
  insert into round (stage_id, ordinal, label) values (v_stage, 1, 'Besøkende') returning id into v_round;
  insert into round_result (round_id, season_player_id, raw_score) values
    (v_round, sp_jakob, 3985), (v_round, sp_jorgen, 2222), (v_round, sp_tobias, 1800), (v_round, sp_william, 169);

  insert into game_result (game_id, season_player_id, placement, confirmed) values
    (v_game, sp_jakob,   1, true),
    (v_game, sp_jorgen,  2, true),
    (v_game, sp_tobias,  3, true),
    (v_game, sp_william, 4, true);

  -- Power-ups: Jakob Double-Edged Sword (+5, recorded delta); Jørgen Accounting
  -- Error (0).
  insert into power_up_use (game_id, power_up_id, used_by_season_player_id, affected_season_player_id, points_delta) values
    (v_game, pu_sword, sp_jakob,  sp_jakob,  5),
    (v_game, pu_acct,  sp_jorgen, sp_jorgen, 0);

  -------------------------------------------------------------------------
  -- GAME 7 — War Thunder (round-robin → double-elim-reset, win-loss)
  -- Group bo1 for seeding: Jakob 3, Tobias 2, Jørgen 1, William 0.
  -- Seeds: 1 Jakob, 2 Tobias, 3 Jørgen, 4 William.
  -- WB-SF1 Jakob>William (bo3 2-0), WB-SF2 Tobias>Jørgen (bo3 2-0),
  -- WB-F Tobias>Jakob (bo3 2-1 — Jakob drops to LB),
  -- LB-R1 Jørgen>William (bo3 2-0), LB-F Jakob>Jørgen (bo5 3-0),
  -- GF Jakob>Tobias (bo5 3-0, forces reset), GF2 Jakob>Tobias (bo5 3-0).
  -- Jakob-Tobias meet three times in this stage (WB-F leg 1, GF leg 2,
  -- GF2 leg 3). Final: 1 Jakob, 2 Tobias, 3 Jørgen, 4 William.
  -------------------------------------------------------------------------
  insert into game (season_id, slug, ordinal, status)
  values (v_season, 'war-thunder', 7, 'complete') returning id into v_game;

  -- Stage 1: round-robin seeding (bo1).
  insert into stage (game_id, ordinal, kind) values (v_game, 1, 'round-robin')
    returning id into v_stage;
  -- Jakob>Tobias, Jørgen>William, Jakob>Jørgen, Tobias>William, Jakob>William, Tobias>Jørgen.
  perform pg_temp.seed_h2h_match(v_stage, null, 'bo1', sp_jakob,  sp_tobias,  array[1], array[0]);
  perform pg_temp.seed_h2h_match(v_stage, null, 'bo1', sp_jorgen, sp_william, array[1], array[0]);
  perform pg_temp.seed_h2h_match(v_stage, null, 'bo1', sp_jakob,  sp_jorgen,  array[1], array[0]);
  perform pg_temp.seed_h2h_match(v_stage, null, 'bo1', sp_tobias, sp_william, array[1], array[0]);
  perform pg_temp.seed_h2h_match(v_stage, null, 'bo1', sp_jakob,  sp_william, array[1], array[0]);
  perform pg_temp.seed_h2h_match(v_stage, null, 'bo1', sp_tobias, sp_jorgen,  array[1], array[0]);

  -- Stage 2: double-elim-reset. Series scores from the bracket sheet.
  -- GF and GF2 are rematches of the WB-F pairing (Jakob-Tobias), so they carry
  -- leg=2 and leg=3 to satisfy the (stage, player_a, player_b, leg) unique key.
  insert into stage (game_id, ordinal, kind) values (v_game, 2, 'double-elim-reset')
    returning id into v_stage;
  perform pg_temp.seed_h2h_match(v_stage, 'WB-SF1', 'bo3', sp_jakob,  sp_william, array[2], array[0]);
  perform pg_temp.seed_h2h_match(v_stage, 'WB-SF2', 'bo3', sp_tobias, sp_jorgen,  array[2], array[0]);
  perform pg_temp.seed_h2h_match(v_stage, 'WB-F',   'bo3', sp_tobias, sp_jakob,   array[2], array[1]);
  perform pg_temp.seed_h2h_match(v_stage, 'LB-R1',  'bo3', sp_jorgen, sp_william, array[2], array[0]);
  perform pg_temp.seed_h2h_match(v_stage, 'LB-F',   'bo5', sp_jakob,  sp_jorgen,  array[3], array[0]);
  perform pg_temp.seed_h2h_match(v_stage, 'GF',     'bo5', sp_jakob,  sp_tobias,  array[3], array[0], 2::smallint);
  perform pg_temp.seed_h2h_match(v_stage, 'GF2',    'bo5', sp_jakob,  sp_tobias,  array[3], array[0], 3::smallint);

  insert into game_result (game_id, season_player_id, placement, confirmed) values
    (v_game, sp_jakob,   1, true),
    (v_game, sp_tobias,  2, true),
    (v_game, sp_jorgen,  3, true),
    (v_game, sp_william, 4, true);

  -------------------------------------------------------------------------
  -- GAME 8 — Hollow Knight (placement — fastest boss-rush time) single round.
  -- Modeled as placement (DB has no score direction; see game-formats.md).
  -- raw_score = 4..1 placement. Final: 1 Tobias, 2 Jakob, 3 William, 4 Jørgen.
  -------------------------------------------------------------------------
  insert into game (season_id, slug, ordinal, status)
  values (v_season, 'hollow-knight', 8, 'complete') returning id into v_game;

  insert into stage (game_id, ordinal, kind, aggregation)
  values (v_game, 1, 'rounds', 'sum') returning id into v_stage;
  insert into round (stage_id, ordinal, label) values (v_stage, 1, 'Boss rush') returning id into v_round;
  insert into round_result (round_id, season_player_id, raw_score) values
    (v_round, sp_tobias, 4), (v_round, sp_jakob, 3), (v_round, sp_william, 2), (v_round, sp_jorgen, 1);

  insert into game_result (game_id, season_player_id, placement, confirmed) values
    (v_game, sp_tobias,  1, true),
    (v_game, sp_jakob,   2, true),
    (v_game, sp_william, 3, true),
    (v_game, sp_jorgen,  4, true);

  -- Power-up: Tobias Double-Edged Sword (+5, recorded delta).
  insert into power_up_use (game_id, power_up_id, used_by_season_player_id, affected_season_player_id, points_delta) values
    (v_game, pu_sword, sp_tobias, sp_tobias, 5);

  -------------------------------------------------------------------------
  -- GAME 9 — Pummel Party (score, high — cumulative minigame score) single round.
  -- Score: Jakob 476, Tobias 471, Jørgen 424, William 422.
  -- Final: 1 Jakob, 2 Tobias, 3 Jørgen, 4 William.
  -------------------------------------------------------------------------
  insert into game (season_id, slug, ordinal, status)
  values (v_season, 'pummel-party', 9, 'complete') returning id into v_game;

  insert into stage (game_id, ordinal, kind, aggregation)
  values (v_game, 1, 'rounds', 'sum') returning id into v_stage;
  insert into round (stage_id, ordinal, label) values (v_stage, 1, 'Score') returning id into v_round;
  insert into round_result (round_id, season_player_id, raw_score) values
    (v_round, sp_jakob, 476), (v_round, sp_jorgen, 424), (v_round, sp_tobias, 471), (v_round, sp_william, 422);

  insert into game_result (game_id, season_player_id, placement, confirmed) values
    (v_game, sp_jakob,   1, true),
    (v_game, sp_tobias,  2, true),
    (v_game, sp_jorgen,  3, true),
    (v_game, sp_william, 4, true);

  -- Power-up: William Double-Edged Sword (-2, recorded delta — a net penalty
  -- on his last-place finish here).
  insert into power_up_use (game_id, power_up_id, used_by_season_player_id, affected_season_player_id, points_delta) values
    (v_game, pu_sword, sp_william, sp_william, -2);

  -------------------------------------------------------------------------
  -- GAME 10 — PUBG (placement — last man standing) single rounds stage.
  -- raw_score = 4..1 placement. Final: 1 Jakob, 2 Tobias, 3 Jørgen, 4 William.
  -------------------------------------------------------------------------
  insert into game (season_id, slug, ordinal, status)
  values (v_season, 'pubg', 10, 'complete') returning id into v_game;

  insert into stage (game_id, ordinal, kind, aggregation)
  values (v_game, 1, 'rounds', 'sum') returning id into v_stage;
  insert into round (stage_id, ordinal, label) values (v_stage, 1, 'Battle Royale') returning id into v_round;
  insert into round_result (round_id, season_player_id, raw_score) values
    (v_round, sp_jakob, 4), (v_round, sp_tobias, 3), (v_round, sp_jorgen, 2), (v_round, sp_william, 1);

  insert into game_result (game_id, season_player_id, placement, confirmed) values
    (v_game, sp_jakob,   1, true),
    (v_game, sp_tobias,  2, true),
    (v_game, sp_jorgen,  3, true),
    (v_game, sp_william, 4, true);

  -- Power-up: Jørgen Double-Edged Sword (0 — recorded delta).
  insert into power_up_use (game_id, power_up_id, used_by_season_player_id, affected_season_player_id, points_delta) values
    (v_game, pu_sword, sp_jorgen, sp_jorgen, 0);

  ---------------------------------------------------------------------------
  -- SEASON RESULT
  -- Totals (ladder + power-ups) 75/33/58/20. Jakob champion outright; no tie.
  ---------------------------------------------------------------------------
  insert into season_result (season_id, season_player_id, placement, confirmed, note) values
    (v_season, sp_jakob,   1, true, null),
    (v_season, sp_tobias,  2, true, null),
    (v_season, sp_jorgen,  3, true, null),
    (v_season, sp_william, 4, true, null);
end $$;


-- =============================================================================
-- SEASON 4  (2025-12-13 — 2025-12-14, two days)
-- Base ladder 8/5/3/1. Eight power-ups + four curses available; every one only
-- ever adjusts the USER's own points (affected = used_by, can_target_others =
-- false). Final totals 49/29/47/22 (Jakob/Jørgen/Tobias/William). Jakob
-- champion outright; no season-level tie.
--
-- Two formats appear here for the first time:
--  • rank-then-sum rounds stages (Ratz Instagib kills, Trombone song scores):
--    raw_score stores the REAL per-round number; standings rank each round
--    N..1 and sum the rank points. The stored raw scores are lossless; the
--    4/3/2/1 points are derived, never stored.
--  • a round-robin with a "swiss finish" (2XKO): the full round-robin plus one
--    extra rematch (Jakob–William) carried on match.leg=2 in the SAME stage.
--
-- Points reconcile as season_ladder[placement] + Σ power_up_use.points_delta:
--   LoL           J5 Jø8 T3 W0      (William Sucks to Suck -1)
--   PEAK          J8 Jø5 T3 W1
--   Ratz Instagib J5 Jø1 T8 W3      (STE ×2 + Power-up Cloner, all 0)
--   Trombone      J5 Jø3 T8 W1      (Sucks to Suck 0; Unsuccessful Tax 0)
--   Counter-Strike J5 Jø4 T8 W1     (Jørgen Safety Net +1; others 0)
--   Garry's Mod   J12 Jø3 T6 W3     (Jakob DES +4; Tobias Wide Net +1; William Safety Net +2)
--   FC25          J8 Jø1 T3 W7      (William Back to Back +2; Power-up Cloner 0)
--   2XKO          J1 Jø4 T8 W6      (Jørgen Wide Net +1; William DES +1)
-- =============================================================================
do $$
declare
  v_season uuid;
  -- season_player ids
  sp_jakob   uuid;
  sp_jorgen  uuid;
  sp_tobias  uuid;
  sp_william uuid;
  -- power_up ids (all eight power-ups + four curses available this season)
  pu_safety   uuid;
  pu_gamba    uuid;
  pu_sword    uuid;
  pu_ball     uuid;
  pu_tax      uuid;
  pu_cloner   uuid;
  pu_widenet  uuid;
  pu_b2b      uuid;
  cu_untax    uuid;
  cu_sucks    uuid;
  cu_alleg    uuid;
  cu_gambler  uuid;
  -- reusable ids
  v_game   uuid;
  v_stage  uuid;
  v_round  uuid;
begin
  ---------------------------------------------------------------------------
  -- Season + roster + ladder + power-up anchors
  ---------------------------------------------------------------------------
  insert into season (number, status, started_at, ended_at)
  values (4, 'complete', timestamptz '2025-12-13 10:00:00+01', timestamptz '2025-12-14 23:00:00+01')
  returning id into v_season;

  insert into season_player (season_id, player_id)
  select v_season, id from player where slug = 'jakob'   returning id into sp_jakob;
  insert into season_player (season_id, player_id)
  select v_season, id from player where slug = 'jorgen'  returning id into sp_jorgen;
  insert into season_player (season_id, player_id)
  select v_season, id from player where slug = 'tobias'  returning id into sp_tobias;
  insert into season_player (season_id, player_id)
  select v_season, id from player where slug = 'william' returning id into sp_william;

  insert into season_ladder (season_id, placement, points) values
    (v_season, 1, 8),
    (v_season, 2, 5),
    (v_season, 3, 3),
    (v_season, 4, 1);

  -- Power-up anchors. All twelve are seeded (the full S4 roster of eight
  -- power-ups + four curses), can_target_others=false for every one: this
  -- season every power-up/curse only ever adjusts the USER's own points.
  insert into power_up (season_id, slug, is_curse, can_target_others)
  values (v_season, 'safety-net', false, false) returning id into pu_safety;
  insert into power_up (season_id, slug, is_curse, can_target_others)
  values (v_season, 'gamba-time', false, false) returning id into pu_gamba;
  insert into power_up (season_id, slug, is_curse, can_target_others)
  values (v_season, 'double-edged-sword', false, false) returning id into pu_sword;
  insert into power_up (season_id, slug, is_curse, can_target_others)
  values (v_season, 'crystal-ballin', false, false) returning id into pu_ball;
  insert into power_up (season_id, slug, is_curse, can_target_others)
  values (v_season, 'successful-tax-evasion', false, false) returning id into pu_tax;
  insert into power_up (season_id, slug, is_curse, can_target_others)
  values (v_season, 'power-up-cloner', false, false) returning id into pu_cloner;
  insert into power_up (season_id, slug, is_curse, can_target_others)
  values (v_season, 'wide-net', false, false) returning id into pu_widenet;
  insert into power_up (season_id, slug, is_curse, can_target_others)
  values (v_season, 'back-to-back', false, false) returning id into pu_b2b;
  insert into power_up (season_id, slug, is_curse, can_target_others)
  values (v_season, 'unsuccessful-tax-evasion', true, false) returning id into cu_untax;
  insert into power_up (season_id, slug, is_curse, can_target_others)
  values (v_season, 'sucks-to-suck', true, false) returning id into cu_sucks;
  insert into power_up (season_id, slug, is_curse, can_target_others)
  values (v_season, 'not-beating-the-allegations', true, false) returning id into cu_alleg;
  insert into power_up (season_id, slug, is_curse, can_target_others)
  values (v_season, 'curse-of-the-gambler', true, false) returning id into cu_gambler;

  -------------------------------------------------------------------------
  -- GAME 1 — League of Legends (rounds, sum, 3 matches)
  -- Arena, rotating 2v2 teams; raw per-match score summed directly.
  -- Sums: Jakob 12, Jørgen 19, Tobias 12, William 11.
  -- Jakob & Tobias tie on 12 — Jakob takes 2nd on best-placements tiebreak.
  -- Final: 1 Jørgen, 2 Jakob, 3 Tobias, 4 William.
  -------------------------------------------------------------------------
  insert into game (season_id, slug, ordinal, status)
  values (v_season, 'league-of-legends-04', 1, 'complete') returning id into v_game;

  insert into stage (game_id, ordinal, kind, aggregation)
  values (v_game, 1, 'rounds', 'sum') returning id into v_stage;
  insert into round (stage_id, ordinal, label) values (v_stage, 1, 'Match 1') returning id into v_round;
  insert into round_result (round_id, season_player_id, raw_score) values
    (v_round, sp_jakob, 6), (v_round, sp_jorgen, 6), (v_round, sp_tobias, 2), (v_round, sp_william, 2);
  insert into round (stage_id, ordinal, label) values (v_stage, 2, 'Match 2') returning id into v_round;
  insert into round_result (round_id, season_player_id, raw_score) values
    (v_round, sp_jakob, 1), (v_round, sp_jorgen, 5), (v_round, sp_tobias, 5), (v_round, sp_william, 1);
  insert into round (stage_id, ordinal, label) values (v_stage, 3, 'Match 3') returning id into v_round;
  insert into round_result (round_id, season_player_id, raw_score) values
    (v_round, sp_jakob, 5), (v_round, sp_jorgen, 8), (v_round, sp_tobias, 5), (v_round, sp_william, 8);
  -- Sums: Jakob 12, Jørgen 19, Tobias 12, William 11.

  insert into game_result (game_id, season_player_id, placement, confirmed, note) values
    (v_game, sp_jorgen,  1, true, null),
    (v_game, sp_jakob,   2, true, 'Jakob og Tobias endte begge på 12 poeng. Jakob tok 2. plass på tiebreakeren om flest best-plasseringer gjennom de tre kampene.'),
    (v_game, sp_tobias,  3, true, null),
    (v_game, sp_william, 4, true, null);

  -- Curse: William Sucks to Suck (-1 — 4th place, curse took effect).
  insert into power_up_use (game_id, power_up_id, used_by_season_player_id, affected_season_player_id, points_delta) values
    (v_game, cu_sucks, sp_william, sp_william, -1);

  -------------------------------------------------------------------------
  -- GAME 2 — PEAK (score, high — altitude) single rounds stage, one round.
  -- Altitude: Jakob 569, Jørgen 448, Tobias 387, William 315.
  -- Final: 1 Jakob, 2 Jørgen, 3 Tobias, 4 William.
  -------------------------------------------------------------------------
  insert into game (season_id, slug, ordinal, status)
  values (v_season, 'peak', 2, 'complete') returning id into v_game;

  insert into stage (game_id, ordinal, kind, aggregation)
  values (v_game, 1, 'rounds', 'sum') returning id into v_stage;
  insert into round (stage_id, ordinal, label) values (v_stage, 1, 'Høyde') returning id into v_round;
  insert into round_result (round_id, season_player_id, raw_score) values
    (v_round, sp_jakob, 569), (v_round, sp_jorgen, 448), (v_round, sp_tobias, 387), (v_round, sp_william, 315);

  insert into game_result (game_id, season_player_id, placement, confirmed) values
    (v_game, sp_jakob,   1, true),
    (v_game, sp_jorgen,  2, true),
    (v_game, sp_tobias,  3, true),
    (v_game, sp_william, 4, true);

  -- Power-up: Jakob Power-up Cloner (0 — cloned Tobias's Successful Tax Evasion).
  -- Curse: Jørgen Unsuccessful Tax Evasion (0).
  insert into power_up_use (game_id, power_up_id, used_by_season_player_id, affected_season_player_id, points_delta) values
    (v_game, pu_cloner, sp_jakob,  sp_jakob,  0),
    (v_game, cu_untax,  sp_jorgen, sp_jorgen, 0);

  -------------------------------------------------------------------------
  -- GAME 3 — Ratz Instagib (rounds, rank-then-sum, 6 matches)
  -- raw_score = kills per match. Rank-then-sum (4..1 per match) gives:
  -- Jakob 19, Jørgen 7, Tobias 19, William 17 — Jakob & Tobias tie on 19,
  -- Tobias 1st on the sheet. Final: 1 Tobias, 2 Jakob, 3 William, 4 Jørgen.
  -------------------------------------------------------------------------
  insert into game (season_id, slug, ordinal, status)
  values (v_season, 'ratz-instagib', 3, 'complete') returning id into v_game;

  insert into stage (game_id, ordinal, kind, aggregation)
  values (v_game, 1, 'rounds', 'rank-then-sum') returning id into v_stage;
  insert into round (stage_id, ordinal, label) values (v_stage, 1, 'Match 1') returning id into v_round;
  insert into round_result (round_id, season_player_id, raw_score) values
    (v_round, sp_jakob, 50), (v_round, sp_jorgen, 34), (v_round, sp_tobias, 43), (v_round, sp_william, 35);
  insert into round (stage_id, ordinal, label) values (v_stage, 2, 'Match 2') returning id into v_round;
  insert into round_result (round_id, season_player_id, raw_score) values
    (v_round, sp_jakob, 45), (v_round, sp_jorgen, 31), (v_round, sp_tobias, 45), (v_round, sp_william, 51);
  insert into round (stage_id, ordinal, label) values (v_stage, 3, 'Match 3') returning id into v_round;
  insert into round_result (round_id, season_player_id, raw_score) values
    (v_round, sp_jakob, 48), (v_round, sp_jorgen, 24), (v_round, sp_tobias, 39), (v_round, sp_william, 34);
  insert into round (stage_id, ordinal, label) values (v_stage, 4, 'Match 4') returning id into v_round;
  insert into round_result (round_id, season_player_id, raw_score) values
    (v_round, sp_jakob, 41), (v_round, sp_jorgen, 32), (v_round, sp_tobias, 58), (v_round, sp_william, 50);
  insert into round (stage_id, ordinal, label) values (v_stage, 5, 'Match 5') returning id into v_round;
  insert into round_result (round_id, season_player_id, raw_score) values
    (v_round, sp_jakob, 48), (v_round, sp_jorgen, 23), (v_round, sp_tobias, 38), (v_round, sp_william, 23);
  insert into round (stage_id, ordinal, label) values (v_stage, 6, 'Match 6') returning id into v_round;
  insert into round_result (round_id, season_player_id, raw_score) values
    (v_round, sp_jakob, 44), (v_round, sp_jorgen, 29), (v_round, sp_tobias, 49), (v_round, sp_william, 63);
  -- Rank-then-sum points: Jakob 19, Jørgen 7, Tobias 19, William 17.

  insert into game_result (game_id, season_player_id, placement, confirmed, note) values
    (v_game, sp_tobias,  1, true, 'Jakob og Tobias endte begge på 19 poeng. Tobias tok 1. plass på tiebreakeren.'),
    (v_game, sp_jakob,   2, true, null),
    (v_game, sp_william, 3, true, null),
    (v_game, sp_jorgen,  4, true, null);

  -- Power-ups: Jakob Successful Tax Evasion (0), Jørgen Successful Tax Evasion
  -- (0), Tobias Power-up Cloner (0 — cloned Jørgen's Successful Tax Evasion).
  insert into power_up_use (game_id, power_up_id, used_by_season_player_id, affected_season_player_id, points_delta) values
    (v_game, pu_tax,    sp_jakob,  sp_jakob,  0),
    (v_game, pu_tax,    sp_jorgen, sp_jorgen, 0),
    (v_game, pu_cloner, sp_tobias, sp_tobias, 0);

  -------------------------------------------------------------------------
  -- GAME 4 — Trombone Champ (rounds rank-then-sum → final-bronze, bo3, score)
  -- Group: 8 songs, raw_score = real song score, rank-then-sum (4..1 per song).
  -- Group points: Jakob 24, Jørgen 14, Tobias 32, William 10.
  -- Top two (Tobias, Jakob) to the final; bottom two (Jørgen, William) to bronze.
  -- Final: Tobias beat Jakob 2-0. Bronze: Jørgen beat William 2-1.
  -- Final placements: 1 Tobias, 2 Jakob, 3 Jørgen, 4 William.
  -------------------------------------------------------------------------
  insert into game (season_id, slug, ordinal, status)
  values (v_season, 'trombone-champ', 4, 'complete') returning id into v_game;

  -- Stage 1: group (rounds, rank-then-sum). Real song scores stored as raw_score.
  insert into stage (game_id, ordinal, kind, aggregation)
  values (v_game, 1, 'rounds', 'rank-then-sum') returning id into v_stage;
  insert into round (stage_id, ordinal, label) values (v_stage, 1, 'Jasmine Flower') returning id into v_round;
  insert into round_result (round_id, season_player_id, raw_score) values
    (v_round, sp_jakob, 3821420), (v_round, sp_jorgen, 3739710), (v_round, sp_tobias, 4135640), (v_round, sp_william, 3567590);
  insert into round (stage_id, ordinal, label) values (v_stage, 2, 'Rising Sun Blues') returning id into v_round;
  insert into round_result (round_id, season_player_id, raw_score) values
    (v_round, sp_jakob, 4798370), (v_round, sp_jorgen, 4284440), (v_round, sp_tobias, 4810560), (v_round, sp_william, 4399590);
  insert into round (stage_id, ordinal, label) values (v_stage, 3, 'Ballgame') returning id into v_round;
  insert into round_result (round_id, season_player_id, raw_score) values
    (v_round, sp_jakob, 3490110), (v_round, sp_jorgen, 3272200), (v_round, sp_tobias, 3739660), (v_round, sp_william, 3078920);
  insert into round (stage_id, ordinal, label) values (v_stage, 4, 'O Christmas Tree') returning id into v_round;
  insert into round_result (round_id, season_player_id, raw_score) values
    (v_round, sp_jakob, 4927060), (v_round, sp_jorgen, 4153740), (v_round, sp_tobias, 6463080), (v_round, sp_william, 4171150);
  insert into round (stage_id, ordinal, label) values (v_stage, 5, 'Hello My Baby') returning id into v_round;
  insert into round_result (round_id, season_player_id, raw_score) values
    (v_round, sp_jakob, 7498740), (v_round, sp_jorgen, 6715170), (v_round, sp_tobias, 8438470), (v_round, sp_william, 6378150);
  insert into round (stage_id, ordinal, label) values (v_stage, 6, 'Gymnopedie') returning id into v_round;
  insert into round_result (round_id, season_player_id, raw_score) values
    (v_round, sp_jakob, 4708460), (v_round, sp_jorgen, 3961600), (v_round, sp_tobias, 5016510), (v_round, sp_william, 3953500);
  insert into round (stage_id, ordinal, label) values (v_stage, 7, 'Marseillaise') returning id into v_round;
  insert into round_result (round_id, season_player_id, raw_score) values
    (v_round, sp_jakob, 3025190), (v_round, sp_jorgen, 2652750), (v_round, sp_tobias, 3321340), (v_round, sp_william, 2571540);
  insert into round (stage_id, ordinal, label) values (v_stage, 8, 'Korobeiniki') returning id into v_round;
  insert into round_result (round_id, season_player_id, raw_score) values
    (v_round, sp_jakob, 9057240), (v_round, sp_jorgen, 7859100), (v_round, sp_tobias, 10091970), (v_round, sp_william, 7252360);
  -- Rank-then-sum points: Jakob 24, Jørgen 14, Tobias 32, William 10.

  -- Stage 2: final-bronze (bo3, real song scores).
  -- Final: Tobias beat Jakob 2-0 (Hungarian Rhapsody 11647874-9874820;
  --   Hall of the Mountain King 7223040-5641210).
  -- Bronze: Jørgen beat William 2-1 (William Tell 4476780-3894250 Jørgen;
  --   Rhapsody in Blue 8247330-8216200 William; Sailor's Hornpipe 4743920-3596130 Jørgen).
  insert into stage (game_id, ordinal, kind) values (v_game, 2, 'final-bronze')
    returning id into v_stage;
  perform pg_temp.seed_h2h_match(v_stage, 'BR', 'bo3', sp_jorgen, sp_william,
    array[4476780, 8216200, 4743920], array[3894250, 8247330, 3596130]);
  perform pg_temp.seed_h2h_match(v_stage, 'F',  'bo3', sp_tobias, sp_jakob,
    array[11647874, 7223040], array[9874820, 5641210]);

  insert into game_result (game_id, season_player_id, placement, confirmed) values
    (v_game, sp_tobias,  1, true),
    (v_game, sp_jakob,   2, true),
    (v_game, sp_jorgen,  3, true),
    (v_game, sp_william, 4, true);

  -- Curses: Jakob Sucks to Suck (0 — finished 2nd, no effect),
  -- Tobias Unsuccessful Tax Evasion (0).
  insert into power_up_use (game_id, power_up_id, used_by_season_player_id, affected_season_player_id, points_delta) values
    (v_game, cu_sucks, sp_jakob,  sp_jakob,  0),
    (v_game, cu_untax, sp_tobias, sp_tobias, 0);

  -------------------------------------------------------------------------
  -- GAME 5 — Counter-Strike 2 (placement — furthest on KZ parkour map)
  -- Single rounds stage, one round, raw_score = 4..1 placement.
  -- Final: 1 Tobias, 2 Jakob, 3 Jørgen, 4 William.
  -------------------------------------------------------------------------
  insert into game (season_id, slug, ordinal, status)
  values (v_season, 'counter-strike-2', 5, 'complete') returning id into v_game;

  insert into stage (game_id, ordinal, kind, aggregation)
  values (v_game, 1, 'rounds', 'sum') returning id into v_stage;
  insert into round (stage_id, ordinal, label) values (v_stage, 1, 'Plassering') returning id into v_round;
  insert into round_result (round_id, season_player_id, raw_score) values
    (v_round, sp_tobias, 4), (v_round, sp_jakob, 3), (v_round, sp_jorgen, 2), (v_round, sp_william, 1);

  insert into game_result (game_id, season_player_id, placement, confirmed) values
    (v_game, sp_tobias,  1, true),
    (v_game, sp_jakob,   2, true),
    (v_game, sp_jorgen,  3, true),
    (v_game, sp_william, 4, true);

  -- Power-ups: Tobias Successful Tax Evasion (0); Jakob Power-up Cloner (0 —
  -- cloned Tobias's Wide Net); Jørgen Safety Net (+1 — 3rd place bonus).
  insert into power_up_use (game_id, power_up_id, used_by_season_player_id, affected_season_player_id, points_delta) values
    (v_game, pu_tax,    sp_tobias, sp_tobias, 0),
    (v_game, pu_cloner, sp_jakob,  sp_jakob,  0),
    (v_game, pu_safety, sp_jorgen, sp_jorgen, 1);

  -------------------------------------------------------------------------
  -- GAME 6 — Garry's Mod (rounds, sum, 6 races)
  -- Sled build. raw_score = placement points per race (4=best).
  -- Sums: Jakob 20, Jørgen 14, Tobias 16, William 10.
  -- Final: 1 Jakob, 2 Tobias, 3 Jørgen, 4 William.
  -------------------------------------------------------------------------
  insert into game (season_id, slug, ordinal, status)
  values (v_season, 'garrys-mod', 6, 'complete') returning id into v_game;

  insert into stage (game_id, ordinal, kind, aggregation)
  values (v_game, 1, 'rounds', 'sum') returning id into v_stage;
  insert into round (stage_id, ordinal, label) values (v_stage, 1, 'Race 1') returning id into v_round;
  insert into round_result (round_id, season_player_id, raw_score) values
    (v_round, sp_jakob, 3), (v_round, sp_jorgen, 4), (v_round, sp_tobias, 2), (v_round, sp_william, 1);
  insert into round (stage_id, ordinal, label) values (v_stage, 2, 'Race 2') returning id into v_round;
  insert into round_result (round_id, season_player_id, raw_score) values
    (v_round, sp_jakob, 4), (v_round, sp_jorgen, 1), (v_round, sp_tobias, 2), (v_round, sp_william, 3);
  insert into round (stage_id, ordinal, label) values (v_stage, 3, 'Race 3') returning id into v_round;
  insert into round_result (round_id, season_player_id, raw_score) values
    (v_round, sp_jakob, 4), (v_round, sp_jorgen, 2), (v_round, sp_tobias, 3), (v_round, sp_william, 1);
  insert into round (stage_id, ordinal, label) values (v_stage, 4, 'Race 4') returning id into v_round;
  insert into round_result (round_id, season_player_id, raw_score) values
    (v_round, sp_jakob, 4), (v_round, sp_jorgen, 3), (v_round, sp_tobias, 2), (v_round, sp_william, 1);
  insert into round (stage_id, ordinal, label) values (v_stage, 5, 'Race 5') returning id into v_round;
  insert into round_result (round_id, season_player_id, raw_score) values
    (v_round, sp_jakob, 4), (v_round, sp_jorgen, 2), (v_round, sp_tobias, 3), (v_round, sp_william, 1);
  insert into round (stage_id, ordinal, label) values (v_stage, 6, 'Race 6') returning id into v_round;
  insert into round_result (round_id, season_player_id, raw_score) values
    (v_round, sp_jakob, 1), (v_round, sp_jorgen, 2), (v_round, sp_tobias, 4), (v_round, sp_william, 3);
  -- Sums: Jakob 20, Jørgen 14, Tobias 16, William 10.

  insert into game_result (game_id, season_player_id, placement, confirmed) values
    (v_game, sp_jakob,   1, true),
    (v_game, sp_tobias,  2, true),
    (v_game, sp_jorgen,  3, true),
    (v_game, sp_william, 4, true);

  -- Power-ups: Jakob Double-Edged Sword (+4), Tobias Wide Net (+1),
  -- William Safety Net (+2 — last-place bonus).
  insert into power_up_use (game_id, power_up_id, used_by_season_player_id, affected_season_player_id, points_delta) values
    (v_game, pu_sword,   sp_jakob,   sp_jakob,   4),
    (v_game, pu_widenet, sp_tobias,  sp_tobias,  1),
    (v_game, pu_safety,  sp_william, sp_william, 2);

  -------------------------------------------------------------------------
  -- GAME 7 — FC25 (round-robin → single-elim, score — goals)
  -- Ultimate Team. Group bo1 for seeding (goals):
  --   Jakob 12-0 Jørgen, Tobias 3-1 William, Jakob 5-0 Tobias,
  --   William 7-0 Jørgen, Jakob 6-3 William, Tobias 6-2 Jørgen.
  -- Group wins: Jakob 3, Tobias 2, William 1, Jørgen 0.
  -- Seeds: 1 Jakob, 2 Tobias, 3 William, 4 Jørgen.
  -- SF1 Jakob 16-0 Jørgen, SF2 William 3-2 Tobias,
  -- BR Tobias 6-2 Jørgen, F Jakob 6-1 William.
  -- Final: 1 Jakob, 2 William, 3 Tobias, 4 Jørgen.
  -------------------------------------------------------------------------
  insert into game (season_id, slug, ordinal, status)
  values (v_season, 'fc-25', 7, 'complete') returning id into v_game;

  -- Stage 1: round-robin seeding (bo1, real goals).
  insert into stage (game_id, ordinal, kind) values (v_game, 1, 'round-robin')
    returning id into v_stage;
  perform pg_temp.seed_h2h_match(v_stage, null, 'bo1', sp_jakob,  sp_jorgen,  array[12], array[0]);
  perform pg_temp.seed_h2h_match(v_stage, null, 'bo1', sp_tobias, sp_william, array[3],  array[1]);
  perform pg_temp.seed_h2h_match(v_stage, null, 'bo1', sp_jakob,  sp_tobias,  array[5],  array[0]);
  perform pg_temp.seed_h2h_match(v_stage, null, 'bo1', sp_william, sp_jorgen, array[7],  array[0]);
  perform pg_temp.seed_h2h_match(v_stage, null, 'bo1', sp_jakob,  sp_william, array[6],  array[3]);
  perform pg_temp.seed_h2h_match(v_stage, null, 'bo1', sp_tobias, sp_jorgen,  array[6],  array[2]);

  -- Stage 2: single-elim (bo1, real goals). SF1/SF2/BR/F template.
  insert into stage (game_id, ordinal, kind) values (v_game, 2, 'single-elim')
    returning id into v_stage;
  perform pg_temp.seed_h2h_match(v_stage, 'SF1', 'bo1', sp_jakob,   sp_jorgen,  array[16], array[0]);
  perform pg_temp.seed_h2h_match(v_stage, 'SF2', 'bo1', sp_william, sp_tobias,  array[3],  array[2]);
  perform pg_temp.seed_h2h_match(v_stage, 'BR',  'bo1', sp_tobias,  sp_jorgen,  array[6],  array[2]);
  perform pg_temp.seed_h2h_match(v_stage, 'F',   'bo1', sp_jakob,   sp_william, array[6],  array[1]);

  insert into game_result (game_id, season_player_id, placement, confirmed) values
    (v_game, sp_jakob,   1, true),
    (v_game, sp_william, 2, true),
    (v_game, sp_tobias,  3, true),
    (v_game, sp_jorgen,  4, true);

  -- Power-ups: Tobias Power-up Cloner (0 — cloned Jørgen's Wide Net);
  -- William Back to Back (+2).
  insert into power_up_use (game_id, power_up_id, used_by_season_player_id, affected_season_player_id, points_delta) values
    (v_game, pu_cloner, sp_tobias,  sp_tobias,  0),
    (v_game, pu_b2b,    sp_william, sp_william, 2);

  -------------------------------------------------------------------------
  -- GAME 8 — 2XKO (round-robin + swiss finish → final-bronze, win-loss)
  -- Group bo3. Full round-robin (6 matches, leg 1) PLUS one swiss-finish
  -- rematch (Jakob–William, leg 2) to settle who reached 3W / 3L:
  --   R1 Tobias 2-0 Jørgen, William 2-0 Jakob
  --   R2 Tobias 2-1 William, Jakob 2-0 Jørgen
  --   R3 Tobias 2-0 Jakob, William 2-0 Jørgen
  --   R4 William 2-0 Jakob  (leg 2 — Jakob–William's second meeting)
  -- Group records: Tobias 3-0, William 3-1, Jakob 1-3, Jørgen 0-3.
  -- Finals bo5. Bronze: Jørgen 3-0 Jakob. Final: Tobias 3-1 William.
  -- Final placements: 1 Tobias, 2 William, 3 Jørgen, 4 Jakob.
  -------------------------------------------------------------------------
  insert into game (season_id, slug, ordinal, status)
  values (v_season, '2xko', 8, 'complete') returning id into v_game;

  -- Stage 1: round-robin with a swiss-finish rematch. All leg 1 except the
  -- Jakob–William rematch (leg 2). Win-loss stored as per-game 1-0 rows.
  insert into stage (game_id, ordinal, kind) values (v_game, 1, 'round-robin')
    returning id into v_stage;
  -- Round-robin (leg 1):
  perform pg_temp.seed_h2h_match(v_stage, null, 'bo3', sp_tobias,  sp_jorgen,  array[1,1],   array[0,0],   1::smallint);
  perform pg_temp.seed_h2h_match(v_stage, null, 'bo3', sp_william, sp_jakob,   array[1,1],   array[0,0],   1::smallint);
  perform pg_temp.seed_h2h_match(v_stage, null, 'bo3', sp_tobias,  sp_william, array[1,0,1], array[0,1,0], 1::smallint);
  perform pg_temp.seed_h2h_match(v_stage, null, 'bo3', sp_jakob,   sp_jorgen,  array[1,1],   array[0,0],   1::smallint);
  perform pg_temp.seed_h2h_match(v_stage, null, 'bo3', sp_tobias,  sp_jakob,   array[1,1],   array[0,0],   1::smallint);
  perform pg_temp.seed_h2h_match(v_stage, null, 'bo3', sp_william, sp_jorgen,  array[1,1],   array[0,0],   1::smallint);
  -- Swiss-finish rematch (leg 2): William beat Jakob again.
  perform pg_temp.seed_h2h_match(v_stage, null, 'bo3', sp_william, sp_jakob,   array[1,1],   array[0,0],   2::smallint);

  -- Stage 2: final-bronze (bo5, win-loss).
  insert into stage (game_id, ordinal, kind) values (v_game, 2, 'final-bronze')
    returning id into v_stage;
  perform pg_temp.seed_h2h_match(v_stage, 'BR', 'bo5', sp_jorgen, sp_jakob,   array[1,1,1],   array[0,0,0]);
  perform pg_temp.seed_h2h_match(v_stage, 'F',  'bo5', sp_tobias, sp_william, array[1,1,0,1], array[0,0,1,0]);

  insert into game_result (game_id, season_player_id, placement, confirmed) values
    (v_game, sp_tobias,  1, true),
    (v_game, sp_william, 2, true),
    (v_game, sp_jorgen,  3, true),
    (v_game, sp_jakob,   4, true);

  -- Power-ups: William Double-Edged Sword (+1), Jørgen Wide Net (+1).
  insert into power_up_use (game_id, power_up_id, used_by_season_player_id, affected_season_player_id, points_delta) values
    (v_game, pu_sword,   sp_william, sp_william, 1),
    (v_game, pu_widenet, sp_jorgen,  sp_jorgen,  1);

  ---------------------------------------------------------------------------
  -- SEASON RESULT
  -- Totals (ladder + power-ups) 49/29/47/22. Jakob champion outright; no tie.
  -- Final order: 1 Jakob (49), 2 Tobias (47), 3 Jørgen (29), 4 William (22).
  ---------------------------------------------------------------------------
  insert into season_result (season_id, season_player_id, placement, confirmed, note) values
    (v_season, sp_jakob,   1, true, null),
    (v_season, sp_tobias,  2, true, null),
    (v_season, sp_jorgen,  3, true, null),
    (v_season, sp_william, 4, true, null);
end $$;

commit;
