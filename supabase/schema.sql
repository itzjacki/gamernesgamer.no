
-- =============================================================================
-- GENERATED FILE — DO NOT EDIT BY HAND.
-- Reference snapshot of the local database schema, produced by:
--   supabase db dump --local -f supabase/schema.sql
-- Source of truth is supabase/migrations/. Regenerate this file after every
-- migration; never hand-edit it.
-- =============================================================================

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;


COMMENT ON SCHEMA "public" IS 'standard public schema';



CREATE EXTENSION IF NOT EXISTS "pg_stat_statements" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "supabase_vault" WITH SCHEMA "vault";






CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";






CREATE TYPE "public"."game_status" AS ENUM (
    'not-started',
    'in-progress',
    'complete'
);


ALTER TYPE "public"."game_status" OWNER TO "postgres";


CREATE TYPE "public"."season_status" AS ENUM (
    'not-started',
    'live',
    'complete'
);


ALTER TYPE "public"."season_status" OWNER TO "postgres";


CREATE TYPE "public"."series_length" AS ENUM (
    'bo1',
    'bo3',
    'bo5'
);


ALTER TYPE "public"."series_length" OWNER TO "postgres";


CREATE TYPE "public"."stage_aggregation" AS ENUM (
    'sum',
    'rank-then-sum'
);


ALTER TYPE "public"."stage_aggregation" OWNER TO "postgres";


CREATE TYPE "public"."stage_kind" AS ENUM (
    'round-robin',
    'single-elim',
    'final-bronze',
    'double-elim-reset',
    'double-elim-no-reset',
    'rounds'
);


ALTER TYPE "public"."stage_kind" OWNER TO "postgres";


CREATE TYPE "public"."tiebreak_winner" AS ENUM (
    'a',
    'b'
);


ALTER TYPE "public"."tiebreak_winner" OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."is_admin"() RETURNS boolean
    LANGUAGE "sql" STABLE
    SET "search_path" TO ''
    AS $$
  select exists (
    select 1 from public.admin_user au
    where au.user_id = (select auth.uid())
  );
$$;


ALTER FUNCTION "public"."is_admin"() OWNER TO "postgres";


COMMENT ON FUNCTION "public"."is_admin"() IS 'True if the current authenticated user is in the admin_user allowlist. Used by write policies across the schema.';



CREATE OR REPLACE FUNCTION "public"."set_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    SET "search_path" TO ''
    AS $$
begin
  new.updated_at := now();
  return new;
end;
$$;


ALTER FUNCTION "public"."set_updated_at"() OWNER TO "postgres";


COMMENT ON FUNCTION "public"."set_updated_at"() IS 'Sets updated_at to now() on every UPDATE. Attached to the live-edited result tables.';


SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "public"."admin_user" (
    "user_id" "uuid" NOT NULL,
    "note" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."admin_user" OWNER TO "postgres";


COMMENT ON TABLE "public"."admin_user" IS 'Allowlist of admin auth users. Membership grants write access to all tournament tables via RLS. Invite-only: managed by existing admins or the service role (dashboard). No public signup.';



CREATE TABLE IF NOT EXISTS "public"."game" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "season_id" "uuid" NOT NULL,
    "slug" "text" NOT NULL,
    "ordinal" integer NOT NULL,
    "status" "public"."game_status" DEFAULT 'not-started'::"public"."game_status" NOT NULL,
    CONSTRAINT "game_ordinal_check" CHECK (("ordinal" >= 1))
);


ALTER TABLE "public"."game" OWNER TO "postgres";


COMMENT ON TABLE "public"."game" IS 'Thin DB anchor for each game in a season. Slug matches src/data/sesong/<NN>/games.ts key.';



COMMENT ON COLUMN "public"."game"."slug" IS 'Kebab-case slug matching the static TS data and URL route (e.g. "fc-25").';



COMMENT ON COLUMN "public"."game"."ordinal" IS 'Play order within the season. May differ from display order in static TS.';



COMMENT ON COLUMN "public"."game"."status" IS 'Single source of truth for completion. Live leaderboard uses this to exclude unplayed games.';



CREATE TABLE IF NOT EXISTS "public"."game_result" (
    "game_id" "uuid" NOT NULL,
    "season_player_id" "uuid" NOT NULL,
    "placement" integer NOT NULL,
    "confirmed" boolean DEFAULT false NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "note" "text",
    CONSTRAINT "game_result_placement_check" CHECK (("placement" >= 1))
);


ALTER TABLE "public"."game_result" OWNER TO "postgres";


COMMENT ON TABLE "public"."game_result" IS 'Final placement per player per game. Anchor for the season points layer.';



