-- =============================================================================
-- match.leg + drop swiss from stage_kind
-- =============================================================================
-- Two linked model corrections surfaced while preparing the Season 2 seed:
--
-- 1. DUAL ROUND-ROBIN (S2 League of Legends) and the "swiss finish" tail
--    (S4 2XKO) are both just a round-robin where some pairings are played more
--    than once — one extra leg, by some or all players, feeding ONE standings
--    table. The old `unique (stage_id, player_a, player_b)` forbade a pairing
--    appearing twice in a stage, which made this impossible without splitting
--    into multiple stages (rejected: one phase = one stage = one table).
--
--    Fix: add `match.leg` (1-indexed; leg 1 = first meeting, leg 2 = rematch)
--    and key the uniqueness on (stage_id, player_a, player_b, leg). Single
--    round-robin stays all leg 1 and is unaffected. Partial extra legs are
--    allowed naturally — the constraint is per pairing, not "every pair needs
--    N legs" — so the 2XKO case (one rematch among some players) and the S2 LoL
--    case (every pair meets twice) both model with the same mechanism.
--    Standings derivation tallies all match rows regardless of leg: no change.
--
-- 2. `swiss` as a distinct stage_kind was a misread of 2XKO. It was never a
--    standalone Swiss phase — just the round-robin's extra-leg finish (see
--    above), now modeled as leg-2 matches in the round-robin stage. The enum
--    value is unused (no stage rows reference it on local or remote), so drop
--    it. Re-add it only if a true, standalone Swiss event ever happens.
--
-- Both changes are safe on the existing data: the only seeded season (S1) uses
-- neither swiss nor any rematch, so every existing match defaults to leg 1 and
-- the stricter-superset unique constraint still holds.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 1. match.leg + constraint swap
-- ---------------------------------------------------------------------------
alter table match
  add column leg smallint not null default 1 check (leg >= 1);

comment on column match.leg is 'Which meeting of this pairing within the stage (1-indexed). 1 = first/only meeting; 2+ = rematch in a dual round-robin or a round-robin''s extra-leg (swiss-style) finish. Single round-robin stages are all leg 1.';

-- Replace the once-per-pairing unique constraint with one that permits repeated
-- meetings on distinct legs while still forbidding true duplicates.
-- NULLs in player columns are not possible here (both NOT NULL), so this is a
-- straightforward stricter-superset of the old guarantee.
alter table match
  drop constraint match_stage_id_player_a_player_b_key;

alter table match
  add constraint match_stage_id_player_a_player_b_leg_key
  unique (stage_id, player_a, player_b, leg);

-- ---------------------------------------------------------------------------
-- 2. Drop 'swiss' from stage_kind
-- ---------------------------------------------------------------------------
-- Postgres has no ALTER TYPE ... DROP VALUE, so recreate the enum without it.
-- stage.kind is the only user of the type. No rows use 'swiss', so the USING
-- cast cannot fail. The aggregation_rounds_only CHECK references kind with the
-- old type, so drop it before the column type churn and recreate it after.
alter table stage
  drop constraint aggregation_rounds_only;

alter table stage
  alter column kind type text using kind::text;

drop type stage_kind;

create type stage_kind as enum (
  'round-robin',
  'single-elim',
  'final-bronze',
  'double-elim-reset',
  'double-elim-no-reset',
  'rounds'
);

alter table stage
  alter column kind type stage_kind using kind::stage_kind;

alter table stage
  add constraint aggregation_rounds_only check (
    (kind = 'rounds' and aggregation is not null) or
    (kind <> 'rounds' and aggregation is null)
  );
