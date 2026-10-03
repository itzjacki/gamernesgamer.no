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
      compose.ts        (added at need) joins src/data static content by slug.
      raw.ts            Raw row aliases over generated types (module-internal).
      view-models.ts    Hand-authored camelCase shapes components consume.
      derive/           PURE, sync, no IO — unit-tested against S1.
        points.ts       ladder[placement] + Σ power-up deltas.
        players.ts      season_player.id → PlayerRef resolution.
        index.ts        assembleSeasonView / assembleGameView.
      __tests__/        Vitest: S1 fixtures + derivation tests.
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
working-docs/
  game-formats.md       Resolved data model + per-game format inventory
  game-placements.md    Verified historical points & placements (all 4 seasons)
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
  (decided — see TODO.md "Data modeling depth"). Schema source of truth:
  `supabase/migrations/` (generated reference snapshot in `supabase/schema.sql`).
  The results schema is a stage → match → match_game pipeline for H2H games, and a
  stage → round → round_result pipeline for non-H2H games. A single game can chain
  both (e.g. Trombone Champ: rounds group stage → H2H finals).
  - `stage` (game_id, ordinal, kind, aggregation) — kind ∈ round-robin |
    single-elim | final-bronze | double-elim-reset | double-elim-no-reset | rounds.
    aggregation ∈ sum | rank-then-sum (rounds stages only). A dual round-robin and
    a round-robin with a "swiss finish" are both kind=round-robin (no swiss kind);
    repeated pairings are distinguished by match.leg.
  - `match` (stage_id, slot_id, player_a, player_b, leg, series_len) — player_a/b are
    season_player.id, not player.id. slot_id places elim matches into a fixed template
    per kind (no feeds_into; template edges are static). NULL for standings stages.
    leg (1-indexed) is the meeting number of a pairing in the stage: 1 for single
    round-robin; 2+ for a rematch (dual round-robin or swiss-finish). unique is
    (stage_id, player_a, player_b, leg).
  - `match_game` (match_id, game_number, score_a, score_b, tiebreak_winner) — the
    single source of every H2H result; always two ints. Win-loss games store 1-0.
    tiebreak_winner ('a'|'b') set only when scores are equal.
  - `round` (stage_id, ordinal) — one sub-event in a rounds stage.
  - `round_result` (round_id, season_player_id, raw_score) — the single source of
    every non-H2H result. raw_score always higher = better; negatives allowed.
  - `game_result` (game_id, season_player_id, placement) — final 1..N placement per
    player per game. Stored explicitly (not derived) — tiebreakers can override
    point totals. Only written after game is complete with all ties broken.
  - `season_result` (season_id, season_player_id, placement, note) — final season
    placement. Stored explicitly for same reason.
  - Season points per game are DERIVED: season_ladder[game_result.placement] +
    SUM(power_up_use.points_delta where affected_season_player_id = player).
    The base ladder is season-wide (identical across all games in a season),
    stored in `season_ladder` (season_id, placement, points).
    Power-up deltas stored in `power_up_use` (game_id, power_up_id,
    used_by_season_player_id, affected_season_player_id, points_delta).
  - All `*_season_player_id` columns store `season_player.id`, NOT `player.id`.
    Joining to `player` always goes through `season_player` first.
    Full model + rationale: `working-docs/game-formats.md`; verified historical
    points/placements: `working-docs/game-placements.md`.
