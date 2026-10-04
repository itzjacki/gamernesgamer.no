-- Admin membership management: let an existing admin list, add, and remove
-- admins from the /admin panel, instead of only via the service role.
--
-- Design (see also the admin_user comment update at the bottom):
--   * All access to auth.users and all admin_user mutations go through
--     SECURITY DEFINER functions. The app NEVER uses the service-role key; the
--     cookie-bound client uses the publishable key, and these functions are the
--     only privileged path. Each function guards itself with is_admin() as its
--     first act, so a non-admin caller gets nothing (list) or an exception
--     (add/remove).
--   * is_admin() itself stays SECURITY INVOKER (unchanged). Because it is
--     invoker-rights, auth.uid() inside it resolves to the real caller even
--     when called from within one of these DEFINER functions — so the guard is
--     evaluated as "is the *caller* an admin", which is exactly what we want.
--   * search_path = '' pinned on every function; all object refs schema-
--     qualified. Execute revoked from public + anon, granted only to
--     authenticated.
--
-- ADVISOR 0029 — REVIEWED AND INTENTIONALLY ACCEPTED (do not "fix"):
--   These three functions are SECURITY DEFINER and executable by `authenticated`,
--   so Supabase security advisor 0029
--   (authenticated_security_definer_function_executable) WILL fire once per
--   function. This is the documented intentional / false-positive case, not an
--   exposure:
--     - They MUST be SECURITY DEFINER — they read auth.users and write
--       admin_user, which `authenticated` cannot touch under its own rights, so
--       switching to SECURITY INVOKER would break them.
--     - They MUST be callable by `authenticated` — that is how an admin's
--       signed-in session invokes them; revoking EXECUTE would break them too.
--     - They VALIDATE FIRST: every function's first act is the is_admin() guard,
--       so a non-admin hitting /rest/v1/rpc/<name> directly gets zero rows
--       (list) or an exception (add/remove). The REST surface is covered by the
--       guard, not left open.
--   Per Supabase's own 0029 docs this is "Option 3: keep both SECURITY DEFINER
--   and the EXECUTE grant — intentional" for a privileged op that validates its
--   input. The three findings are dismissed in Studio → Advisors → Security.
--   If you re-run get_advisors and see them again, they are expected — confirm
--   the is_admin() guard is still the first statement in each, then re-dismiss.
--
-- SECURITY TRADEOFF (deliberate): shipping admin_add gives up the original
-- property that "a compromised admin session cannot escalate by adding admins"
-- (previously membership was service-role-only). This is accepted for UI-driven
-- management of a tiny trusted group. Retained protections: you can only add
-- users who have ALREADY signed in with Google (no inventing emails); the
-- service role / dashboard remains the recovery escape hatch; and the
-- last-admin guard prevents locking everyone out.

-- ---------------------------------------------------------------------------
-- LIST — admins + addable users + the signed-in-user count, in one call.
-- ---------------------------------------------------------------------------
-- Returns one row per auth user with a resolved display name and whether they
-- are currently an admin. The app splits this into "current admins" and
-- "addable (non-admin) users", and derives the signed-in-user count from the
-- row count. Non-admin callers get zero rows (the WHERE is_admin() guard).
create function public.admin_list_users()
  returns table (
    id           uuid,
    email        text,
    display_name text,
    is_admin     boolean,
    note         text,
    admin_since  timestamptz
  )
  language sql
  stable
  security definer
  set search_path = ''
as $$
  select
    u.id,
    u.email::text,
    coalesce(
      u.raw_user_meta_data ->> 'full_name',
      u.raw_user_meta_data ->> 'name',
      u.email::text
    ) as display_name,
    (au.user_id is not null) as is_admin,
    au.note,
    au.created_at as admin_since
  from auth.users u
  left join public.admin_user au on au.user_id = u.id
  where public.is_admin()
  order by (au.user_id is not null) desc, display_name asc;