COMMENT ON COLUMN "public"."game_result"."season_player_id" IS 'season_player.id — see NAMING CONVENTION. Not player.id.';



COMMENT ON COLUMN "public"."game_result"."placement" IS 'Unique within the game (1=1st). Stored, not derived — tiebreakers can override point totals.';



COMMENT ON COLUMN "public"."game_result"."confirmed" IS 'False until an admin confirms the result. Unconfirmed results should not appear on the public site.';



COMMENT ON COLUMN "public"."game_result"."updated_at" IS 'Not auto-maintained — set explicitly on update. See UPDATED_AT MAINTENANCE.';



COMMENT ON COLUMN "public"."game_result"."note" IS 'Optional free-text context for the game result, mirroring season_result.note. First use: game-level tiebreak stories that are not a drawn match_game (e.g. S1 OSRS 13–13, Jørgen won the tiebreaker).';



CREATE TABLE IF NOT EXISTS "public"."match" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "stage_id" "uuid" NOT NULL,
    "slot_id" "text",
    "player_a" "uuid" NOT NULL,
    "player_b" "uuid" NOT NULL,
    "series_len" "public"."series_length" NOT NULL,
    "leg" smallint DEFAULT 1 NOT NULL,
    CONSTRAINT "match_leg_check" CHECK (("leg" >= 1)),
    CONSTRAINT "player_order" CHECK (("player_a" < "player_b")),
    CONSTRAINT "players_differ" CHECK (("player_a" <> "player_b"))
);


ALTER TABLE "public"."match" OWNER TO "postgres";


COMMENT ON TABLE "public"."match" IS 'One meeting of two players within an H2H stage.';



COMMENT ON COLUMN "public"."match"."slot_id" IS 'Bracket position label (e.g. SF1, GF). NULL for standings stages (round-robin, swiss).';



COMMENT ON COLUMN "public"."match"."player_a" IS 'season_player.id of the lesser UUID. See NAMING CONVENTION.';



COMMENT ON COLUMN "public"."match"."player_b" IS 'season_player.id of the greater UUID. See NAMING CONVENTION.';



COMMENT ON COLUMN "public"."match"."series_len" IS 'Best-of format for this match.';



COMMENT ON COLUMN "public"."match"."leg" IS 'Which meeting of this pairing within the stage (1-indexed). 1 = first/only meeting; 2+ = rematch in a dual round-robin or a round-robin''s extra-leg (swiss-style) finish. Single round-robin stages are all leg 1.';



CREATE TABLE IF NOT EXISTS "public"."match_game" (
    "match_id" "uuid" NOT NULL,
    "game_number" integer NOT NULL,
    "score_a" integer NOT NULL,
    "score_b" integer NOT NULL,
    "tiebreak_winner" "public"."tiebreak_winner",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "match_game_game_number_check" CHECK (("game_number" >= 1)),
    CONSTRAINT "match_game_score_a_check" CHECK (("score_a" >= 0)),
    CONSTRAINT "match_game_score_b_check" CHECK (("score_b" >= 0)),
    CONSTRAINT "tiebreak_iff_draw" CHECK (((("score_a" = "score_b") AND ("tiebreak_winner" IS NOT NULL)) OR (("score_a" <> "score_b") AND ("tiebreak_winner" IS NULL))))
);


ALTER TABLE "public"."match_game" OWNER TO "postgres";


COMMENT ON TABLE "public"."match_game" IS 'Single contest in a series. The only stored source of H2H results.';



COMMENT ON COLUMN "public"."match_game"."game_number" IS '1-indexed position within the series (1..series_len).';



COMMENT ON COLUMN "public"."match_game"."score_a" IS 'Score for match.player_a. Win-loss games use 1 (win) or 0 (loss).';



COMMENT ON COLUMN "public"."match_game"."score_b" IS 'Score for match.player_b. Win-loss games use 1 (win) or 0 (loss).';



