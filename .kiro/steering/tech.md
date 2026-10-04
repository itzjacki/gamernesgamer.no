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
  `SUPABASE_SECRET_KEY`. Local `.env.local` points at the local stack. **Before
  any deploy, confirm these are set in the Vercel project settings** — the
  Vercel+Supabase integration may sync the URL and publishable key but not
  necessarily the secret key. `database.types.ts` is generated
  (`supabase gen types typescript --local`); regenerate after each migration.

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

- **Schema changes go through Supabase migrations** in `supabase/migrations/`
  (ordered `<timestamp>_name.sql`). This is the single source of truth. Create
  new migration files with `supabase migration new <name>` — never invent a
  filename or timestamp by hand.
- `supabase/schema.sql` is a GENERATED snapshot (`supabase db dump --local`),
  reference only — never hand-edited, regenerated after each migration (keep the
  "DO NOT EDIT" header).
- **Local dev + test run against the local stack** (`supabase start`, Docker) —
  it is also the staging environment. Verify a migration locally with
  `supabase db reset` (replays all migrations + `seed.sql` from scratch), then
  push to prod. Requires Docker Desktop (CPU virtualization enabled in firmware).

### One apply path per migration (avoid version drift)

A migration's version number must be assigned by exactly one authority. The CLI
stamps a filename timestamp; the MCP `apply_migration` tool stamps its own
timestamp at apply time. Applying the same change through _both_ (hand-authored
file locally + MCP remotely) produces two different versions for one migration —
history drift that confuses later `db push`. We hit this on the initial schema
and had to rename local files to match the remote-recorded versions.

Rules going forward:

- **Default path: `supabase db push`.** Author/iterate locally, verify with
  `db reset`, then `db push` to prod. `db push` reuses the local file's version
  on both sides, so nothing drifts. Requires the project linked once:
  `supabase login` + `supabase link --project-ref <ref>`.
- **Do NOT use MCP `apply_migration` for schema that also exists as a local
  migration file** — that is the exact mix that drifts. MCP `execute_sql` for
  read-only inspection and ad-hoc checks is fine.
- **Incremental changes (columns, indexes, RLS policies): use the skill's flow** —
  iterate with `execute_sql`, then commit with `supabase db pull <name> --local`
  so the CLI assigns one canonical version. Generated SQL is acceptable here.
- **Big, design-heavy schema (rare): hand-author** the file when the inline
  domain comments carry real design intent (as the initial schema does), but
  still apply it the same way on both sides (`db reset` then `db push`), never
  via MCP.
- After any schema change: run advisors (`get_advisors` / `supabase db advisors`)
  and fix findings before considering it done. Pin `search_path` on all
  functions (`set search_path = ''`) to clear the mutable-search-path warning.

### Other

- Historical/season result data is seeded via `supabase/seed.sql` (data, not
  schema) — kept out of migrations so prod doesn't re-run it.
- RLS is enabled on every table from the first migration (locked by default);
  read/write policies land with the admin panel alongside Supabase Auth.