$$;

comment on function public.admin_list_users() is 'Admin-only. Lists all signed-in auth users with a resolved display name and admin flag, for the /admin/admins management UI. Returns no rows to non-admins.';

-- ---------------------------------------------------------------------------
-- ADD — promote an existing signed-in user to admin.
-- ---------------------------------------------------------------------------
create function public.admin_add(target_user_id uuid, target_note text default null)
  returns void
  language plpgsql
  security definer
  set search_path = ''
as $$
begin
  if not public.is_admin() then
    raise exception 'not authorized' using errcode = '42501';
  end if;

  if not exists (select 1 from auth.users u where u.id = target_user_id) then
    raise exception 'user does not exist' using errcode = 'P0002';
  end if;

  insert into public.admin_user (user_id, note)
  values (target_user_id, target_note)
  on conflict (user_id) do nothing;
end;
$$;

comment on function public.admin_add(uuid, text) is 'Admin-only. Adds an existing auth user to the admin allowlist. Idempotent. Rejects unknown user ids.';

-- ---------------------------------------------------------------------------
-- REMOVE — demote an admin, blocking removal of the last one.
-- ---------------------------------------------------------------------------
-- Race-safety: we lock the admin_user rows with SELECT ... FOR UPDATE before
-- counting, so two concurrent removes serialize on the row locks — the second
-- waits, re-reads the count, and correctly sees only one admin left. This is
-- tighter than an EXCLUSIVE table lock (doesn't block concurrent SELECTs, so
-- is_admin() / listing keep working during a remove) and consistent with the
-- row-level locking admin_add takes on insert.
create function public.admin_remove(target_user_id uuid)
  returns void
  language plpgsql
  security definer
  set search_path = ''
as $$
declare
  remaining integer;
begin
  if not public.is_admin() then
    raise exception 'not authorized' using errcode = '42501';
  end if;

  -- Lock every admin row so concurrent removes serialize here; the second
  -- caller waits, then re-reads the count below and correctly sees one left.
  -- (FOR UPDATE can't be combined with an aggregate, so lock in a plain row
  -- query first, then count.)
  perform 1 from public.admin_user for update;

  if not exists (select 1 from public.admin_user au where au.user_id = target_user_id) then
    -- Already not an admin; nothing to do (idempotent).
    return;
  end if;

  select count(*) into remaining from public.admin_user;
  if remaining <= 1 then
    raise exception 'cannot remove the last admin' using errcode = 'P0001';
  end if;

  delete from public.admin_user where user_id = target_user_id;
end;
$$;

comment on function public.admin_remove(uuid) is 'Admin-only. Removes a user from the admin allowlist. Blocks removing the last remaining admin (lockout guard), race-safe via SELECT ... FOR UPDATE on admin_user. Idempotent for non-admins.';

-- ---------------------------------------------------------------------------
-- GRANTS — authenticated only; never anon/public. (Each function re-checks
-- is_admin() internally, so a non-admin authenticated user still gets nothing.)
-- ---------------------------------------------------------------------------
revoke execute on function public.admin_list_users()        from public, anon;
revoke execute on function public.admin_add(uuid, text)     from public, anon;
revoke execute on function public.admin_remove(uuid)        from public, anon;

grant execute on function public.admin_list_users()         to authenticated;
grant execute on function public.admin_add(uuid, text)      to authenticated;
grant execute on function public.admin_remove(uuid)         to authenticated;

-- ---------------------------------------------------------------------------
-- Update the admin_user comment to reflect that membership is now also managed
-- from the admin panel (not service-role-only), per the tradeoff above.
-- ---------------------------------------------------------------------------
comment on table public.admin_user is 'Allowlist of admin auth users. Membership grants write access to all tournament tables via RLS. Managed from the /admin panel by existing admins (admin_add / admin_remove RPCs) or via the service role (dashboard). No public signup. Adds are limited to users who have already signed in with Google.';
