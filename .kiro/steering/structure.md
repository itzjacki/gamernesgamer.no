# Project Structure

## Directory layout

```
src/
  app/                  Next.js App Router — pages and layouts
    page.tsx            Redirects to current season (The Hall — planned, not yet built)
    layout.tsx          Root layout (head, fonts, grid background, container, nav)
    sesong/
      [sesong]/
        page.tsx        Season detail page
        [game]/
          page.tsx      Game detail page
    spillere/
      page.tsx          Player index (planned)
      [spiller]/
        page.tsx        Player career page (planned)
    records/
      page.tsx          All-time Hall of Records (planned)
    vs/[a]/[b]/
      page.tsx          Head-to-head page (planned)
    lore/
      page.tsx          Skattkammeret (planned)
    admin/
      page.tsx          Admin dashboard (protected, planned)
      login/page.tsx
      results/page.tsx  Results entry form (planned)
    api/og/             Vercel OG image generation (planned)
  components/           Reusable React components (PascalCase .tsx)
  data/sesong/
    01/ .. 04/
      gamers.ts         Gamer[] for the season
      games.ts          Game[] for the season
      power-ups.ts      PowerUp[] + curses — only when used
  lib/supabase/         Server + browser Supabase clients (planned)
  types/                Shared TypeScript types
  styles/global.css     Tailwind import + @theme design tokens
public/
  fonts/
    neue-montreal/      Self-hosted Neue Montreal (Pangram Pangram, OFL)
  images/               Static assets (gamers/<NN>/, game-thumbnails/<NN>/, power-ups/)
```

## Key rules

- `src/data/sesong/<NN>/` — static season content (gamers, games, power-ups). Never in the DB.
- `src/lib/supabase/server` — server client for Server Components/Actions. `src/lib/supabase/client` — browser client for `'use client'` only.
- `src/app/admin/` — all routes check Supabase session server-side. Middleware redirects to `/admin/login`.
- Admin accounts are invite-only, created in Supabase dashboard.
- Use `@/*` alias for all cross-directory imports.
- Data files export named consts: `export const games`, `export const gamers`, `export const powerUps`, `export const curses`.

## Naming

- Components: PascalCase `.tsx` (`GamerCard.tsx`)
- Data/type files: lowercase kebab-case (`power-ups.ts`)
- Season dirs: zero-padded (`01`–`04`)
- Game slugs: kebab-case — used as data key and route segment
- Route segments: Norwegian where applicable (`sesong`, `spillere`)

## Adding a new season

1. Create `src/data/sesong/<NN>/` with `gamers.ts`, `games.ts` (+ `power-ups.ts` if needed).
2. Add images under `public/images/gamers/<NN>/` and `public/images/game-thumbnails/<NN>/`.
3. Seed results into Supabase.
4. Update `currentSeason` in `src/data/sesong/index.ts` (or equivalent) to the new season.
5. Landing page redirect and nav update automatically from `currentSeason`.

## Data split

- **Code:** Gamers, games, power-ups, curses — stable, typed, git-reviewable.
- **Supabase:** All results. We model internal game formats, not points-only
  (decided — see TODO.md "Data modeling depth"). The results schema is a
  stage → match → game pipeline:
  - `stage` (game_id, order, kind) — kind ∈ round-robin | swiss | single-elim |
    final-bronze | double-elim-reset | double-elim-no-reset.
  - `match` (stage_id, slot_id, player_a, player_b, series_len) — no result
    stored; derived from its game rows. slot_id places elim matches into a
    fixed 4-player template per kind (no feeds_into; template edges are static).
  - `game` (match_id, game_number, score_a, score_b) — the single source of
    every result; always two ints. Win-loss games store 1-0 and render as 1-0
    (no win-loss/score flag). Match results and standings are DERIVED.
  - Group/swiss/score stages render as standings tables; elim stages render as
    4-player bracket templates. Scope is 4-player seasons only.
  - Season points per game (ladder + power-up adjustments) are a SEPARATE layer,
    stored per game result — not derived from a shared table.
  Full worksheet + rationale: `working-docs/game-formats.md`; verified historical
  points/placements: `working-docs/game-placements.md`.
