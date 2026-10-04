# Tech Stack

- **Next.js App Router** — Server Components by default. `'use client'` only when genuinely needed.
- **React 19** — `.tsx` for all pages and components.
- **TypeScript strict** — extends `next` tsconfig.
- **Tailwind CSS v4** — tokens in `src/styles/global.css` via `@theme`.
- **Supabase** (`@supabase/ssr`) — Postgres (all results data, modeled as full game formats — see structure.md "Data split") + Auth (admin allowlist via Google OAuth, invite-only, no public accounts).
- **Vercel OG / Satori** — shareable image generation as edge functions.

## Commands

- `npm run build` — primary correctness check (TypeScript strict + Next compile)
- `npm run test` — Vitest, scoped to the pure results-derivation layer only
- `npm run dev` / `npm run start`
- `npm run lint` (`eslint .`)
- `npx prettier --write <files>` — single quotes, `prettier-plugin-tailwindcss`

## Reading results data

- The read layer lives in `src/lib/` (see structure.md). Public pages call
  `getSeasonView(n)` / `getGameView(n, slug)` from `src/lib/results/queries` —
  Server Components only; never a client component.
- **Clients** (`src/lib/supabase/`): `read.ts` is the public result-read client —
  server-only, no cookies, **publishable key** under RLS. Public-read policies
  are live (structural tables world-readable; `game_result`/`season_result`
  expose only `confirmed = true` to anon), so the publishable key returns exactly
  the public data. `server.ts` (cookie-bound Auth) and `client.ts` (browser) are
  the admin-panel clients and also use the publishable key.
- Queries still filter `confirmed = true` as defense-in-depth on top of RLS.
- **Env vars**: all three clients use `NEXT_PUBLIC_SUPABASE_URL` +
  `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` (publishable key is safe client-side and
  RLS-gated). No app code uses the secret key anymore — results are read under
  RLS. Local `.env.local` points at the local stack; before a deploy, confirm
  both `NEXT_PUBLIC_` vars are set in Vercel (the Supabase integration usually
  syncs them). Regenerate `database.types.ts`
  (`supabase gen types typescript --local`) after each migration.

## Testing

- **Vitest covers the pure results layer** — the derivation (`src/lib/results/derive/**`)
  and the compose seam (`compose.ts`), via `src/lib/results/__tests__/`. That
  code is silent arithmetic `next build` can't catch (points, standings,
  aggregation, power-up deltas) plus the DB↔static-content join; Seasons 1 and 2
  provide verified oracle numbers (S2 adds power-ups and a point-tie resolved by
  season_result). The IO layer (`fetch.ts`, `queries.ts`) and Supabase clients
  are NOT unit-tested — `next build` stays their gate. Config: `vitest.config.mts`,
  include glob scoped so tests can't drift into needing a DB or browser.

## Constraints

- Static content (gamers, games, power-ups) stays in `src/data/` as TypeScript. Never in the DB.
- Results data (points, finishing positions) lives in Supabase only.
- Admin routes protected server-side via Supabase session. Never client-side auth gating.
- Dynamic routes use `generateStaticParams()` for pre-rendering.
- All user-facing (public) copy is Norwegian, human-written. Admin-only UI
  (`src/app/admin/**`) copy may be agent-generated Norwegian.
- Hosting: Vercel (Git push to deploy, no CI).

## Database workflow

- **Schema changes go through migrations** in `supabase/migrations/` (ordered
  `<timestamp>_name.sql`) — the single source of truth. Create them with
  `supabase migration new <name>`; never invent a filename/timestamp by hand.
- `supabase/schema.sql` is a GENERATED snapshot (`supabase db dump --local`),
  reference only — regenerate after each migration (keep the "DO NOT EDIT" header).
- **Local stack is dev + test + staging** (`supabase start`, Docker). Verify a
  migration with `supabase db reset` (replays all migrations + `seed.sql`), then
  push to prod.

### Apply path: `supabase db push`

The CLI is linked to the remote project, so `db push` is the one apply path for
both schema and data; it reuses the local file's version on both sides, so history
can't drift.

- **Schema:** author/iterate locally, `db reset` to verify, then `supabase db push`.
- **Seed data:** `supabase db push --linked --include-seed` runs `seed.sql`
  against prod. S1–S4 are already seeded on prod this way. `seed.sql` is idempotent
  (deletes the seasons it owns, then re-inserts), so re-running is safe.
- **Never apply file-backed schema via MCP `apply_migration`** — mixing CLI files
  with MCP stamps different versions for one change and drifts history (it bit the
  initial schema once). MCP `execute_sql` for read-only inspection is fine.
- **Incremental tweaks (columns, indexes, RLS policies):** iterate with
  `execute_sql`, then commit with `supabase db pull <name> --local` so the CLI
  assigns one canonical version.
- After any schema change: run advisors (`get_advisors`) and fix findings. Pin
  `search_path = ''` on all functions.
- **Accepted advisor exception:** lint 0029
  (`authenticated_security_definer_function_executable`) fires for the three
  admin-membership RPCs (`admin_add`, `admin_list_users`, `admin_remove`). This
  is intentional and reviewed (see the header comment in the
  `*_admin_membership_management` migration): they must be SECURITY DEFINER and
  callable by `authenticated`, and each guards with `is_admin()` first, so it is
  the documented false-positive case. The findings are dismissed in Studio →
  Advisors → Security. If they reappear after a re-run, re-dismiss — don't
  "fix" by switching to INVOKER or revoking EXECUTE (either would break them).

### Prod apply autonomy

The agent may apply **additive, reversible** migrations to prod (`supabase db
push`) and run advisors **without asking first** — then report what it did.
"Additive/reversible" = new tables, columns, functions, policies, indexes,
grants; nothing that can lose data or break the live app. Immediately after
applying, the agent runs `get_advisors` and fixes or flags findings (an additive
change's main failure mode is an advisor hit, e.g. a new SECURITY DEFINER
function tripping advisor 0029).

**Destructive or risky operations still require explicit approval**: dropping or
renaming columns/tables, data deletes or backfills, loosening RLS in a way that
could expose or hide rows, or anything that can break the running app. When in
doubt, treat it as destructive and ask.

Ordering note: there is no "deploy app before DB" rule. Additive schema is
normally applied *first*, then the app code that uses it is deployed — the
running app simply doesn't call the new objects until it ships.

### Other

- Result data is seeded via `supabase/seed.sql` (data, not schema — kept out of
  migrations so prod never re-runs it on a plain `db push`).
- RLS is enabled on every table, with policies live (migration
  `*_auth_admin_and_rls_policies`): public reads of structural data +
  `confirmed = true` results; writes restricted to admins. "Admin" = a row in
  `admin_user` (allowlist keyed by auth user id), checked by `public.is_admin()`
  (SECURITY INVOKER, `search_path = ''`). Sign-in is **Google-only OAuth** (no
  passwords); any Google user can authenticate, but access is invite-only — an
  `admin_user` row is added via the service role (no public signup). `/admin/*`
  is gated in two layers: `src/proxy.ts` refreshes the session and redirects
  signed-out visitors to `/admin/login` (coarse, no DB), and
  `admin/(protected)/layout.tsx` runs the `is_admin()` RPC to enforce the
  allowlist, showing authenticated non-admins a rejection screen. OAuth
  code-exchange lands at `/auth/callback`.
