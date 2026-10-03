-- =============================================================================
-- Gamernes Gamer — Supabase Schema
-- =============================================================================
-- Dependency order: each table only references tables defined above it.
--
-- ARCHITECTURE NOTES
-- • Static content (game titles, descriptions, player photos, power-up rules)
--   lives in src/data/sesong/<NN>/ TypeScript files. The DB stores results only.
-- • `game` and `power_up` are thin anchor tables keyed by (season_id, slug),
--   where slug is the kebab-case key used in the static TS data and URL routes.
-- • Results pipeline has two parallel tracks per stage:
--     H2H:     stage → match → match_game (score_a / score_b)
--     Non-H2H: stage → round → round_result (raw_score per season_player)
--   A single game (e.g. Trombone Champ) can chain both kinds across stages.
-- • Points = season_ladder[game_result.placement] + SUM(power_up_use.points_delta)
--   for a given (game_id, affected_season_player_id). points_delta always applies
--   to affected_season_player_id. Never stored as a derived column.
--   The base ladder is season-wide — identical for every game in a season.
-- • game_result.placement and season_result.placement are stored explicitly —
--   they are NOT always derivable from points because tiebreakers (e.g. S1
--   Jørgen tiebreak match) can override the point-sum order.
-- • game.status is the single source of truth for whether a game is complete.
--   game_result rows should only exist for complete games — enforced by the app.
-- • "Current season" is derived at query time: the live season if one exists,
--   otherwise the highest-numbered complete season. No stored pointer needed.
--
-- NAMING CONVENTION
-- • Columns named `season_player_id` (or `player_a`/`player_b` on match) store
--   a `season_player.id` — NOT a `player.id`. Joining to `player` always requires
--   going through `season_player` first. Do not join `*_season_player_id` directly
--   to `player.id`.
--
-- UPDATED_AT MAINTENANCE
-- • `updated_at` columns default to now() at insert but are NOT auto-maintained
--   by Postgres. Either:
--   (a) Set updated_at explicitly on every UPDATE in app/Server Actions, or
--   (b) Add a Supabase trigger (recommended for tables edited live during a
--       tournament: match_game, round_result, game_result, season_result).
--   Without this, updated_at stays at insert time and the live leaderboard
--   polling cannot detect stale vs fresh data correctly.
--
-- APP-LEVEL INVARIANTS (enforced by app code / admin panel, not by SQL)
-- • Placement gaplessness: game_result and season_result placements must be
--   consecutive (1, 2, 3…N, no gaps). unique(game_id/season_id, placement)
--   prevents duplicates but not gaps like {1, 3, 4}. Enforced when writing
--   result rows. game_result/season_result are only written after a game or
--   tournament is fully complete and all ties are broken — mid-event standings
--   may be tied, but final recorded placements are always unique and gapless.
-- • Season ladder completeness: season_ladder must have exactly one row per
--   placement (1..N where N = roster size). A missing row causes the points
--   formula to return null for that placement silently.
-- • Ladder vs roster size: max(season_ladder.placement) for a season must equal
--   the number of season_player rows for that season. Enforced on season setup.
-- • Stage kind vs child tables: a stage with kind='rounds' should only have
--   round/round_result children (no matches); all other kinds should only have
--   match/match_game children (no rounds). Not SQL-enforceable — enforced by
--   the admin form and seeding scripts.
-- • match.player_a and match.player_b must belong to the same season as the
--   match's stage → game → season. SQL only enforces roster membership, not
--   same-season alignment.
-- • round_result.season_player_id must belong to the same season as the round's
--   stage → game → season. Same caveat as above.
-- • power_up_use: all season-scoped references (game_id → season,
--   used_by_season_player_id → season_player, affected_season_player_id →
--   season_player, power_up_id → power_up → season) must share the same season.
--   Enforced by the admin form on insert.
-- • power_up_use: if power_up.can_target_others is false,
--   used_by_season_player_id must equal affected_season_player_id. Enforced by
--   the admin form.
-- • match_game.game_number must not exceed the match's series_len, and the
--   series must be complete before the match is considered finished.
-- • match.player_a < match.player_b (by uuid) — insertion order normalised so
--   that unique(stage_id, player_a, player_b) correctly prevents re-entries.
--   The app must enforce this ordering on insert. Consequently,
--   match_game.tiebreak_winner 'a'/'b' is positional on UUID sort order, NOT
--   on seeding or home/away — 'a' always means match.player_a (lesser UUID).
-- =============================================================================


