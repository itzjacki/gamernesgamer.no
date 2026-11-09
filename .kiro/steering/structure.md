# Project Structure

The tree below is a map of where things go, not an inventory — list the
directory for the current files. Open work lives in `TODO.md`.

```
src/
  app/                  App Router. Route segments are Norwegian.
    page.tsx            The front page, per site state (`src/lib/site-state.ts`).
                        TEMPORARY: one placeholder block (the lineup) and
                        the `?tilstand=` state preview.
    sesong/             Season index; [sesong]/ is the season page and
                        [sesong]/[game]/ the game page.
    spillere/           Player index; [spiller]/ is the career page.
    records/            All-time career board, record wall, category crowns.
    vs/[a]/[b]/         Head-to-head page for one ORDERED pair of players: the
                        first slug is the left-hand side, so both orders exist.
    admin/              login/ is ungated. Everything under (protected)/ sits
                        behind the allowlist gate in its layout.tsx.
    auth/callback/      OAuth code-exchange. Deliberately outside /admin.
    proto/trofe/        TEMPORARY: the front page's trophy hero prototype
                        (noindex, unlinked; the wireframe `/` borrows it).
                        Becomes a real component when the front page is
                        built; see working-docs/front-page-and-nav.md.
  components/           Shared components and the UI primitives.
  data/sesong/<NN>/     Static season content: meta.ts, gamers.ts, games.ts,
                        power-ups.ts.
    index.ts            Season registry + `currentSeason`.
  data/titles.ts        Cross-season title registry (see "Titles and tags").
  data/tag-labels.ts    Norwegian display labels for every tag.
  lib/
    players/roster.ts   Static cross-season roster and playerSlug().
    tag-ranking.ts      Presentation rule: which tags have enough games to rank.
    season-dates.ts     Display formatting for a season's start/end dates.
    site-state.ts       The site's one state (upcoming / live / just crowned /
                        dormant), derived from season status + dates.
    upcoming-season.ts  The upcoming season and the day countdown to it.
    record-plates.tsx   `RECORD_PLATES`, the one list of record plates (id,
                        label, figure…) keyed by `RecordKey`, shared by
                        /records and the front page's blocks.
    supabase/           Clients, proxy session helper, generated database.types.ts.
    results/            Results read + derivation layer (see below).
  types/                Shared types.
  styles/global.css     Tailwind import + @theme tokens.
  proxy.ts              Next.js Proxy (formerly middleware).
public/images/          gamers/<NN>/, game-thumbnails/<NN>/, power-ups/,
                        champions/<NN>.png, heroes/<slug>.png,
                        seasons/<NN>.jpg (season index photos), branding/
                        (trophy.svg with plinth; logo.svg, the trophy without;
                        logo-pixel.png, the 32 × 32 pixel mark in the header).
supabase/
  migrations/           Source of truth for the schema.
  schema.sql            GENERATED snapshot. Never hand-edit.
  seed.sql              All historical results (S1–S4). Data, not schema.
working-docs/           Secondary reference: decisions, format inventory, raw CSVs.
```

## Results layer (`src/lib/results/`)

Each file has one job; keep the boundaries. Data flows
`fetch → derive → compose → queries → page`.

- `queries.ts` — the only API pages call. Returns `null` for not-found (→
  `notFound()`), throws on error (→ `error.tsx`). Does the filesystem lookups
  (hero portraits, season photos) so `compose` stays pure.
- `fetch.ts` — the IO boundary. Filters `confirmed = true`; imports no
  derivation. The H2H tables (`stage`, `match`, `match_game`) have no
  `confirmed` flag, so derivation only reads the matches of games that have
  results. The rounds tables are not fetched.
- `derive/` — pure, synchronous, no IO, no static data, unit-tested.
  - `career/` is shared by player pages and `/records`; it reads the
    per-season output and never re-derives placements. Tag stats take rows
    whose tags the caller has already resolved.
  - `records/` compares all players on the same terms. Every record is a
    best-first list with shared ranks — a tie stays a tie. A new record is a
    function there, a field on `RecordsView` and an entry in `RECORD_PLATES`
    (`src/lib/record-plates.tsx`; the build fails until it has one).
  - `pair.ts` describes ONE pair for `/vs`: every figure is over what the two
    shared (games both played, seasons both finished, matches against each
    other), never a whole career; sides are `a`/`b` in the order asked for.
  - `matches.ts` decides each H2H match from its game rows (the outcome is
    never stored); everything else reads `GameSummary.matches`.
- `compose.ts` — pure. The one seam that joins DB data to static `src/data`
  content (game by slug, player by name, title by `titleId`, tags).
- `view-models.ts` — the camelCase shapes components consume. Components never
  see raw rows.
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
- Static and DB data join by key: a static `Game.slug` must equal the DB's
  `game.slug` (the seed writes it from the static data), and players join by
  name, since the static `Gamer` has no slug.
- Every `*_season_player_id` column, and `match.player_a`/`player_b`, stores
  `season_player.id` — not `player.id`. Join to `player` through `season_player`.

## Titles and tags

A `Game` in `src/data/sesong/<NN>/games.ts` is one season's _instance_. Its
stable identity across seasons is a **title** in `src/data/titles.ts` (CS:GO and
CS2 are one title; the LoL instances share one), linked by `titleId`.

- `genreTags` live on the title: what kind of game it is.
- `formatTags` live on the instance: what the contest was (`duel`, `gold-rush`,
  `speedrun`, …). May be `[]` when the game was played in its genre's standard
  way.
- An instance may set its own `genreTags` to replace the title's, only when it
  was not the title's usual genre (CS2 as a parkour map).

The two vocabularies are closed unions in `src/types/tag.ts` and are human
judgement — agree new tags with Jakob. `formatTags` are hand-tagged on
purpose, not derived from the DB's `stage.kind`, which records how results
are stored.

**Where a tag is attached is a data decision only.** Everything that reads
tags treats them as one concept, `Tag = GenreTag | FormatTag`: one stats list,
one label map, one table. Don't reintroduce a genre/format split in the stats
or UI.

The minimum sample for ranking a tag (3 games) is a presentation rule: it
lives in `src/lib/tag-ranking.ts`, applied by the consuming components, never
in derivation or compose.

## Adding a new season

1. Create `src/data/sesong/<NN>/` with `meta.ts`, `gamers.ts` and `games.ts`
   (plus `power-ups.ts` if used). `meta.ts` holds the status, the reveal flags
   and the `start`/`end` dates (`YYYY-MM-DD`; equal for a one-day season).
   `status` is set by hand, not derived from the dates, and there is no start
   time. Each gamer carries a `stats` block for the card.
   Each game needs a `titleId` (add a new title to `src/data/titles.ts` if the
   game has not appeared before) and `formatTags`.
2. Add images under `public/images/gamers/<NN>/` and
   `public/images/game-thumbnails/<NN>/`.
3. Register the season in `src/data/sesong/index.ts` and set `currentSeason`. The
   landing redirect and nav follow from it.
4. Seed the results into Supabase (the `seed-a-season` skill).
5. Optional, by hand: a background-removed champion cutout at
   `public/images/champions/<NN>.png` and hero portraits at
   `public/images/heroes/<slug>.png`, and a landscape season photo at
   `public/images/seasons/<NN>.jpg` for the season index. Pages fall back to
   card art without them.
