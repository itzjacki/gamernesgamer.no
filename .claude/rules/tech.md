---
paths:
  - 'supabase/**'
  - 'src/lib/supabase/**'
  - 'src/lib/results/**'
  - 'src/proxy.ts'
---

# Tech

Next.js App Router · React 19 · TypeScript strict · Tailwind CSS v4 · Supabase
(`@supabase/ssr`: Postgres + Auth) · Vercel OG/Satori · Vitest. Hosted on Vercel:
git push deploys, there is no CI.

## Supabase clients and env

Both clients in `src/lib/supabase/` use the **publishable key** and are
RLS-gated. No app code uses the secret key.

- `read.ts` — public result reads. Server-only, no cookies.
- `server.ts` — cookie-bound Auth client for Server Components and Actions (admin).

Env vars: `NEXT_PUBLIC_DB_SUPABASE_URL` and
`NEXT_PUBLIC_DB_SUPABASE_PUBLISHABLE_KEY`. The `DB_` infix is the Vercel Supabase
integration's prefix, so the same names are used in prod and in `.env.local`
(which points at the local stack).

Public pages read results only through `src/lib/results/queries`, and media
only through `src/lib/media/queries` — Server Components only. Queries filter
`confirmed = true` as defense-in-depth on top of RLS.

## Testing

Vitest covers only pure `src/lib` code where a regression would be silent:
the results layer's arithmetic (`derive/**`, `compose.ts`; seasons 1 and 2,
from `working-docs/game-placements.md`, are the verified oracle), card
numbering, the upcoming-season logic and `parseYoutubeId`. IO (`fetch.ts`,
`queries.ts`), the Supabase clients and components are not unit-tested;
`next build` is their gate. Keep tests free of any DB or browser dependency.

## Database workflow

- **Schema changes go through migrations** in `supabase/migrations/`. Create them
  with `supabase migration new <name>` — never invent a filename or timestamp.
- **The local stack** (`supabase start`, Docker) is dev, test and staging. Verify
  a migration with `supabase db reset` (replays migrations + `seed.sql`).
- **Prod holds real data entered in /admin. `supabase db push` (migrations
  only) is the one apply path to it.**
  - **Seed files are local-only.** `seed.sql` deletes and re-inserts seasons
    1–4; `seed-media.sql` restores media deleted in /admin. A guard at the top
    of each refuses to run on prod, whose database comment starts
    `gamernes-gamer: production`. Never remove the guard or the comment, and
    never run `db push --include-seed` or `db reset --linked` / `--db-url`
    (Claude Code denies them in `.claude/settings.json`; the guard can't save
    you from a reset, which wipes the data before the seed runs).
  - **The Supabase MCP is read-only** (`read_only=true` in
    `.mcp.json`): inspect prod with `execute_sql`; write through
    migrations or the dashboard. Never apply file-backed schema via
    `apply_migration` either: it stamps a different version and drifts history.
  - **No automatic backups** (free plan). Before risky prod work, take a data
    dump outside the repo: `supabase db dump --linked --data-only -f <path>`.
  - **Media links use natural keys** (`season.number`, `player.slug`) with
    deferred FKs, because the seed re-inserts seasons and players with new
    uuids. Never link hand-entered data to a seed-written uuid.
  - For incremental tweaks (columns, indexes, policies), iterate on the local
    stack, then capture them with `supabase db pull <name> --local`.
- **After every schema change:**
  - regenerate `supabase/schema.sql` (`supabase db dump --local`, keep the
    "DO NOT EDIT" header) and `database.types.ts`
    (`supabase gen types typescript --local`);
  - run advisors (`get_advisors`, or `supabase db advisors --local`) and fix
    the findings;
  - pin `search_path = ''` on every function.
- **Accepted advisor exception:** lint 0029 fires for `admin_add`,
  `admin_list_users` and `admin_remove`. They must be SECURITY DEFINER and
  callable by `authenticated`, and each checks `is_admin()` first. Re-dismiss the
  finding in Studio if it reappears; do not switch them to INVOKER or revoke
  EXECUTE. Lint 0006 (multiple permissive policies) fires on every table: it is
  the public-read + admin-write policy pair, accepted.

### What may be pushed to prod without asking

- **Additive, reversible migrations** (new tables, columns, functions, policies,
  indexes, grants): apply, run advisors, then report what you did. Additive
  schema normally ships before the app code that uses it.
- **Ask first** for anything destructive or risky: dropping or renaming columns
  or tables, data deletes or backfills, loosening RLS, anything that can break
  the running app. When in doubt, ask.

## Auth and RLS

- RLS is enabled on every table. The public can read structural data and
  `confirmed = true` results; all writes are admin-only.
- An admin is a row in `admin_user`, checked by `public.is_admin()` (SECURITY
  INVOKER). Sign-in is Google-only OAuth. Any Google user can authenticate, but
  access is invite-only: admins add users who have already signed in, from the
  `/admin` dashboard. The service role is the bootstrap and recovery path.
- `/admin/*` is gated in two layers: `src/proxy.ts` refreshes the session and
  redirects signed-out visitors to `/admin/login`; `admin/(protected)/layout.tsx`
  runs `is_admin()` and shows non-admins a rejection screen. The OAuth
  code-exchange lands at `/auth/callback`, outside `/admin`.
- **Redirect URLs** (hosted project, Auth → URL Configuration): `signIn` passes
  `redirectTo: ${origin}/auth/callback`, and a URL missing from the allow-list
  silently falls back to the Site URL. So the Site URL must be the production
  domain, and preview deploys need `https://*-<vercel-team-slug>.vercel.app/**`.
  The local stack's allow-list lives in `supabase/config.toml`.
- **Google OAuth client:** its redirect URIs point at Supabase's callback
  (`http://127.0.0.1:54321/auth/v1/callback` locally,
  `https://<project-ref>.supabase.co/auth/v1/callback` in prod), not the app.
  Locally the client id/secret come from `[auth.external.google]` in
  `config.toml` via `env(...)` (gitignored `supabase/.env`).
- **Bootstrapping an admin:** sign in once at `/admin/login` (the user row is
  created automatically; you'll be rejected), insert the `admin_user` row in
  the dashboard's SQL editor (the MCP is read-only), reload.
