<!-- kickstart-version: 1 -->

# AGENTS.md

## Project overview

Gamernes Gamer is the companion website for a recurring gaming tournament among
a group of friends. It's an Astro static site (deployed on Vercel) that shows
each season's players, games, and power-ups. It serves the group and a small
spectator audience, and is heading into a significant functionality upgrade.

## Quick reference

- Build: `npm run build`
- Dev server: `npm run dev`
- Preview build: `npm run preview`
- Format: Prettier (single quotes; `prettier-plugin-astro`)
- Lint: none configured — rely on TypeScript strict + `astro build`
- Tests: none configured

## Working guidelines

- Do not go ahead with solutions to problems that have structural consequences for the whole project without consulting first. Propose the approach and tradeoffs, then wait for approval before implementing.
- Run `npm run build` after changes; it's the primary correctness check (there
  are no tests). Fix any build errors before finishing.
- **Run Prettier on changed files before finishing.** There's no `format`
  script — use `npx prettier --write <files>`. Config is `.prettierrc`
  (single quotes) with `prettier-plugin-astro`. See
  `.kiro/steering/code-conventions.md` for the full conventions.
- **Keep data out of `src/pages/`.** Astro routes every `.ts` file under
  `pages/` as an endpoint and will fail the build if it has no HTTP handler.
  Plain data modules live in `src/data/sesong/<NN>/`.
- Follow the per-season data layout (`gamers.ts`, `games.ts`, optional
  `power-ups.ts`) when adding or editing season content. See
  `.kiro/steering/structure.md` for the full "add a season" workflow.
- Use the `@/*` import alias instead of deep relative paths.
- Match the existing Astro/Tailwind patterns and the design tokens in
  `src/styles/global.css` rather than introducing new styling approaches.
- User-facing content is Norwegian — keep new copy in Norwegian.
- Don't assume a fixed participant roster; it can change between seasons.
- Power-ups/curses vary per season in both mechanics and format — treat them as
  per-season data, not a global concept.

## Off-limits (require human approval)

- Nothing is strictly off-limits in this project — the owner has confirmed
  everything is open to change. Still, use normal judgment: avoid destructive
  git operations and don't commit unless asked.
