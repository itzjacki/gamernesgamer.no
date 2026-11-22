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
- `npm run test` — Vitest, pure `src/lib` code only (`src/lib/**/__tests__`)
- `npm run lint`
- `npx prettier --write <files>`

Before finishing: the build passes, Prettier has run on the changed files, and
the docs are updated (see Rules).

## Rules

- **Structural changes:** propose and get approval before implementing.
- **Public copy is human-written.** Never write real public-facing copy, however
  small — make it obvious placeholder and flag it. Exempt: admin-only UI
  (`src/app/admin/**`), where you write real Norwegian directly, and invisible
  a11y text.
- **Data split:** static content (gamers, games, power-ups) lives in
  `src/data/sesong/<NN>/`, never in the DB. Results and the media mapping
  (which YouTube video or repo image belongs to which season, game or player)
  live in Supabase only; the DB is the source of truth and `working-docs/` is
  secondary reference. Media files themselves never go in the DB: videos are
  on YouTube, images in `public/images/media/`.
- **Admin routes** (`src/app/admin/`) check the Supabase session server-side.
  Never gate auth client-side.
- **Database:** schema changes go through migrations. Read
  `.claude/rules/tech.md` before any DB work — it defines the apply path and
  what may be pushed to prod without asking.
- Use subagents for parallelizable or multi-step work; prefer the custom agents
  in `.claude/agents/`.
- **Docs follow the work, without being asked** — but only where a rule or
  fact they state changed. Update `TODO.md`, the relevant `.claude/rules/`
  file and any `working-docs/` plan the change touches, in the same piece of
  work. Don't narrate what was built; don't leave it as a follow-up.

## Writing for agents (docs, steering, comments)

Every line here is read on every task, and wrong text misleads more than
missing text. So:

- **One home per fact.** Rules → steering; open work and decisions-against →
  `TODO.md`; reference data → `working-docs/`; why-this-code → a comment. Link,
  don't repeat.
- **Write what the code can't say.** Rules, constraints, gotchas, and why.
  Never inventories, file-by-file tours or descriptions of what was built —
  the code and git history hold those.
- **Keep "decided against" lists, drop the story.** One line per rejected idea
  so it isn't re-proposed; no dates-and-rounds narrative.
- **Delete when done.** Finished TODO items collapse to one line or go;
  superseded docs are deleted, not kept "for reference".
- **Stale is worse than absent.** If a change makes a doc or comment wrong, fix
  or delete it in the same change. When unsure whether a line earns its place,
  leave it out.

## Rules and plan

`.claude/rules/` loads automatically: `product.md` and `structure.md` always,
`code-conventions.md` with `src/` code, `design.md` with `.tsx`/`.css`, and
`tech.md` with `supabase/`, `src/lib/supabase/`, `src/lib/results/` and
`src/proxy.ts`. Read `tech.md` yourself before auth or env work elsewhere.
`TODO.md` is the active plan: open work, and what was decided against.
