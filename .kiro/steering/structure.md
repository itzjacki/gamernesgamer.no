# Project Structure

The tree below is a map of where things go, not an inventory — list the
directory for the current files. Open work lives in `TODO.md`.

```
src/
  app/                  App Router. Route segments are Norwegian.
    page.tsx            The front page, per site state (`src/lib/site-state.ts`).
                        Static, refreshed hourly; the `?tilstand=` state
                        switcher exists only in dev builds.
    sesong/             Season index; [sesong]/ is the season page and
                        [sesong]/[game]/ the game page.
    spillere/           Player index; [spiller]/ is the career page.
    records/            All-time career board, record wall, category crowns.
    vs/                 Pair picker (the pair hero, empty);
                        [a]/[b]/ is the head-to-head page for one ORDERED pair:
                        the first slug is the left-hand side, so both orders
                        exist.
    content/            The media index (/content); every item's anchor.
    admin/              login/ is ungated. Everything under (protected)/ sits
                        behind the allowlist gate in its layout.tsx (pages
                        only: each server action checks is_admin() itself).
                        (protected)/content/ edits the media.
    auth/callback/      OAuth code-exchange. Deliberately outside /admin.
  components/           Shared components and the UI primitives.
  data/sesong/<NN>/     Static season content: meta.ts, gamers.ts (who
                        played: name, nickname), games.ts, power-ups.ts,
                        cards.ts (every card, fully written out).
    index.ts            Season registry + `currentSeason`.
  data/titles.ts        Cross-season title registry (see "Titles and tags").
  lib/
    players/roster.ts   Static cross-season roster; its slugs equal `player.slug`.
    site-state.ts       The site's one state (upcoming / live / just crowned /
                        dormant), derived from season status + dates.
    record-plates.tsx   The one list of record plates, shared by /records and
                        the front page.
    supabase/           Clients, proxy session helper, generated database.types.ts.
    results/            Results read + derivation layer (see below).
    media/              Media read layer (see "Media").
    revalidate.ts       revalidateSite(): what every admin edit calls.
    og/                 Shared parts of the share images. Each route's own
                        image is its `opengraph-image.tsx`; pages without one
                        inherit the front page's. They read the same queries
                        and are prerendered with the pages.
  types/                Shared types.
  styles/global.css     Tailwind import + @theme tokens.
  proxy.ts              Next.js Proxy (formerly middleware).
public/images/          gamers/<N>/, game-thumbnails/<N>/ (both unpadded), power-ups/,
                        champions/<NN>.png, heroes/<slug>.png,
                        seasons/<NN>.png (season index photos), media/
                        (media images; see "Media"), branding/
                        (trophy.svg with plinth; logo.svg, the trophy without;
                        logo-pixel.png, the 32 × 32 pixel mark in the header).
supabase/
  migrations/           Source of truth for the schema.
  schema.sql            GENERATED snapshot. Never hand-edit.
  seed.sql              All historical results (S1–S4). Data, not schema.
scripts/                media-manifest.mjs (runs as predev / prebuild);
                        power-up-art/ (draws the power-up SVGs; run by hand,
                        needs Python)
working-docs/           Secondary reference: decisions, format inventory, raw CSVs.
```

## Results layer (`src/lib/results/`)

Each file has one job; keep the boundaries. Data flows
`fetch → derive → compose → queries → page`.

- `queries.ts` — the only API pages call. Returns `null` for not-found (→
  `notFound()`), throws on error (→ `error.tsx`). `getGameView` never returns
  null: the game page 404s on its static slug and renders without results.
  Does the filesystem lookups (hero portraits, season photos) so `compose`
  stays pure.
- `fetch.ts` — the IO boundary. Filters `confirmed = true`; imports no
  derivation. The H2H tables (`stage`, `match`, `match_game`) have no
  `confirmed` flag, so derivation only reads the matches of games that have
  results. The rounds tables (`round`, `round_result`, the largest) are
  fetched only for the game page, one game's stages at a time, by
  `fetchRounds`; nothing else reads them.
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
  - `game-detail.ts` builds one game's stages for the game page. A bracket
    stage maps each match by `slot_id` onto its kind's static template in
    `src/lib/results/bracket-templates.ts` and throws on a slot the template
    lacks. Rank-then-sum rounds award N − (players strictly better), so a tie
    shares the higher points.
  - `matches.ts` decides each H2H match from its game rows (the outcome is
    never stored) in `decideMatch`; everything else reads
    `GameSummary.matches` or calls `decideMatch`.
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

## Media (`src/lib/media/`)

A media item is a YouTube video or an image in `public/images/media/`, with
optional links to a season, a game and players. The links live in the DB
(`media_item`, `media_item_player`), keyed by season number, game slug and
player slug; the files never do.

- `queries.ts` is the only API pages call. It drops an item whose season,
  game, player or image file doesn't resolve, so a renamed game or a removed
  image hides the item instead of breaking a page; /admin still lists it.
- `select.ts` is pure: which items a page shows. A season page shows the
  season's items without a game; game-linked items belong to the game page.
- `image-manifest.ts` is GENERATED by `scripts/media-manifest.mjs` before
  `dev` and `build`: the image list with pixel sizes, so nothing reads
  `public/` at request time and `next/image` gets dimensions. Filenames are
  lowercase `a-z 0-9 . _ -` (the DB checks the same pattern).
- Public labels are in `labels.ts`; /admin has its own.

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
   (plus `power-ups.ts` if used). `meta.ts` holds the status, the reveal flags,
   the `start`/`end` dates (`YYYY-MM-DD`; equal for a one-day season) and,
   once written, the hand-written `recap`.
   `status` is set by hand, not derived from the dates, and there is no start
   time. `gamers.ts` lists who plays (name, nickname). `cards.ts` holds
   every card in full: a SPILLER card per gamer (image, stats, and an
   `overallChange` against their previous card if any), and once the season
   is finished the champion's MESTER card (with the season points and their
   title count). Each card says whether it's `overnumbered` (numbered past
   the set, as MESTER is); the serial's total counts the cards that aren't. Cards read nothing from `gamers.ts`, other seasons or the
   DB: every printed value is entered, and `cards.test.ts` checks the names
   and the numbering. A season can be announced with `gamers.ts` alone; it
   shows sealed backs, or nothing once revealed, until `cards.ts` is filled.
   Each game needs a `titleId` (add a new title to `src/data/titles.ts` if the
   game has not appeared before) and `formatTags`; a game with a rounds stage
   also a `roundScore` (what its raw scores are; the DB can't tell).
2. Add images under `public/images/gamers/<N>/` and
   `public/images/game-thumbnails/<N>/` (unpadded: `1`, not `01`).
3. Register the season in `src/data/sesong/index.ts` and set `currentSeason`. The
   landing redirect and nav follow from it.
4. Seed the results into Supabase (the `seed-a-season` skill).
5. Optional, by hand: a background-removed champion cutout at
   `public/images/champions/<NN>.png` and hero portraits at
   `public/images/heroes/<slug>.png`, and a landscape season photo at
   `public/images/seasons/<NN>.png` (2:1; jpg and webp work too) for the
   season index. Without them those spots have no picture: card art is only
   ever used on cards.
