# Project Structure

## Directory layout

```
src/
  pages/        Routes (Astro file-based routing) — .astro only
    index.astro           Home page (currently the latest season, 04)
    sesong/
      01/ .. 04/
        index.astro       Season landing page
        games/
          [game].astro    Dynamic game detail page (uses getStaticPaths)
  data/         Plain data modules (NOT routed) — .ts
    sesong/
      01/ .. 04/
        gamers.ts         Gamer[] for the season
        games.ts          Game[] for the season
        power-ups.ts      PowerUp[] (+ optional curses) — only when used
  components/   Reusable .astro components (GamerCard, GameCard, etc.)
  layouts/      Layout.astro — shared page shell (head, nav, fonts)
  types/        Shared TypeScript types (e.g. game.ts)
  styles/       global.css — Tailwind import + @theme design tokens
  env.d.ts      Astro client types reference
public/
  images/       Static assets (gamers/<NN>/, game-thumbnails/<NN>/, power-ups/, ...)
  favicon.svg
```

## Key directories

- **`src/pages/`** — Routing only. Each `.astro` file (or `[param].astro`) is a
  page. Do **not** put data modules here; Astro treats `.ts` files under
  `pages/` as endpoints requiring an HTTP handler.
- **`src/data/sesong/<NN>/`** — All content for a season lives together:
  `gamers.ts`, `games.ts`, and (when the season uses them) `power-ups.ts`. This
  per-season grouping is the deliberate, standardized layout — mirror it when
  adding a season.
- **`src/components/`** — Presentational Astro components. Some export their own
  data interfaces (e.g. `GamerCard.astro` exports `Gamer`/`GamerStats`,
  `PowerUpCard.astro` exports `PowerUp`); others consume shared types.
- **`src/types/`** — Shared types not tied to a single component (e.g. `Game`).
- **`src/layouts/Layout.astro`** — Wraps every page: `<head>`, fonts, global
  nav (`SeasonHeader`), and the main content slot.

## File naming conventions

- Astro components: PascalCase (`GamerCard.astro`, `SeasonHeader.astro`).
- Data/type files: lowercase, kebab-case where multi-word (`power-ups.ts`,
  `game.ts`).
- Seasons are zero-padded two-digit directories: `01`, `02`, `03`, `04`.
- Game `slug` values are kebab-case and used both as the data key and the route
  segment; image folders are grouped by season number.

## Import/module organization

- Use the `@/*` path alias (maps to `src/*`) for cross-directory imports —
  e.g. `import { games } from '@/data/sesong/04/games'`. Prefer this over deep
  relative paths.
- Data files export named consts (`export const games`, `export const gamers`,
  `export const powerUps`, and sometimes `export const curses`).
- Pages import the relevant season's data and pass it into components. Dynamic
  routes derive their paths from the data via `getStaticPaths()`.

## Adding a new season (recurring workflow)

1. Create `src/data/sesong/<NN>/` with `gamers.ts` and `games.ts` (add
   `power-ups.ts` only if that season uses them).
2. Add `src/pages/sesong/<NN>/index.astro` and
   `src/pages/sesong/<NN>/games/[game].astro`.
3. Add the season to the nav in `src/components/SeasonHeader.astro`.
4. Add images under `public/images/gamers/<NN>/` and
   `public/images/game-thumbnails/<NN>/`.
5. The home page (`src/pages/index.astro`) currently mirrors the latest season —
   point it at the new season when it goes live.