-- ---------------------------------------------------------------------------
-- ENUMS
-- ---------------------------------------------------------------------------

create type season_status as enum ('not-started', 'live', 'complete');

create type game_status as enum ('not-started', 'in-progress', 'complete');

-- stage.kind drives both rendering and which sub-entities are valid.
-- Rendering:
--   round-robin | swiss | rounds → standings table
--   single-elim | final-bronze | double-elim-reset | double-elim-no-reset → bracket
-- Sub-entities:
--   rounds      → round + round_result rows expected; match rows forbidden
--   all others  → match + match_game rows expected; round rows forbidden
create type stage_kind as enum (
  'round-robin',
  'swiss',
  'single-elim',
  'final-bronze',
  'double-elim-reset',
  'double-elim-no-reset',
  'rounds'
);

-- How raw_score values in round_result are aggregated into standings.
-- Only meaningful on stages with kind = 'rounds'.
create type stage_aggregation as enum ('sum', 'rank-then-sum');

create type series_length as enum ('bo1', 'bo3', 'bo5');

-- Which player in a match won a tiebreak (when scores are equal).
-- 'a' = match.player_a won; 'b' = match.player_b won.
-- Positional on UUID sort order — see NAMING CONVENTION above.
create type tiebreak_winner as enum ('a', 'b');


-- ---------------------------------------------------------------------------
-- PLAYER
-- Cross-season identity. One row per real person, ever.
-- ---------------------------------------------------------------------------

create table player (
  id         uuid        primary key default gen_random_uuid(),
  name       text        not null,
  slug       text        not null unique,
  created_at timestamptz not null default now()
);

comment on table  player      is 'Cross-season identity. One row per real person.';
comment on column player.name is 'Display name as used on the site (e.g. "Jakob").';
comment on column player.slug is 'URL-safe identifier for /spillere/[spiller] routes and static TS content linkage (e.g. "jakob").';


-- ---------------------------------------------------------------------------
-- SEASON
-- One row per tournament edition.
-- ---------------------------------------------------------------------------

create table season (
  id         uuid          primary key default gen_random_uuid(),
  number     integer       not null unique check (number >= 1),
  status     season_status not null default 'not-started',
  started_at timestamptz,
  ended_at   timestamptz,
  created_at timestamptz   not null default now(),
  constraint ended_after_started check (
    ended_at is null or started_at is null or ended_at > started_at
  )
);

comment on table  season            is 'One row per tournament edition.';
comment on column season.number     is 'Season number (1-indexed). Matches the NN in src/data/sesong/<NN>/.';
comment on column season.status     is 'Lifecycle state used by the live leaderboard and admin panel.';
comment on column season.started_at is 'When the tournament began. Used for champion lineage display and archive dates.';
comment on column season.ended_at   is 'When the tournament ended. Used for champion cards and archive display.';


-- ---------------------------------------------------------------------------
-- SEASON_PLAYER
-- Roster: which players participated in which season.
-- All result tables FK here, not to player directly, so the DB enforces
-- that you can only record results for players actually on the roster.
-- Carries season_id in a unique constraint so composite FKs can reference
-- (season_id, id) for cross-season integrity checks where needed.
-- ---------------------------------------------------------------------------

create table season_player (
  id        uuid primary key default gen_random_uuid(),
  season_id uuid not null references season (id) on delete cascade,
  player_id uuid not null references player (id) on delete restrict,
  unique (season_id, player_id),
  unique (season_id, id)   -- enables composite FK from child tables
);

comment on table  season_player           is 'Roster join: which players participated in which season.';
comment on column season_player.player_id is 'FK to player.id. All result tables reference season_player.id, not player.id directly.';


-- ---------------------------------------------------------------------------
-- SEASON_LADDER
-- Points awarded per finishing placement for a given season.
-- e.g. S1: (1→4, 2→3, 3→2, 4→1), S3/S4: (1→8, 2→5, 3→3, 4→1)
-- The ladder is season-wide — identical for every game in the season.
-- Placement has no upper bound — supports any roster size.
-- ---------------------------------------------------------------------------

create table season_ladder (
  season_id uuid    not null references season (id) on delete cascade,
  placement integer not null check (placement >= 1),
  points    integer not null check (points >= 0),
  primary key (season_id, placement)
);

