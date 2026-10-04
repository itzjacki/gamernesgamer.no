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
  lib/
    supabase/           Supabase clients + generated DB types
      read.ts           Server-only, secret-key, no-cookie client. Used NOW for
                        result reads (RLS locked, no policies yet).
      server.ts         Cookie-bound Auth client (admin panel, Phase 5).
      client.ts         Browser client (admin panel, Phase 5).
      database.types.ts GENERATED (supabase gen types --local). Do NOT hand-edit.
    results/            Read + derivation layer for tournament results
      queries.ts        Public API: getSeasonView(n) / getGameView(n, slug).
                        Server Components only. null → notFound(); throw → error.
      fetch.ts          IO boundary — one raw per-season bundle. confirmed=true
                        filtered here. Imports no derivation.
      compose.ts        Joins DB view-models to static src/data/sesong content:
                        game by slug, player by name, season by padded slug.
                        PURE; the one seam that imports both halves. Pages call
                        it when they need results + static content together.
      raw.ts            Raw row aliases over generated types (module-internal).
      view-models.ts    Hand-authored camelCase shapes components consume.
      derive/           PURE, sync, no IO — unit-tested against S1.
        points.ts       ladder[placement] + Σ power-up deltas.
        players.ts      season_player.id → PlayerRef resolution.
        index.ts        assembleSeasonView / assembleGameView.
      __tests__/        Vitest: S1 + S2 fixtures, derivation + compose tests.
  types/                Shared TypeScript types
  styles/global.css     Tailwind import + @theme design tokens
public/
  fonts/
    neue-montreal/      Self-hosted Neue Montreal (Pangram Pangram, OFL)
  images/               Static assets (gamers/<NN>/, game-thumbnails/<NN>/, power-ups/)
supabase/
  config.toml           Supabase CLI config (local stack, project link).
  migrations/           SOURCE OF TRUTH for the DB schema. Ordered SQL migrations
    <ts>_initial_schema.sql  First migration: full schema + updated_at triggers +
                        RLS enabled (locked; policies land with the admin panel).
  schema.sql            GENERATED reference snapshot (via `supabase db dump`).
                        Do NOT edit by hand — regenerate after each migration.
  seed.sql              Historical results data (S1–S4). Data, not schema — kept
                        out of migrations. Applied by `db reset` (local) and
                        `db push --include-seed` (prod). The live results source.
working-docs/           Secondary reference (the DB is the source of truth).
  game-formats.md       Data model + per-game format inventory
  game-placements.md    Verified historical points & placements (all 4 seasons)
  cross-season-normalization.md  Open decision for /records + /vs
  result-spreadsheets/  Raw per-game CSVs per season (provenance, in git)
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

- **Code** (`src/data/sesong/<NN>/`): gamers, games, power-ups, curses — stable,
  typed, git-reviewable. Never in the DB.
- **Supabase: the source of truth for all results.** Seeded via
  `supabase/seed.sql` and pushed to prod; this database is authoritative for
  points, placements, and game formats. The `working-docs/` markdown and the
  CSVs in `working-docs/result-spreadsheets/` are **secondary** — kept in git as
  provenance and extra per-game detail, not the live data. If they ever disagree
  with the DB, the DB wins.

We model internal game formats, not points-only. The results schema is a
stage → match → match_game pipeline for H2H games, and a stage → round →
round_result pipeline for non-H2H games; a single game can chain both (e.g.
Trombone Champ: rounds group → H2H finals). Schema source of truth:
`supabase/migrations/` (generated snapshot: `supabase/schema.sql`).

- `stage` (game_id, ordinal, kind, aggregation) — kind ∈ round-robin |
  single-elim | final-bronze | double-elim-reset | double-elim-no-reset | rounds.
  aggregation ∈ sum | rank-then-sum (rounds stages only). A dual round-robin and
  a "swiss finish" are both kind=round-robin; repeated pairings are distinguished
  by match.leg (no swiss kind).
- `match` (stage_id, slot_id, player_a, player_b, leg, series_len) — player_a/b
  are season_player.id. slot_id places elim matches into a fixed per-kind template
  (static edges, no feeds_into); NULL for standings stages. leg (1-indexed) is the
  meeting number of a pairing — 1 for single round-robin, 2+ for a rematch (dual
  round-robin, swiss finish, or a bracket rematch). unique (stage_id, player_a,
  player_b, leg).
- `match_game` (match_id, game_number, score_a, score_b, tiebreak_winner) — the
  source of every H2H result; always two ints. Win-loss stored 1-0.
  tiebreak_winner set only when scores are equal.
- `round` (stage_id, ordinal, label) + `round_result` (round_id,
  season_player_id, raw_score) — the source of every non-H2H result. raw_score is
  always higher = better; negatives allowed.
- `game_result` (game_id, season_player_id, placement) and `season_result`
  (season_id, season_player_id, placement, note) — final placements, stored
  explicitly (not derived) because tiebreakers can override point totals.
- Season points per game are DERIVED: `season_ladder[game_result.placement] +
  SUM(power_up_use.points_delta)`. The ladder is season-wide (identical across all
  games), in `season_ladder`; power-up deltas in `power_up_use`.
- All `*_season_player_id` columns (incl. match.player_a/b) store
  `season_player.id`, NOT `player.id` — join to `player` through `season_player`.

Full model: `working-docs/game-formats.md`. Verified points/placements:
`working-docs/game-placements.md`.
