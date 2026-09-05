# Project Structure

## Directory layout

```
src/
  app/                  Next.js App Router — pages and layouts
    page.tsx            The Hall (landing page / champion monument)
    layout.tsx          Root layout (head, nav, fonts)
    sesong/
      page.tsx          Season index
      [sesong]/
        page.tsx        Season detail page
        [game]/
          page.tsx      Game detail page
    spillere/
      page.tsx          Player index
      [spiller]/
        page.tsx        Player career page
    records/
      page.tsx          All-time Hall of Records
    vs/[a]/[b]/
      page.tsx          Head-to-head page
    lore/
      page.tsx          Skattkammeret (floating media/lore)
    admin/
      page.tsx          Admin dashboard (protected)
      login/page.tsx
      results/page.tsx  Results entry form
    api/og/             Vercel OG image generation
  components/           Reusable React components (PascalCase .tsx)
  data/sesong/
    01/ .. 04/
      gamers.ts         Gamer[] for the season
      games.ts          Game[] for the season
      power-ups.ts      PowerUp[] + curses — only when used
  lib/supabase/         Server + browser Supabase clients
  types/                Shared TypeScript types
  styles/global.css     Tailwind import + @theme design tokens
public/images/          Static assets (gamers/<NN>/, game-thumbnails/<NN>/, power-ups/)
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
4. Add season to nav in `src/components/SeasonHeader.tsx`.
5. Landing page pulls latest champion from DB automatically.

## Data split

- **Code:** Gamers, games, power-ups, curses — stable, typed, git-reviewable.
- **Supabase:** Results only — points and finishing positions per player per game per season.