comment on table season_ladder is 'Base points per placement per season. Season-wide — identical across all games. Used to derive per-game points from game_result.placement.';


-- ---------------------------------------------------------------------------
-- GAME
-- Thin anchor for each game played in a season. Slug mirrors the static TS
-- data key and URL route segment (e.g. "fc-25", "2xko").
-- The static TS files hold the actual title, description, thumbnail, etc.
-- game.status is the single source of truth for completion — game_result rows
-- should only exist for games with status='complete'.
-- ---------------------------------------------------------------------------

create table game (
  id        uuid        primary key default gen_random_uuid(),
  season_id uuid        not null references season (id) on delete cascade,
  slug      text        not null,
  ordinal   integer     not null check (ordinal >= 1),
  status    game_status not null default 'not-started',
  unique (season_id, slug),
  unique (season_id, ordinal)
);

comment on table  game         is 'Thin DB anchor for each game in a season. Slug matches src/data/sesong/<NN>/games.ts key.';
comment on column game.slug    is 'Kebab-case slug matching the static TS data and URL route (e.g. "fc-25").';
comment on column game.ordinal is 'Play order within the season. May differ from display order in static TS.';
comment on column game.status  is 'Single source of truth for completion. Live leaderboard uses this to exclude unplayed games.';


-- ---------------------------------------------------------------------------
-- POWER_UP
-- Thin anchor for each power-up available in a season. Slug mirrors static TS.
-- ---------------------------------------------------------------------------

create table power_up (
  id                uuid    primary key default gen_random_uuid(),
  season_id         uuid    not null references season (id) on delete cascade,
  slug              text    not null,
  is_curse          boolean not null default false,
  can_target_others boolean not null default false,
  unique (season_id, slug)
);

comment on table  power_up                   is 'Thin DB anchor for each power-up in a season. Slug matches src/data/sesong/<NN>/power-ups.ts key.';
comment on column power_up.slug              is 'Kebab-case slug matching the static TS data.';
comment on column power_up.is_curse          is 'True for curses. Mirrors the static TS separation of powerUps and curses arrays.';
comment on column power_up.can_target_others is 'If true, the power-up can affect a player other than the one who activated it. Drives the admin entry UI.';


-- ---------------------------------------------------------------------------
-- STAGE
-- One phase of a game's pipeline (e.g. group stage, finals bracket).
-- ordinal sequences stages within a game: 1 is played first.
-- ---------------------------------------------------------------------------

create table stage (
  id          uuid              primary key default gen_random_uuid(),
  game_id     uuid              not null references game (id) on delete cascade,
  ordinal     integer           not null check (ordinal >= 1),
  kind        stage_kind        not null,
  aggregation stage_aggregation,
  unique (game_id, ordinal),
  -- aggregation is required for rounds stages and forbidden for all others
  constraint aggregation_rounds_only check (
    (kind = 'rounds' and aggregation is not null) or
    (kind <> 'rounds' and aggregation is null)
  )
);

comment on table  stage             is 'One phase in a game''s pipeline. Determines rendering (standings table vs bracket).';
comment on column stage.ordinal     is '1-indexed position within the game pipeline. 1 is played first.';
comment on column stage.kind        is 'Drives rendering and which sub-entities (match vs round) are valid for this stage.';
comment on column stage.aggregation is 'Required for rounds stages only. How raw_score values roll up to standings.';


-- ---------------------------------------------------------------------------
-- MATCH
-- One meeting of two players within an H2H stage.
-- slot_id is NULL for standings stages (round-robin, swiss).
-- For bracket stages it is a fixed label from that kind's template:
--   single-elim / final-bronze: SF1, SF2, F, BR
--   double-elim-*: WB-SF1, WB-SF2, WB-F, LB-R1-1, LB-R1-2, LB-F, GF (+ GF2 for -reset)
-- Template wiring (who advances where) is static per kind — no feeds_into needed.
--
-- player_a / player_b store season_player.id (not player.id).
-- Insertion order: player_a must always be the lesser UUID (least(p1, p2)).
-- Enforced by the app on insert. This makes unique(stage_id, player_a, player_b)
-- correctly prevent duplicate pairings in round-robin stages.
-- ---------------------------------------------------------------------------

