-- Auth admin allowlist + RLS policies.
--
-- Posture: the initial schema enabled RLS on all 14 tables with NO policies
-- (deny-all). This migration grants:
--   * public (anon + authenticated) SELECT of tournament data, with the two
--     leaf result tables gated on confirmed = true;
--   * all writes (insert/update/delete) to admins only.
--
-- "Admin" = a row in public.admin_user keyed by the auth user id. Membership is
-- invite-only: rows are added by an existing admin or via the Supabase dashboard
-- (service role). There is no public signup path.
--
-- Rules followed (Supabase SSR/RLS guidance):
--   * target roles via TO anon / TO authenticated (never deprecated auth.role()).
--   * is_admin() is SECURITY DEFINER with search_path = '' and an auth.uid()
--     check, kept callable only in the way we intend.
--   * every UPDATE policy has both USING and WITH CHECK.
--   * admin writes are TO authenticated + is_admin() (role check + authorization).

-- ---------------------------------------------------------------------------
-- ADMIN ALLOWLIST
-- ---------------------------------------------------------------------------

create table admin_user (
  user_id    uuid        primary key references auth.users (id) on delete cascade,
  note       text,
  created_at timestamptz not null default now()
);

comment on table admin_user is 'Allowlist of admin auth users. Membership grants write access to all tournament tables via RLS. Invite-only: managed by existing admins or the service role (dashboard). No public signup.';

alter table admin_user enable row level security;

-- is_admin(): true when the current request is an authenticated user present in
-- the allowlist. SECURITY DEFINER so policies can consult admin_user without
-- granting every role direct SELECT on it; the auth.uid() check keeps it scoped
-- to the caller's own identity (it can only ever answer "am *I* an admin").
create function public.is_admin()
  returns boolean
  language sql
  stable
  security definer
  set search_path = ''
as $$
  select exists (
    select 1 from public.admin_user au
    where au.user_id = (select auth.uid())
  );
$$;

comment on function public.is_admin() is 'True if the current authenticated user is in the admin_user allowlist. Used by write policies across the schema.';

-- Lock the function down to authenticated only. Supabase grants execute on
-- public functions to anon/authenticated directly (via ALTER DEFAULT
-- PRIVILEGES), so revoking from PUBLIC alone leaves anon's direct grant intact
-- — revoke from anon explicitly. anon never needs to ask (it is never an admin).
revoke execute on function public.is_admin() from public;
revoke execute on function public.is_admin() from anon;
grant execute on function public.is_admin() to authenticated;

-- Admins can see the allowlist (e.g. to manage it from the admin panel).
-- No insert/update/delete policy: membership changes go through the service
-- role (dashboard) for now, so a compromised admin session cannot escalate by
-- adding new admins. We can add admin-managed membership later if wanted.
create policy admin_user_select_admin on admin_user
  for select to authenticated
  using ( (select public.is_admin()) );

-- ---------------------------------------------------------------------------
-- PUBLIC READ + ADMIN WRITE
--
-- Structural tables (describe the tournament's shape; nothing to stage/hide):
--   player, season, season_player, season_ladder, game, power_up,
--   stage, match, round, power_up_use, match_game, round_result
--   -> public SELECT to everyone.
--
-- Leaf result tables with a confirmed flag:
--   game_result, season_result -> public SELECT only where confirmed = true;
--   admins SELECT all (so the panel can review unconfirmed entries).
--
-- match_game and round_result are the raw H2H/round scores. They are
-- meaningless to the public without a confirmed game_result, and the
-- derivation layer needs them, so they are publicly readable. If a stricter
-- posture is ever wanted, gate them behind a join to a confirmed game_result.
--
-- Writes everywhere: admins only (TO authenticated + is_admin()).
-- ---------------------------------------------------------------------------

-- Helper note: these are written out per table rather than generated in a loop,
-- matching the project's "readable duplication over clever code" convention.

-- player
create policy player_select_public on player for select to anon, authenticated using ( true );
create policy player_write_admin   on player for all    to authenticated using ( (select public.is_admin()) ) with check ( (select public.is_admin()) );

-- season
create policy season_select_public on season for select to anon, authenticated using ( true );
create policy season_write_admin   on season for all    to authenticated using ( (select public.is_admin()) ) with check ( (select public.is_admin()) );

-- season_player
create policy season_player_select_public on season_player for select to anon, authenticated using ( true );
create policy season_player_write_admin   on season_player for all    to authenticated using ( (select public.is_admin()) ) with check ( (select public.is_admin()) );

-- season_ladder
create policy season_ladder_select_public on season_ladder for select to anon, authenticated using ( true );
create policy season_ladder_write_admin   on season_ladder for all    to authenticated using ( (select public.is_admin()) ) with check ( (select public.is_admin()) );

-- game
create policy game_select_public on game for select to anon, authenticated using ( true );
create policy game_write_admin   on game for all    to authenticated using ( (select public.is_admin()) ) with check ( (select public.is_admin()) );

-- power_up
create policy power_up_select_public on power_up for select to anon, authenticated using ( true );
create policy power_up_write_admin   on power_up for all    to authenticated using ( (select public.is_admin()) ) with check ( (select public.is_admin()) );

-- stage
create policy stage_select_public on stage for select to anon, authenticated using ( true );
create policy stage_write_admin   on stage for all    to authenticated using ( (select public.is_admin()) ) with check ( (select public.is_admin()) );

-- match
create policy match_select_public on match for select to anon, authenticated using ( true );
create policy match_write_admin   on match for all    to authenticated using ( (select public.is_admin()) ) with check ( (select public.is_admin()) );

-- round
create policy round_select_public on round for select to anon, authenticated using ( true );
create policy round_write_admin   on round for all    to authenticated using ( (select public.is_admin()) ) with check ( (select public.is_admin()) );

-- power_up_use
create policy power_up_use_select_public on power_up_use for select to anon, authenticated using ( true );
create policy power_up_use_write_admin   on power_up_use for all    to authenticated using ( (select public.is_admin()) ) with check ( (select public.is_admin()) );

-- match_game (raw H2H scores — public read, see note above)
create policy match_game_select_public on match_game for select to anon, authenticated using ( true );
create policy match_game_write_admin   on match_game for all    to authenticated using ( (select public.is_admin()) ) with check ( (select public.is_admin()) );

-- round_result (raw round scores — public read, see note above)
create policy round_result_select_public on round_result for select to anon, authenticated using ( true );
create policy round_result_write_admin   on round_result for all    to authenticated using ( (select public.is_admin()) ) with check ( (select public.is_admin()) );

-- game_result (confirmed-gated public read; admins see all)
create policy game_result_select_public on game_result for select to anon, authenticated using ( confirmed = true );
create policy game_result_select_admin  on game_result for select to authenticated using ( (select public.is_admin()) );
create policy game_result_write_admin   on game_result for all    to authenticated using ( (select public.is_admin()) ) with check ( (select public.is_admin()) );

-- season_result (confirmed-gated public read; admins see all)
create policy season_result_select_public on season_result for select to anon, authenticated using ( confirmed = true );
create policy season_result_select_admin  on season_result for select to authenticated using ( (select public.is_admin()) );
create policy season_result_write_admin   on season_result for all    to authenticated using ( (select public.is_admin()) ) with check ( (select public.is_admin()) );