COMMENT ON COLUMN "public"."match_game"."tiebreak_winner" IS '''a'' or ''b'' — set if and only if score_a = score_b. See UPDATED_AT MAINTENANCE.';



COMMENT ON COLUMN "public"."match_game"."updated_at" IS 'Not auto-maintained — set explicitly on update. See UPDATED_AT MAINTENANCE.';



CREATE TABLE IF NOT EXISTS "public"."player" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "slug" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."player" OWNER TO "postgres";


COMMENT ON TABLE "public"."player" IS 'Cross-season identity. One row per real person.';



COMMENT ON COLUMN "public"."player"."name" IS 'Display name as used on the site (e.g. "Jakob").';



COMMENT ON COLUMN "public"."player"."slug" IS 'URL-safe identifier for /spillere/[spiller] routes and static TS content linkage (e.g. "jakob").';



CREATE TABLE IF NOT EXISTS "public"."power_up" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "season_id" "uuid" NOT NULL,
    "slug" "text" NOT NULL,
    "is_curse" boolean DEFAULT false NOT NULL,
    "can_target_others" boolean DEFAULT false NOT NULL
);


ALTER TABLE "public"."power_up" OWNER TO "postgres";


COMMENT ON TABLE "public"."power_up" IS 'Thin DB anchor for each power-up in a season. Slug matches src/data/sesong/<NN>/power-ups.ts key.';



COMMENT ON COLUMN "public"."power_up"."slug" IS 'Kebab-case slug matching the static TS data.';



COMMENT ON COLUMN "public"."power_up"."is_curse" IS 'True for curses. Mirrors the static TS separation of powerUps and curses arrays.';



COMMENT ON COLUMN "public"."power_up"."can_target_others" IS 'If true, the power-up can affect a player other than the one who activated it. Drives the admin entry UI.';



CREATE TABLE IF NOT EXISTS "public"."power_up_use" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "game_id" "uuid" NOT NULL,
    "power_up_id" "uuid" NOT NULL,
    "used_by_season_player_id" "uuid" NOT NULL,
    "affected_season_player_id" "uuid" NOT NULL,
    "points_delta" integer NOT NULL
);


ALTER TABLE "public"."power_up_use" OWNER TO "postgres";


COMMENT ON TABLE "public"."power_up_use" IS 'Records a power-up activation for a game. points_delta applies to affected_season_player_id.';



COMMENT ON COLUMN "public"."power_up_use"."used_by_season_player_id" IS 'The player who activated the power-up. season_player.id — see NAMING CONVENTION.';



COMMENT ON COLUMN "public"."power_up_use"."affected_season_player_id" IS 'The player whose points are modified. Group by this column when summing points_delta.';



COMMENT ON COLUMN "public"."power_up_use"."points_delta" IS 'Points added (positive) or removed (negative) from affected_season_player_id''s total for this game.';



CREATE TABLE IF NOT EXISTS "public"."round" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "stage_id" "uuid" NOT NULL,
    "ordinal" integer NOT NULL,
    "label" "text",
    CONSTRAINT "round_ordinal_check" CHECK (("ordinal" >= 1))
);


ALTER TABLE "public"."round" OWNER TO "postgres";


COMMENT ON TABLE "public"."round" IS 'One sub-event within a rounds stage (track, song, map, race).';



COMMENT ON COLUMN "public"."round"."ordinal" IS '1-indexed position within the stage.';



COMMENT ON COLUMN "public"."round"."label" IS 'Optional human-facing caption for this sub-event (e.g. "High Jump", a track or song name). Display/archive only — ordinal still sequences the rounds.';



CREATE TABLE IF NOT EXISTS "public"."round_result" (
    "round_id" "uuid" NOT NULL,
    "season_player_id" "uuid" NOT NULL,
    "raw_score" integer NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."round_result" OWNER TO "postgres";


COMMENT ON TABLE "public"."round_result" IS 'One player''s raw score in one round. Higher is always better. Negative scores are valid.';



COMMENT ON COLUMN "public"."round_result"."season_player_id" IS 'season_player.id — see NAMING CONVENTION. Not player.id.';



COMMENT ON COLUMN "public"."round_result"."raw_score" IS 'Real score or placement-as-integer (N=best). Negative allowed (e.g. penalties). stage.aggregation determines rollup.';



COMMENT ON COLUMN "public"."round_result"."updated_at" IS 'Not auto-maintained — set explicitly on update. See UPDATED_AT MAINTENANCE.';



CREATE TABLE IF NOT EXISTS "public"."season" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "number" integer NOT NULL,
    "status" "public"."season_status" DEFAULT 'not-started'::"public"."season_status" NOT NULL,
    "started_at" timestamp with time zone,
    "ended_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "ended_after_started" CHECK ((("ended_at" IS NULL) OR ("started_at" IS NULL) OR ("ended_at" > "started_at"))),
    CONSTRAINT "season_number_check" CHECK (("number" >= 1))
);


ALTER TABLE "public"."season" OWNER TO "postgres";


COMMENT ON TABLE "public"."season" IS 'One row per tournament edition.';



COMMENT ON COLUMN "public"."season"."number" IS 'Season number (1-indexed). Matches the NN in src/data/sesong/<NN>/.';



COMMENT ON COLUMN "public"."season"."status" IS 'Lifecycle state used by the live leaderboard and admin panel.';



COMMENT ON COLUMN "public"."season"."started_at" IS 'When the tournament began. Used for champion lineage display and archive dates.';



COMMENT ON COLUMN "public"."season"."ended_at" IS 'When the tournament ended. Used for champion cards and archive display.';



CREATE TABLE IF NOT EXISTS "public"."season_ladder" (
    "season_id" "uuid" NOT NULL,
    "placement" integer NOT NULL,
    "points" integer NOT NULL,
    CONSTRAINT "season_ladder_placement_check" CHECK (("placement" >= 1)),
    CONSTRAINT "season_ladder_points_check" CHECK (("points" >= 0))
);


ALTER TABLE "public"."season_ladder" OWNER TO "postgres";


COMMENT ON TABLE "public"."season_ladder" IS 'Base points per placement per season. Season-wide — identical across all games. Used to derive per-game points from game_result.placement.';



CREATE TABLE IF NOT EXISTS "public"."season_player" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "season_id" "uuid" NOT NULL,
    "player_id" "uuid" NOT NULL
);


ALTER TABLE "public"."season_player" OWNER TO "postgres";


COMMENT ON TABLE "public"."season_player" IS 'Roster join: which players participated in which season.';



COMMENT ON COLUMN "public"."season_player"."player_id" IS 'FK to player.id. All result tables reference season_player.id, not player.id directly.';



CREATE TABLE IF NOT EXISTS "public"."season_result" (
    "season_id" "uuid" NOT NULL,
    "season_player_id" "uuid" NOT NULL,
    "placement" integer NOT NULL,
    "note" "text",
    "confirmed" boolean DEFAULT false NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "season_result_placement_check" CHECK (("placement" >= 1))
);


ALTER TABLE "public"."season_result" OWNER TO "postgres";


COMMENT ON TABLE "public"."season_result" IS 'Final season placement per player. Stored explicitly — tiebreakers can override point totals.';



COMMENT ON COLUMN "public"."season_result"."season_player_id" IS 'season_player.id, constrained via composite FK to the correct season. See NAMING CONVENTION.';



COMMENT ON COLUMN "public"."season_result"."placement" IS 'Unique within the season (1=champion). Not always derivable from points.';



COMMENT ON COLUMN "public"."season_result"."note" IS 'Optional tiebreaker story or context (e.g. "Jørgen won Gen 6 random match tiebreak").';



COMMENT ON COLUMN "public"."season_result"."confirmed" IS 'False until an admin confirms the final standings.';



COMMENT ON COLUMN "public"."season_result"."updated_at" IS 'Not auto-maintained — set explicitly on update. See UPDATED_AT MAINTENANCE.';



CREATE TABLE IF NOT EXISTS "public"."stage" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "game_id" "uuid" NOT NULL,
    "ordinal" integer NOT NULL,
    "kind" "public"."stage_kind" NOT NULL,
    "aggregation" "public"."stage_aggregation",
    CONSTRAINT "aggregation_rounds_only" CHECK (((("kind" = 'rounds'::"public"."stage_kind") AND ("aggregation" IS NOT NULL)) OR (("kind" <> 'rounds'::"public"."stage_kind") AND ("aggregation" IS NULL)))),
    CONSTRAINT "stage_ordinal_check" CHECK (("ordinal" >= 1))
);


ALTER TABLE "public"."stage" OWNER TO "postgres";


COMMENT ON TABLE "public"."stage" IS 'One phase in a game''s pipeline. Determines rendering (standings table vs bracket).';



COMMENT ON COLUMN "public"."stage"."ordinal" IS '1-indexed position within the game pipeline. 1 is played first.';



COMMENT ON COLUMN "public"."stage"."kind" IS 'Drives rendering and which sub-entities (match vs round) are valid for this stage.';



COMMENT ON COLUMN "public"."stage"."aggregation" IS 'Required for rounds stages only. How raw_score values roll up to standings.';



ALTER TABLE ONLY "public"."admin_user"
    ADD CONSTRAINT "admin_user_pkey" PRIMARY KEY ("user_id");



ALTER TABLE ONLY "public"."game"
    ADD CONSTRAINT "game_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."game_result"
    ADD CONSTRAINT "game_result_game_id_placement_key" UNIQUE ("game_id", "placement");



ALTER TABLE ONLY "public"."game_result"
    ADD CONSTRAINT "game_result_pkey" PRIMARY KEY ("game_id", "season_player_id");



ALTER TABLE ONLY "public"."game"
    ADD CONSTRAINT "game_season_id_ordinal_key" UNIQUE ("season_id", "ordinal");



ALTER TABLE ONLY "public"."game"
    ADD CONSTRAINT "game_season_id_slug_key" UNIQUE ("season_id", "slug");



ALTER TABLE ONLY "public"."match_game"
    ADD CONSTRAINT "match_game_pkey" PRIMARY KEY ("match_id", "game_number");



ALTER TABLE ONLY "public"."match"
    ADD CONSTRAINT "match_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."match"
    ADD CONSTRAINT "match_stage_id_player_a_player_b_leg_key" UNIQUE ("stage_id", "player_a", "player_b", "leg");



ALTER TABLE ONLY "public"."match"
    ADD CONSTRAINT "match_stage_id_slot_id_key" UNIQUE ("stage_id", "slot_id");



ALTER TABLE ONLY "public"."player"
    ADD CONSTRAINT "player_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."player"
    ADD CONSTRAINT "player_slug_key" UNIQUE ("slug");



ALTER TABLE ONLY "public"."power_up"
    ADD CONSTRAINT "power_up_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."power_up"
    ADD CONSTRAINT "power_up_season_id_slug_key" UNIQUE ("season_id", "slug");



ALTER TABLE ONLY "public"."power_up_use"
    ADD CONSTRAINT "power_up_use_game_id_power_up_id_used_by_season_player_id_a_key" UNIQUE ("game_id", "power_up_id", "used_by_season_player_id", "affected_season_player_id");



ALTER TABLE ONLY "public"."power_up_use"
    ADD CONSTRAINT "power_up_use_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."round"
    ADD CONSTRAINT "round_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."round_result"
    ADD CONSTRAINT "round_result_pkey" PRIMARY KEY ("round_id", "season_player_id");



ALTER TABLE ONLY "public"."round"
    ADD CONSTRAINT "round_stage_id_ordinal_key" UNIQUE ("stage_id", "ordinal");



ALTER TABLE ONLY "public"."season_ladder"
    ADD CONSTRAINT "season_ladder_pkey" PRIMARY KEY ("season_id", "placement");



ALTER TABLE ONLY "public"."season"
    ADD CONSTRAINT "season_number_key" UNIQUE ("number");



ALTER TABLE ONLY "public"."season"
    ADD CONSTRAINT "season_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."season_player"
    ADD CONSTRAINT "season_player_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."season_player"
    ADD CONSTRAINT "season_player_season_id_id_key" UNIQUE ("season_id", "id");



ALTER TABLE ONLY "public"."season_player"
    ADD CONSTRAINT "season_player_season_id_player_id_key" UNIQUE ("season_id", "player_id");



ALTER TABLE ONLY "public"."season_result"
    ADD CONSTRAINT "season_result_pkey" PRIMARY KEY ("season_id", "season_player_id");



ALTER TABLE ONLY "public"."season_result"
    ADD CONSTRAINT "season_result_season_id_placement_key" UNIQUE ("season_id", "placement");



ALTER TABLE ONLY "public"."stage"
    ADD CONSTRAINT "stage_game_id_ordinal_key" UNIQUE ("game_id", "ordinal");



ALTER TABLE ONLY "public"."stage"
    ADD CONSTRAINT "stage_pkey" PRIMARY KEY ("id");



CREATE INDEX "game_result_season_player_id_idx" ON "public"."game_result" USING "btree" ("season_player_id");



CREATE INDEX "game_season_id_idx" ON "public"."game" USING "btree" ("season_id");



CREATE INDEX "match_player_a_idx" ON "public"."match" USING "btree" ("player_a");



CREATE INDEX "match_player_b_idx" ON "public"."match" USING "btree" ("player_b");



CREATE INDEX "match_stage_id_idx" ON "public"."match" USING "btree" ("stage_id");



CREATE INDEX "power_up_season_id_idx" ON "public"."power_up" USING "btree" ("season_id");



CREATE INDEX "power_up_use_affected_season_player_id_idx" ON "public"."power_up_use" USING "btree" ("affected_season_player_id");



CREATE INDEX "power_up_use_game_id_idx" ON "public"."power_up_use" USING "btree" ("game_id");



CREATE INDEX "power_up_use_power_up_id_idx" ON "public"."power_up_use" USING "btree" ("power_up_id");



CREATE INDEX "power_up_use_used_by_season_player_id_idx" ON "public"."power_up_use" USING "btree" ("used_by_season_player_id");



CREATE INDEX "round_result_season_player_id_idx" ON "public"."round_result" USING "btree" ("season_player_id");



CREATE INDEX "round_stage_id_idx" ON "public"."round" USING "btree" ("stage_id");



CREATE INDEX "season_player_player_id_idx" ON "public"."season_player" USING "btree" ("player_id");



CREATE INDEX "season_result_season_player_id_idx" ON "public"."season_result" USING "btree" ("season_player_id");



CREATE INDEX "stage_game_id_idx" ON "public"."stage" USING "btree" ("game_id");



CREATE OR REPLACE TRIGGER "set_updated_at" BEFORE UPDATE ON "public"."game_result" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "set_updated_at" BEFORE UPDATE ON "public"."match_game" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "set_updated_at" BEFORE UPDATE ON "public"."round_result" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "set_updated_at" BEFORE UPDATE ON "public"."season_result" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



ALTER TABLE ONLY "public"."admin_user"
    ADD CONSTRAINT "admin_user_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."game_result"
    ADD CONSTRAINT "game_result_game_id_fkey" FOREIGN KEY ("game_id") REFERENCES "public"."game"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."game_result"
    ADD CONSTRAINT "game_result_season_player_id_fkey" FOREIGN KEY ("season_player_id") REFERENCES "public"."season_player"("id") ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."game"
    ADD CONSTRAINT "game_season_id_fkey" FOREIGN KEY ("season_id") REFERENCES "public"."season"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."match_game"
    ADD CONSTRAINT "match_game_match_id_fkey" FOREIGN KEY ("match_id") REFERENCES "public"."match"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."match"
    ADD CONSTRAINT "match_player_a_fkey" FOREIGN KEY ("player_a") REFERENCES "public"."season_player"("id") ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."match"
    ADD CONSTRAINT "match_player_b_fkey" FOREIGN KEY ("player_b") REFERENCES "public"."season_player"("id") ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."match"
    ADD CONSTRAINT "match_stage_id_fkey" FOREIGN KEY ("stage_id") REFERENCES "public"."stage"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."power_up"
    ADD CONSTRAINT "power_up_season_id_fkey" FOREIGN KEY ("season_id") REFERENCES "public"."season"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."power_up_use"
    ADD CONSTRAINT "power_up_use_affected_season_player_id_fkey" FOREIGN KEY ("affected_season_player_id") REFERENCES "public"."season_player"("id") ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."power_up_use"
    ADD CONSTRAINT "power_up_use_game_id_fkey" FOREIGN KEY ("game_id") REFERENCES "public"."game"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."power_up_use"
    ADD CONSTRAINT "power_up_use_power_up_id_fkey" FOREIGN KEY ("power_up_id") REFERENCES "public"."power_up"("id") ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."power_up_use"
    ADD CONSTRAINT "power_up_use_used_by_season_player_id_fkey" FOREIGN KEY ("used_by_season_player_id") REFERENCES "public"."season_player"("id") ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."round_result"
    ADD CONSTRAINT "round_result_round_id_fkey" FOREIGN KEY ("round_id") REFERENCES "public"."round"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."round_result"
    ADD CONSTRAINT "round_result_season_player_id_fkey" FOREIGN KEY ("season_player_id") REFERENCES "public"."season_player"("id") ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."round"
    ADD CONSTRAINT "round_stage_id_fkey" FOREIGN KEY ("stage_id") REFERENCES "public"."stage"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."season_ladder"
    ADD CONSTRAINT "season_ladder_season_id_fkey" FOREIGN KEY ("season_id") REFERENCES "public"."season"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."season_player"
    ADD CONSTRAINT "season_player_player_id_fkey" FOREIGN KEY ("player_id") REFERENCES "public"."player"("id") ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."season_player"
    ADD CONSTRAINT "season_player_season_id_fkey" FOREIGN KEY ("season_id") REFERENCES "public"."season"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."season_result"
    ADD CONSTRAINT "season_result_season_id_fkey" FOREIGN KEY ("season_id") REFERENCES "public"."season"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."season_result"
    ADD CONSTRAINT "season_result_season_id_season_player_id_fkey" FOREIGN KEY ("season_id", "season_player_id") REFERENCES "public"."season_player"("season_id", "id");



ALTER TABLE ONLY "public"."stage"
    ADD CONSTRAINT "stage_game_id_fkey" FOREIGN KEY ("game_id") REFERENCES "public"."game"("id") ON DELETE CASCADE;



ALTER TABLE "public"."admin_user" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "admin_user_select_admin" ON "public"."admin_user" FOR SELECT TO "authenticated" USING (( SELECT "public"."is_admin"() AS "is_admin"));



CREATE POLICY "admin_user_select_self" ON "public"."admin_user" FOR SELECT TO "authenticated" USING ((( SELECT "auth"."uid"() AS "uid") = "user_id"));



ALTER TABLE "public"."game" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."game_result" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "game_result_select_admin" ON "public"."game_result" FOR SELECT TO "authenticated" USING (( SELECT "public"."is_admin"() AS "is_admin"));



CREATE POLICY "game_result_select_public" ON "public"."game_result" FOR SELECT TO "authenticated", "anon" USING (("confirmed" = true));



CREATE POLICY "game_result_write_admin" ON "public"."game_result" TO "authenticated" USING (( SELECT "public"."is_admin"() AS "is_admin")) WITH CHECK (( SELECT "public"."is_admin"() AS "is_admin"));



CREATE POLICY "game_select_public" ON "public"."game" FOR SELECT TO "authenticated", "anon" USING (true);



CREATE POLICY "game_write_admin" ON "public"."game" TO "authenticated" USING (( SELECT "public"."is_admin"() AS "is_admin")) WITH CHECK (( SELECT "public"."is_admin"() AS "is_admin"));



ALTER TABLE "public"."match" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."match_game" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "match_game_select_public" ON "public"."match_game" FOR SELECT TO "authenticated", "anon" USING (true);



CREATE POLICY "match_game_write_admin" ON "public"."match_game" TO "authenticated" USING (( SELECT "public"."is_admin"() AS "is_admin")) WITH CHECK (( SELECT "public"."is_admin"() AS "is_admin"));



CREATE POLICY "match_select_public" ON "public"."match" FOR SELECT TO "authenticated", "anon" USING (true);



CREATE POLICY "match_write_admin" ON "public"."match" TO "authenticated" USING (( SELECT "public"."is_admin"() AS "is_admin")) WITH CHECK (( SELECT "public"."is_admin"() AS "is_admin"));



ALTER TABLE "public"."player" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "player_select_public" ON "public"."player" FOR SELECT TO "authenticated", "anon" USING (true);



CREATE POLICY "player_write_admin" ON "public"."player" TO "authenticated" USING (( SELECT "public"."is_admin"() AS "is_admin")) WITH CHECK (( SELECT "public"."is_admin"() AS "is_admin"));



ALTER TABLE "public"."power_up" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "power_up_select_public" ON "public"."power_up" FOR SELECT TO "authenticated", "anon" USING (true);



ALTER TABLE "public"."power_up_use" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "power_up_use_select_public" ON "public"."power_up_use" FOR SELECT TO "authenticated", "anon" USING (true);



CREATE POLICY "power_up_use_write_admin" ON "public"."power_up_use" TO "authenticated" USING (( SELECT "public"."is_admin"() AS "is_admin")) WITH CHECK (( SELECT "public"."is_admin"() AS "is_admin"));



CREATE POLICY "power_up_write_admin" ON "public"."power_up" TO "authenticated" USING (( SELECT "public"."is_admin"() AS "is_admin")) WITH CHECK (( SELECT "public"."is_admin"() AS "is_admin"));



ALTER TABLE "public"."round" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."round_result" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "round_result_select_public" ON "public"."round_result" FOR SELECT TO "authenticated", "anon" USING (true);



CREATE POLICY "round_result_write_admin" ON "public"."round_result" TO "authenticated" USING (( SELECT "public"."is_admin"() AS "is_admin")) WITH CHECK (( SELECT "public"."is_admin"() AS "is_admin"));



CREATE POLICY "round_select_public" ON "public"."round" FOR SELECT TO "authenticated", "anon" USING (true);



CREATE POLICY "round_write_admin" ON "public"."round" TO "authenticated" USING (( SELECT "public"."is_admin"() AS "is_admin")) WITH CHECK (( SELECT "public"."is_admin"() AS "is_admin"));



ALTER TABLE "public"."season" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."season_ladder" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "season_ladder_select_public" ON "public"."season_ladder" FOR SELECT TO "authenticated", "anon" USING (true);



CREATE POLICY "season_ladder_write_admin" ON "public"."season_ladder" TO "authenticated" USING (( SELECT "public"."is_admin"() AS "is_admin")) WITH CHECK (( SELECT "public"."is_admin"() AS "is_admin"));



ALTER TABLE "public"."season_player" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "season_player_select_public" ON "public"."season_player" FOR SELECT TO "authenticated", "anon" USING (true);



CREATE POLICY "season_player_write_admin" ON "public"."season_player" TO "authenticated" USING (( SELECT "public"."is_admin"() AS "is_admin")) WITH CHECK (( SELECT "public"."is_admin"() AS "is_admin"));



ALTER TABLE "public"."season_result" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "season_result_select_admin" ON "public"."season_result" FOR SELECT TO "authenticated" USING (( SELECT "public"."is_admin"() AS "is_admin"));



CREATE POLICY "season_result_select_public" ON "public"."season_result" FOR SELECT TO "authenticated", "anon" USING (("confirmed" = true));



CREATE POLICY "season_result_write_admin" ON "public"."season_result" TO "authenticated" USING (( SELECT "public"."is_admin"() AS "is_admin")) WITH CHECK (( SELECT "public"."is_admin"() AS "is_admin"));



CREATE POLICY "season_select_public" ON "public"."season" FOR SELECT TO "authenticated", "anon" USING (true);



CREATE POLICY "season_write_admin" ON "public"."season" TO "authenticated" USING (( SELECT "public"."is_admin"() AS "is_admin")) WITH CHECK (( SELECT "public"."is_admin"() AS "is_admin"));



ALTER TABLE "public"."stage" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "stage_select_public" ON "public"."stage" FOR SELECT TO "authenticated", "anon" USING (true);



CREATE POLICY "stage_write_admin" ON "public"."stage" TO "authenticated" USING (( SELECT "public"."is_admin"() AS "is_admin")) WITH CHECK (( SELECT "public"."is_admin"() AS "is_admin"));





ALTER PUBLICATION "supabase_realtime" OWNER TO "postgres";


GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";






















































































































































REVOKE ALL ON FUNCTION "public"."is_admin"() FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."is_admin"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."is_admin"() TO "service_role";



GRANT ALL ON FUNCTION "public"."set_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."set_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."set_updated_at"() TO "service_role";


















GRANT ALL ON TABLE "public"."admin_user" TO "anon";
GRANT ALL ON TABLE "public"."admin_user" TO "authenticated";
GRANT ALL ON TABLE "public"."admin_user" TO "service_role";



GRANT ALL ON TABLE "public"."game" TO "anon";
GRANT ALL ON TABLE "public"."game" TO "authenticated";
GRANT ALL ON TABLE "public"."game" TO "service_role";



GRANT ALL ON TABLE "public"."game_result" TO "anon";
GRANT ALL ON TABLE "public"."game_result" TO "authenticated";
GRANT ALL ON TABLE "public"."game_result" TO "service_role";



GRANT ALL ON TABLE "public"."match" TO "anon";
GRANT ALL ON TABLE "public"."match" TO "authenticated";
GRANT ALL ON TABLE "public"."match" TO "service_role";



GRANT ALL ON TABLE "public"."match_game" TO "anon";
GRANT ALL ON TABLE "public"."match_game" TO "authenticated";
GRANT ALL ON TABLE "public"."match_game" TO "service_role";



GRANT ALL ON TABLE "public"."player" TO "anon";
GRANT ALL ON TABLE "public"."player" TO "authenticated";
GRANT ALL ON TABLE "public"."player" TO "service_role";



GRANT ALL ON TABLE "public"."power_up" TO "anon";
GRANT ALL ON TABLE "public"."power_up" TO "authenticated";
GRANT ALL ON TABLE "public"."power_up" TO "service_role";



GRANT ALL ON TABLE "public"."power_up_use" TO "anon";
GRANT ALL ON TABLE "public"."power_up_use" TO "authenticated";
GRANT ALL ON TABLE "public"."power_up_use" TO "service_role";



GRANT ALL ON TABLE "public"."round" TO "anon";
GRANT ALL ON TABLE "public"."round" TO "authenticated";
GRANT ALL ON TABLE "public"."round" TO "service_role";



GRANT ALL ON TABLE "public"."round_result" TO "anon";
GRANT ALL ON TABLE "public"."round_result" TO "authenticated";
GRANT ALL ON TABLE "public"."round_result" TO "service_role";



GRANT ALL ON TABLE "public"."season" TO "anon";
GRANT ALL ON TABLE "public"."season" TO "authenticated";
GRANT ALL ON TABLE "public"."season" TO "service_role";



GRANT ALL ON TABLE "public"."season_ladder" TO "anon";
GRANT ALL ON TABLE "public"."season_ladder" TO "authenticated";
GRANT ALL ON TABLE "public"."season_ladder" TO "service_role";



GRANT ALL ON TABLE "public"."season_player" TO "anon";
GRANT ALL ON TABLE "public"."season_player" TO "authenticated";
GRANT ALL ON TABLE "public"."season_player" TO "service_role";



GRANT ALL ON TABLE "public"."season_result" TO "anon";
GRANT ALL ON TABLE "public"."season_result" TO "authenticated";
GRANT ALL ON TABLE "public"."season_result" TO "service_role";



GRANT ALL ON TABLE "public"."stage" TO "anon";
GRANT ALL ON TABLE "public"."stage" TO "authenticated";
GRANT ALL ON TABLE "public"."stage" TO "service_role";









ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "service_role";































