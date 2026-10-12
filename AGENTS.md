<!-- kickstart-version: 1 -->

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.

<!-- END:nextjs-agent-rules -->

# Gamernes Gamer

Next.js App Router site on Vercel for a recurring friends' gaming tournament: a
permanent archive of seasons, players and results, and a live companion during
the event. Supabase holds the results; UI copy is Norwegian.

## Commands

- `npm run build` — primary correctness check (TypeScript strict + Next compile)
- `npm run test` — Vitest, pure results layer only (`src/lib/results/__tests__`)
- `npm run lint`
- `npx prettier --write <files>`

Before finishing: the build passes and Prettier has run on the changed files.

## Rules

- **Structural changes:** propose and get approval before implementing.
- **Public copy is human-written.** Never write real public-facing copy, however
  small — make it obvious placeholder and flag it. Exempt: admin-only UI
  (`src/app/admin/**`), where you write real Norwegian directly, and invisible
  a11y text.
- **Data split:** static content (gamers, games, power-ups) lives in
  `src/data/sesong/<NN>/`, never in the DB. Results live in Supabase only; the DB
  is the source of truth and `working-docs/` is secondary reference.
- **Admin routes** (`src/app/admin/`) check the Supabase session server-side.
  Never gate auth client-side.
- **Database:** schema changes go through migrations. Read
  `.kiro/steering/tech.md` before any DB work — it defines the apply path and
  what may be pushed to prod without asking.
- Use subagents for parallelizable or multi-step work; prefer the custom agents
  in `.kiro/agents/`.
- After structural or behavioural changes, update the docs in `.kiro/steering/`.

## Read when relevant

- `.kiro/steering/code-conventions.md` — before non-trivial code changes.
- `.kiro/steering/structure.md` — before adding or moving files, routes or
  seasons, and before touching the results layer or schema.
- `.kiro/steering/tech.md` — before DB, migration, auth or env work.
- `.kiro/steering/design.md` — before any UI or styling work.
- `.kiro/steering/product.md` — before feature-scope decisions.
- `TODO.md` — the active plan: phases, build order, what is built vs planned.
