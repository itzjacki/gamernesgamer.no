# Tech Stack

- **Next.js App Router** — Server Components by default. `'use client'` only when genuinely needed.
- **React 19** — `.tsx` for all pages and components.
- **TypeScript strict** — extends `next` tsconfig.
- **Tailwind CSS v4** — tokens in `src/styles/global.css` via `@theme`.
- **Supabase** (`@supabase/ssr`) — Postgres (all results data, modeled as full game formats — see structure.md "Data split") + Auth (admin allowlist, invite-only, no public accounts).
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
- **Clients** (`src/lib/supabase/`): `read.ts` is used NOW for result reads —
  server-only, no cookies, uses the **secret** key because RLS is enabled with
  no policies yet (anon/publishable reads return nothing until public read
  policies land). `server.ts` (cookie-bound Auth) and `client.ts` (browser) are
  for the admin panel (Phase 5) and use the publishable key.
- **The eventual public-read flip is isolated to `read.ts`**: once RLS grants
  public reads of `confirmed = true` rows, swap its key to the publishable key —
  no other read-layer change. Queries already filter `confirmed = true`.
- **Env vars** (server-only, NEVER `NEXT_PUBLIC_`): `SUPABASE_URL`,
  `SUPABASE_SECRET_KEY`. Local `.env.local` points at the local stack. Before a
  deploy, confirm both are set in Vercel (the Supabase integration may sync the
  URL + publishable key but not the secret key). Regenerate `database.types.ts`
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
- All user-facing copy is Norwegian.
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

### Other

- Result data is seeded via `supabase/seed.sql` (data, not schema — kept out of
  migrations so prod never re-runs it on a plain `db push`).
- RLS is enabled on every table from the first migration (locked, no policies yet);
  read/write policies land with the admin panel + Supabase Auth.
