# Project Structure

The tree below is a map of where things go, not an inventory — list the
directory for the current files. What is built vs planned lives in `TODO.md`.

```
src/
  app/                  App Router. Route segments are Norwegian.
    page.tsx            Redirects to the current season.
    sesong/[sesong]/    Season page; [game]/ is the game page.
    spillere/           Player index; [spiller]/ is the career page.
    admin/              login/ is ungated. Everything under (protected)/ sits
                        behind the allowlist gate in its layout.tsx.
    auth/callback/      OAuth code-exchange. Deliberately outside /admin.
  components/           Shared components and the UI primitives.
  data/sesong/<NN>/     Static season content: gamers.ts, games.ts, power-ups.ts.
    index.ts            Season registry + `currentSeason`.
  lib/
    players/roster.ts   Static cross-season roster and playerSlug().
    supabase/           Clients, proxy session helper, generated database.types.ts.
    results/            Results read + derivation layer (see below).
  types/                Shared types.
  styles/global.css     Tailwind import + @theme tokens.
  proxy.ts              Next.js Proxy (formerly middleware).
public/images/          gamers/<NN>/, game-thumbnails/<NN>/, power-ups/,
                        champions/<NN>.png, heroes/<slug>.png.
supabase/
  migrations/           Source of truth for the schema.
  schema.sql            GENERATED snapshot. Never hand-edit.
  seed.sql              All historical results (S1–S4). Data, not schema.
working-docs/           Secondary reference: decisions, format inventory, raw CSVs.
```

## Results layer (`src/lib/results/`)

Each file has one job; keep the boundaries.

- `queries.ts` — the public API pages call: `getSeasonView(n)`,
  `getGameView(n, slug)`, `getCareerView(slug)`, `getAllPlayerSlugs()`. Returns
  `null` for not-found; throws on error. Also resolves hero portraits off the
  filesystem so `compose` stays pure.
- `fetch.ts` — the IO boundary. `fetchSeasonBundle` and `fetchAllSeasonBundles`.
  Filters `confirmed = true`. Imports no derivation.
- `derive/` — pure, synchronous, no IO. Unit-tested. `derive/career/` is the
  cross-season derivation shared by player pages and `/records`; it reads the
  per-season assembler's output and never re-derives placements.
- `compose.ts` — pure. The one seam that joins DB view-models to static
  `src/data/sesong` content (game by slug, player by name, season by padded slug).
- `view-models.ts` — the hand-authored camelCase shapes components consume.
- `raw.ts` — raw row aliases over the generated types. Module-internal.

## Results data model

Game formats are modelled in full, not points-only. The complete model is in
`working-docs/game-formats.md`; the schema is in `supabase/migrations/`. The
points that are easy to get wrong:

- H2H games are `stage → match → match_game`; non-H2H games are
  `stage → round → round_result`. One game can chain both.
- `game_result` and `season_result` store final placements explicitly, because
  tiebreakers can override point totals. Never derive a placement from points.
- Season points per game ARE derived: `season_ladder[placement] +
SUM(power_up_use.points_delta)`.
- Every `*_season_player_id` column, and `match.player_a`/`player_b`, stores
  `season_player.id` — not `player.id`. Join to `player` through `season_player`.

## Adding a new season

1. Create `src/data/sesong/<NN>/` with `gamers.ts` and `games.ts` (plus
   `power-ups.ts` if used). Each gamer carries a `stats` block for the card.
2. Add images under `public/images/gamers/<NN>/` and
   `public/images/game-thumbnails/<NN>/`.
3. Register the season in `src/data/sesong/index.ts` and set `currentSeason`. The
   landing redirect and nav follow from it.
4. Seed the results into Supabase (the `seed-a-season` skill).
5. Optional, by hand: a background-removed champion cutout at
   `public/images/champions/<NN>.png` and hero portraits at
   `public/images/heroes/<slug>.png`. Pages fall back to card art without them.