create table match (
  id         uuid          primary key default gen_random_uuid(),
  stage_id   uuid          not null references stage (id) on delete cascade,
  slot_id    text,
  player_a   uuid          not null references season_player (id) on delete restrict,
  player_b   uuid          not null references season_player (id) on delete restrict,
  series_len series_length not null,
  constraint players_differ check (player_a <> player_b),
  constraint player_order   check (player_a < player_b),
  -- Prevents duplicate pairings in round-robin stages (NULLs are distinct so
  -- this does not block multiple NULL slot_ids in standings stages).
  unique (stage_id, player_a, player_b),
  -- One match per bracket slot per stage. NULLs don't collide — safe for
  -- standings stages where multiple matches have slot_id = NULL.
  unique (stage_id, slot_id)
);

comment on table  match            is 'One meeting of two players within an H2H stage.';
comment on column match.slot_id    is 'Bracket position label (e.g. SF1, GF). NULL for standings stages (round-robin, swiss).';
comment on column match.player_a   is 'season_player.id of the lesser UUID. See NAMING CONVENTION.';
comment on column match.player_b   is 'season_player.id of the greater UUID. See NAMING CONVENTION.';
comment on column match.series_len is 'Best-of format for this match.';


-- ---------------------------------------------------------------------------
-- MATCH_GAME
-- One individual contest inside a match (a single game in a bo3/bo5 series).
-- This is the ONLY place H2H results are stored.
-- Win-loss games store the win as 1-0. Score games store real numbers (e.g. 6-1).
--
-- tiebreak_winner: only set when score_a = score_b (e.g. FC25 penalties).
-- 'a' means match.player_a won; 'b' means match.player_b won.
-- NOTE: 'a'/'b' is positional on UUID sort order (player_a is always the
-- lesser UUID), NOT on seeding or home/away. See APP-LEVEL INVARIANTS.
-- The constraint enforces that tiebreak_winner is set if and only if scores tie.
-- ---------------------------------------------------------------------------

create table match_game (
  match_id        uuid            not null references match (id) on delete cascade,
  game_number     integer         not null check (game_number >= 1),
  score_a         integer         not null check (score_a >= 0),
  score_b         integer         not null check (score_b >= 0),
  tiebreak_winner tiebreak_winner,
  created_at      timestamptz     not null default now(),
  updated_at      timestamptz     not null default now(),
  primary key (match_id, game_number),
  -- tiebreak_winner must be set if and only if scores are equal.
  -- Prevents missing tiebreaks on draws and contradictory data.
  constraint tiebreak_iff_draw check (
    (score_a = score_b and tiebreak_winner is not null) or
    (score_a <> score_b and tiebreak_winner is null)
  )
);

