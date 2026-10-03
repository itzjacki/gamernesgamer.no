-- =============================================================================
-- Harden set_updated_at(): pin an empty search_path
-- =============================================================================
-- The security advisor flagged set_updated_at() with lint 0011
-- (function_search_path_mutable): a function without a fixed search_path can be
-- hijacked by a caller that manipulates search_path to shadow unqualified
-- object references. This trigger function only assigns new.updated_at := now(),
-- so the practical risk is low, but pinning search_path is the correct, cheap
-- hardening and clears the advisor warning.
--
-- `set search_path = ''` forces every reference inside the function to be
-- schema-qualified. now() lives in pg_catalog, which is always implicitly on
-- the path, so the function body needs no changes.
--
-- Idempotent: create or replace with the same body plus the SET clause.
-- =============================================================================

create or replace function set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;
