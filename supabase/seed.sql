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
delete from season where number in (1);
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
--   p_slot       match.slot_id (null for round-robin / swiss)
--   p_series     series_length
--   p_sp1,p_sp2  the two season_player ids (any order)
--   p_scores1    int[] — p_sp1's score in each game of the series (game 1..n)
--   p_scores2    int[] — p_sp2's score in each game, same length
--
-- For Season 1 every match is bo1 (single-element arrays) and no game is a
-- draw, so tiebreak_winner is never set. The helper still handles bo3/bo5 and
-- draws for reuse by later seasons.
-- ---------------------------------------------------------------------------
create or replace function pg_temp.seed_h2h_match(
  p_stage   uuid,
  p_slot    text,
  p_series  series_length,
  p_sp1     uuid,
  p_sp2     uuid,
  p_scores1 int[],
  p_scores2 int[]
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

  insert into match (stage_id, slot_id, player_a, player_b, series_len)
  values (p_stage, p_slot, v_a, v_b, p_series)
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

commit;