comment on table  match_game                 is 'Single contest in a series. The only stored source of H2H results.';
comment on column match_game.game_number     is '1-indexed position within the series (1..series_len).';
comment on column match_game.score_a         is 'Score for match.player_a. Win-loss games use 1 (win) or 0 (loss).';
comment on column match_game.score_b         is 'Score for match.player_b. Win-loss games use 1 (win) or 0 (loss).';
comment on column match_game.tiebreak_winner is '''a'' or ''b'' — set if and only if score_a = score_b. See UPDATED_AT MAINTENANCE.';
comment on column match_game.updated_at      is 'Not auto-maintained — set explicitly on update. See UPDATED_AT MAINTENANCE.';


-- ---------------------------------------------------------------------------
-- ROUND
-- One sub-event within a rounds-type stage (a track, song, map, race).
-- ordinal sequences rounds within the stage: 1 is played first.
-- ---------------------------------------------------------------------------

create table round (
  id       uuid    primary key default gen_random_uuid(),
  stage_id uuid    not null references stage (id) on delete cascade,
  ordinal  integer not null check (ordinal >= 1),
  unique (stage_id, ordinal)
);

comment on table  round         is 'One sub-event within a rounds stage (track, song, map, race).';
comment on column round.ordinal is '1-indexed position within the stage.';


-- ---------------------------------------------------------------------------
-- ROUND_RESULT
-- One player's raw score in one round. The only stored source of non-H2H results.
-- raw_score is always higher = better. For placement-only rounds the admin
-- inputs N..1 (N = best), mirroring the historical CSVs.
-- Negative values are allowed (e.g. S3 Pummel Party: −1 penalty).
-- stage.aggregation determines how raw_score becomes standings:
--   sum          → add raw_score across rounds
--   rank-then-sum → rank by raw_score per round, award N..1 pts, sum the pts
-- ---------------------------------------------------------------------------

create table round_result (
  round_id          uuid        not null references round (id) on delete cascade,
  season_player_id  uuid        not null references season_player (id) on delete restrict,
  raw_score         integer     not null,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),
  primary key (round_id, season_player_id)
);

comment on table  round_result                    is 'One player''s raw score in one round. Higher is always better. Negative scores are valid.';
comment on column round_result.season_player_id   is 'season_player.id — see NAMING CONVENTION. Not player.id.';
comment on column round_result.raw_score          is 'Real score or placement-as-integer (N=best). Negative allowed (e.g. penalties). stage.aggregation determines rollup.';
comment on column round_result.updated_at         is 'Not auto-maintained — set explicitly on update. See UPDATED_AT MAINTENANCE.';


-- ---------------------------------------------------------------------------
-- GAME_RESULT
-- Final placement per player per game. The season points layer anchor.
-- Placement is always unique within a game (no ties — resolved before recording).
-- Stored explicitly; not derived from match/round data because tiebreakers
-- outside the recorded matches can affect final placement.
-- Total points = season_ladder[placement] + SUM(power_up_use.points_delta)
--   where power_up_use.affected_season_player_id = this season_player_id.
--
-- confirmed: false until an admin reviews and signs off on the result.
-- ---------------------------------------------------------------------------

create table game_result (
  game_id          uuid        not null references game (id) on delete cascade,
  season_player_id uuid        not null references season_player (id) on delete restrict,
  placement        integer     not null check (placement >= 1),
  confirmed        boolean     not null default false,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),
  primary key (game_id, season_player_id),
  unique (game_id, placement)
);

comment on table  game_result                    is 'Final placement per player per game. Anchor for the season points layer.';
comment on column game_result.season_player_id   is 'season_player.id — see NAMING CONVENTION. Not player.id.';
comment on column game_result.placement          is 'Unique within the game (1=1st). Stored, not derived — tiebreakers can override point totals.';
comment on column game_result.confirmed          is 'False until an admin confirms the result. Unconfirmed results should not appear on the public site.';
comment on column game_result.updated_at         is 'Not auto-maintained — set explicitly on update. See UPDATED_AT MAINTENANCE.';


-- ---------------------------------------------------------------------------
-- POWER_UP_USE
-- Records a power-up being played for a specific game.
-- used_by_season_player_id: the player who activated the power-up.
-- affected_season_player_id: the player whose season points are modified.
--   points_delta applies to this player — group by affected_season_player_id
--   when computing total points for a player+game combination.
-- points_delta: positive = bonus, negative = penalty, 0 = non-points effect.
--
-- unique(game_id, power_up_id, used_by_season_player_id, affected_season_player_id):
--   prevents the same player being hit twice by the same activation, while
--   allowing one use to produce multiple rows (one per affected player) for
--   AOE power-ups/curses that affect more than one player simultaneously.
-- ---------------------------------------------------------------------------

create table power_up_use (
  id                        uuid    primary key default gen_random_uuid(),
  game_id                   uuid    not null references game (id) on delete cascade,
  power_up_id               uuid    not null references power_up (id) on delete restrict,
  used_by_season_player_id  uuid    not null references season_player (id) on delete restrict,
  affected_season_player_id uuid    not null references season_player (id) on delete restrict,
  points_delta              integer not null,
  unique (game_id, power_up_id, used_by_season_player_id, affected_season_player_id)
);

comment on table  power_up_use                              is 'Records a power-up activation for a game. points_delta applies to affected_season_player_id.';
comment on column power_up_use.used_by_season_player_id    is 'The player who activated the power-up. season_player.id — see NAMING CONVENTION.';
comment on column power_up_use.affected_season_player_id   is 'The player whose points are modified. Group by this column when summing points_delta.';
comment on column power_up_use.points_delta                is 'Points added (positive) or removed (negative) from affected_season_player_id''s total for this game.';


-- ---------------------------------------------------------------------------
-- SEASON_RESULT
-- Final season placement per player. Stored explicitly — cannot always be
-- derived from point totals because tiebreakers (e.g. S1: Jørgen won a
-- Pokémon Showdown tiebreak match) can override the point-sum order.
-- note captures the tiebreak story or any other context worth archiving.
--
-- Composite FK (season_id, season_player_id) → season_player(season_id, id)
-- ensures the referenced season_player belongs to this season.
-- ---------------------------------------------------------------------------

create table season_result (
  season_id        uuid        not null references season (id) on delete cascade,
  season_player_id uuid        not null,
  placement        integer     not null check (placement >= 1),
  note             text,
  confirmed        boolean     not null default false,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),
  primary key (season_id, season_player_id),
  unique (season_id, placement),
  foreign key (season_id, season_player_id) references season_player (season_id, id)
);

comment on table  season_result                    is 'Final season placement per player. Stored explicitly — tiebreakers can override point totals.';
comment on column season_result.season_player_id   is 'season_player.id, constrained via composite FK to the correct season. See NAMING CONVENTION.';
comment on column season_result.placement          is 'Unique within the season (1=champion). Not always derivable from points.';
comment on column season_result.note               is 'Optional tiebreaker story or context (e.g. "Jørgen won Gen 6 random match tiebreak").';
comment on column season_result.confirmed          is 'False until an admin confirms the final standings.';
comment on column season_result.updated_at         is 'Not auto-maintained — set explicitly on update. See UPDATED_AT MAINTENANCE.';


-- ---------------------------------------------------------------------------
-- INDEXES
-- The dataset is tiny (4 seasons, ~40 games, ~hundreds of result rows) so
-- indexes are for FK lookup performance and query clarity, not load.
-- Composite PKs already cover the most common lookup patterns.
-- ---------------------------------------------------------------------------

create index on season_player  (player_id);
create index on game           (season_id);
create index on power_up       (season_id);
create index on stage          (game_id);
create index on match          (stage_id);
create index on match          (player_a);
create index on match          (player_b);
-- match_game: PK is (match_id, game_number) — match_id already covered, no extra index needed.
create index on round          (stage_id);
create index on round_result   (season_player_id);
create index on game_result    (season_player_id);
create index on power_up_use   (game_id);
create index on power_up_use   (power_up_id);
create index on power_up_use   (used_by_season_player_id);
create index on power_up_use   (affected_season_player_id);
create index on season_result  (season_player_id);



-- ---------------------------------------------------------------------------
-- UPDATED_AT TRIGGERS
-- The schema header notes updated_at is NOT auto-maintained by Postgres.
-- Rather than relying on every Server Action to set it, a shared trigger
-- maintains it on the four tables that are edited live during a tournament.
-- This keeps the live-leaderboard polling able to detect fresh vs stale rows.
-- Tables without an updated_at column (player, season, roster/anchor tables,
-- match, round, power_up_use) are intentionally excluded.
-- ---------------------------------------------------------------------------

create or replace function set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

comment on function set_updated_at() is 'Sets updated_at to now() on every UPDATE. Attached to the live-edited result tables.';

create trigger set_updated_at
  before update on match_game
  for each row execute function set_updated_at();

create trigger set_updated_at
  before update on round_result
  for each row execute function set_updated_at();

create trigger set_updated_at
  before update on game_result
  for each row execute function set_updated_at();

create trigger set_updated_at
  before update on season_result
  for each row execute function set_updated_at();


-- ---------------------------------------------------------------------------
-- ROW LEVEL SECURITY
-- Posture decision (option a): enable RLS on every table now, with NO policies
-- yet. With RLS enabled and no policy present, the table denies all access via
-- the anon/authenticated API keys by default (the service_role key bypasses RLS
-- and is used server-side for seeding and admin reads until policies land).
--
-- This is the safe default: tables are locked until we deliberately grant
-- access. Read policies (public reads of confirmed results) and write policies
-- (admin-only inserts/updates) arrive in the admin-panel migration, alongside
-- the Supabase Auth allowlist. Do NOT expose any of these tables through the
-- anon key before those policies exist.
-- ---------------------------------------------------------------------------

alter table player         enable row level security;
alter table season         enable row level security;
alter table season_player  enable row level security;
alter table season_ladder  enable row level security;
alter table game           enable row level security;
alter table power_up       enable row level security;
alter table stage          enable row level security;
alter table match          enable row level security;
alter table match_game     enable row level security;
alter table round          enable row level security;
alter table round_result   enable row level security;
alter table game_result    enable row level security;
alter table power_up_use   enable row level security;
alter table season_result  enable row level security;
