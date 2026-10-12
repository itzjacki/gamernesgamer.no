---
inclusion: fileMatch
fileMatchPattern:
  ['supabase/**', 'src/lib/supabase/**', 'src/lib/results/**', 'src/proxy.ts']
---

# Tech

Next.js App Router · React 19 · TypeScript strict · Tailwind CSS v4 · Supabase
(`@supabase/ssr`: Postgres + Auth) · Vercel OG/Satori · Vitest. Hosted on Vercel:
git push deploys, there is no CI.

## Supabase clients and env

All three clients in `src/lib/supabase/` use the **publishable key** and are
RLS-gated. No app code uses the secret key.

- `read.ts` — public result reads. Server-only, no cookies.
- `server.ts` — cookie-bound Auth client for Server Components and Actions (admin).
- `client.ts` — browser client for `'use client'` admin components.

Env vars: `NEXT_PUBLIC_DB_SUPABASE_URL` and
`NEXT_PUBLIC_DB_SUPABASE_PUBLISHABLE_KEY`. The `DB_` infix is the Vercel Supabase
integration's prefix, so the same names are used in prod and in `.env.local`
(which points at the local stack).

Public pages read results only through `src/lib/results/queries` — Server
Components only. Queries filter `confirmed = true` as defense-in-depth on top of
RLS.

## Testing

Vitest covers only the pure results layer (`derive/**` and `compose.ts`) via
`src/lib/results/__tests__/` — silent arithmetic the build can't catch. Seasons 1
and 2 are the verified oracle. The IO layer (`fetch.ts`, `queries.ts`) and the
Supabase clients are not unit-tested; `next build` is their gate. Keep tests free
of any DB or browser dependency.

## Database workflow

- **Schema changes go through migrations** in `supabase/migrations/`. Create them
  with `supabase migration new <name>` — never invent a filename or timestamp.
- **The local stack** (`supabase start`, Docker) is dev, test and staging. Verify
  a migration with `supabase db reset` (replays migrations + `seed.sql`).
- **`supabase db push` is the only apply path to prod**, for schema and data.
  - Seed data: `supabase db push --linked --include-seed`. `seed.sql` is
    idempotent (deletes the seasons it owns, then re-inserts) and is kept out of
    migrations so a plain push never re-runs it.
  - **Never apply file-backed schema via MCP `apply_migration`** — it stamps a
    different version and drifts history. MCP `execute_sql` is fine for read-only
    inspection.
  - For incremental tweaks (columns, indexes, policies) you may iterate with
    `execute_sql`, then capture them with `supabase db pull <name> --local`.
- **After every schema change:**
  - regenerate `supabase/schema.sql` (`supabase db dump --local`, keep the
    "DO NOT EDIT" header) and `database.types.ts`
    (`supabase gen types typescript --local`);
  - run advisors (`get_advisors`) and fix the findings;
  - pin `search_path = ''` on every function.
- **Accepted advisor exception:** lint 0029 fires for `admin_add`,
  `admin_list_users` and `admin_remove`. They must be SECURITY DEFINER and
  callable by `authenticated`, and each checks `is_admin()` first. Re-dismiss the
  finding in Studio if it reappears; do not switch them to INVOKER or revoke
  EXECUTE.

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
