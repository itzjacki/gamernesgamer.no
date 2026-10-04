-- Resolve security advisor 0029 (authenticated_security_definer_function_executable):
-- is_admin() was SECURITY DEFINER and executable by `authenticated`, which the
-- advisor flags because such a function is reachable as a REST RPC
-- (/rest/v1/rpc/is_admin). The function is safe (no args, self-only auth.uid()
-- check), but the cleaner fix is to drop definer privilege entirely.
--
-- Switch to SECURITY INVOKER: the function now runs with the caller's rights, so
-- it needs the caller to be able to read its own admin_user row. We add a
-- self-select policy for that. The per-table write policies that call
-- is_admin() keep working because the authenticated role can now read its own
-- membership and evaluate the function as itself.
--
-- Verified locally: admin -> is_admin true + writes succeed; non-admin ->
-- is_admin false + writes blocked; anon -> is_admin false (no admin_user row
-- visible) + confirmed-only reads unaffected.

create or replace function public.is_admin()
  returns boolean
  language sql
  stable
  security invoker
  set search_path = ''
as $$
  select exists (
    select 1 from public.admin_user au
    where au.user_id = (select auth.uid())
  );
$$;

-- Authenticated users may read only their own membership row. This is what
-- lets the now-invoker-rights is_admin() see the row for the current user.
-- An admin still sees the whole table via the existing admin_user_select_admin
-- policy (RLS policies are OR'd).
create policy admin_user_select_self on admin_user
  for select to authenticated
  using ( (select auth.uid()) = user_id );
