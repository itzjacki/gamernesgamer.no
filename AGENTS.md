<!-- kickstart-version: 1 -->

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.

<!-- END:nextjs-agent-rules -->

# AGENTS.md

Gamernes Gamer — Next.js (App Router) site on Vercel for a recurring friends gaming tournament. Monument and archive of seasons, players, results, and memorable moments.

## Commands

- Build: `npm run build` (primary correctness check — no tests)
- Dev: `npm run dev`
- Preview: `npm run start`
- Lint: `npm run lint` (`eslint .`)
- Format: `npx prettier --write <files>` (single quotes, `prettier-plugin-tailwindcss`)

## Stack

- **Next.js App Router** — Server Components by default, `'use client'` only when needed
- **Tailwind CSS v4** — tokens in `src/styles/global.css` via `@theme`
- **Supabase** — Postgres (results data) + Auth (admin allowlist). Use `@supabase/ssr`.
  - Server client: `@/lib/supabase/server` (Server Components, Server Actions)
  - Browser client: `@/lib/supabase/client` (`'use client'` components only)
- **Vercel OG / Satori** — shareable image generation at `src/app/api/og/`
- **TypeScript strict** throughout

## Guidelines

- Structural changes: propose + get approval before implementing.
- Run `npm run build` and Prettier on changed files before finishing.
- Static content (gamers, games, power-ups) lives in `src/data/sesong/<NN>/`. Never put it in the database.
- Results data (per-player points, finishing positions) lives in Supabase only.
- Admin routes (`src/app/admin/`) must check Supabase session server-side. Never client-side auth gating.
- Use `@/*` import alias. Match existing patterns and tokens in `src/styles/global.css`.
- UI copy is Norwegian. Roster and power-ups vary per season — treat as per-season data.
- Use subagents frequently for parallelizable or multi-step work. Prefer custom agents in `.kiro/agents/` when available.
- Update steering docs in `.kiro/steering/` after any structural or behavioral changes to the project.

## Site map

- `/` — The Hall (champion monument, season lineage)
- `/sesong/[n]` — Season detail (standings, games, power-ups)
- `/sesong/[n]/[game]` — Game detail
- `/spillere` — Player index
- `/spillere/[spiller]` — Player career page
- `/records` — Hall of Records (all-time stats)
- `/vs/[a]/[b]` — Head-to-head
- `/lore` — Skattkammeret (floating media/lore)
- `/admin` — Results entry (protected, Supabase Auth)

## See also

- `.kiro/steering/structure.md` — full directory layout and "add a season" workflow
- `.kiro/steering/tech.md` — stack details and constraints
- `.kiro/steering/code-conventions.md` — component patterns, naming, formatting
- `.kiro/steering/product.md` — product vision and feature roadmap context
- `TODO.md` — active expansion plan with phases and open questions
