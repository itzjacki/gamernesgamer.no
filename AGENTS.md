<!-- kickstart-version: 1 -->

# AGENTS.md

Gamernes Gamer — Astro static site (Vercel) for a recurring friends gaming tournament. Shows seasons, players, games, power-ups.

## Commands

- Build: `npm run build` (primary correctness check — no tests)
- Dev: `npm run dev`
- Preview: `npm run preview`
- Lint: `npm run lint:eslint`
- Format: `npx prettier --write <files>` (single quotes, `prettier-plugin-astro`)

## Guidelines

- Structural changes: propose + get approval before implementing.
- Run build and Prettier on changed files before finishing.
- Data lives in `src/data/sesong/<NN>/` (`gamers.ts`, `games.ts`, optional `power-ups.ts`). Never put data in `src/pages/` (Astro routes all `.ts` files there).
- See `.kiro/steering/structure.md` for the "add a season" workflow and `.kiro/steering/code-conventions.md` for conventions.
- Use `@/*` import alias. Match existing Astro/Tailwind patterns and tokens in `src/styles/global.css`.
- UI copy is Norwegian. Roster and power-ups vary per season — treat as per-season data.
- Use subagents frequently for parallelizable or multi-step work. Prefer custom agents in `.kiro/agents/` when available.
- Update steering docs in `.kiro/steering/` after any structural or behavioral changes to the project.
