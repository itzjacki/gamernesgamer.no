# Project Structure

The tree below is a map of where things go, not an inventory — list the
directory for the current files. What is built vs planned lives in `TODO.md`.

```
src/
  app/                  App Router. Route segments are Norwegian.
    page.tsx            Redirects to the current season.
    sesong/[sesong]/    Season page; [game]/ is the game page.
    spillere/           Player index; [spiller]/ is the career page.
    records/            All-time career board, record wall, category crowns.
    admin/              login/ is ungated. Everything under (protected)/ sits
                        behind the allowlist gate in its layout.tsx.
    auth/callback/      OAuth code-exchange. Deliberately outside /admin.
  components/           Shared components and the UI primitives.
  data/sesong/<NN>/     Static season content: gamers.ts, games.ts, power-ups.ts.
    index.ts            Season registry + `currentSeason`.
  data/titles.ts        Cross-season title registry (see "Titles and tags").
  data/tag-labels.ts    Norwegian display labels for every tag.
  lib/
    players/roster.ts   Static cross-season roster and playerSlug().
    tag-ranking.ts      Presentation rule: which tags have enough games to rank.
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
  `getGameView(n, slug)`, `getCareerView(slug)`, `getAllPlayerSlugs()`,
  `getRecordsView()`. Returns `null` for not-found; throws on error. Also
  resolves hero portraits off the filesystem so `compose` stays pure.
- `fetch.ts` — the IO boundary. `fetchSeasonBundle` and `fetchAllSeasonBundles`.
  Filters `confirmed = true`. Imports no derivation. The bundle also carries
  the head-to-head tables (`stage`, `match`, `match_game`); they have no
  `confirmed` flag, so derivation only reads the matches of games that have
  results. The rounds tables are not fetched yet.
- `derive/` — pure, synchronous, no IO. Unit-tested. `derive/career/` is the
  cross-season derivation shared by player pages and `/records`; it reads the
  per-season assembler's output and never re-derives placements. `derive/`
  imports no static data, so `derive/career/tags.ts` (`deriveTagStats`) takes
  rows whose tags the caller has already resolved. `derive/records/` compares
  all players (`deriveRecords`: the career board and every record on
  `/records`), on the same terms: its game and match rows arrive with title,
  tags and own-pick flag already joined. Every record is a best-first list of
  `RecordEntry` with shared ranks — a tie stays a tie. One file per family:
  `index.ts` (placement- and season-based records, and the assembly),
  `match-records.ts` (head-to-head matches), `rivalries.ts` (the pair record),
  over shared `helpers.ts`, `rank.ts` and `streaks.ts`. A new record is a
  function there, a field on `RecordsView`, and a `RecordPlate` on the page. `derive/matches.ts` decides each head-to-head
  match from its game rows (the outcome is never stored) and puts the decided
  ones on `GameSummary.matches`; careers and the match records read from there.
- `compose.ts` — pure. The one seam that joins DB view-models to static
  `src/data` content (game by slug, player by name, season by padded slug, title
  by `titleId`). It resolves each game's tags (`gameTags`) and calls
  `deriveTagStats` to fill `CareerView.tagStats`. `composeRecordsView` does the
  same join for all players and calls `deriveRecords`.
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

The two vocabularies are closed unions in `src/types/tag.ts` (`GenreTag`,
`FormatTag`) and are human judgement — agree new tags with Jakob. `formatTags`
are hand-tagged on purpose, not derived from the DB's `stage.kind`, which
records how results are stored.

**Where a tag is attached is a data decision only.** Everything that reads tags
treats them as one concept, `Tag = GenreTag | FormatTag`: compose merges a
game's genre and format tags (`gameTags`), `CareerView.tagStats` is one list
(games, wins, average placement and the underlying game results per tag,
unfiltered; best first, with averages equal at one decimal tied and broken by
more games, then more wins), with a sibling `tagStatsWithoutOwnPicks` that
leaves out the games the player chose (`Game.chosenBy` equal to the player's
name), the labels
are one map (`src/data/tag-labels.ts`, a `Record<Tag, string>` so a new tag
fails the build without a label), and the career page shows one table
(`src/components/TagRecord.tsx`). Don't reintroduce a genre/format split in the
stats or UI without a reason.

Any minimum sample for ranking a tag (agreed: 3 games) belongs to the consuming
component, not to the derivation or compose. It lives in `src/lib/tag-ranking.ts`
(`MIN_RANKED_GAMES`, `splitRanked`), shared by `TagRecord`, `CareerLedger` and
`TagCrowns`.

## Adding a new season

1. Create `src/data/sesong/<NN>/` with `gamers.ts` and `games.ts` (plus
   `power-ups.ts` if used). Each gamer carries a `stats` block for the card.
   Each game needs a `titleId` (add a new title to `src/data/titles.ts` if the
   game has not appeared before) and `formatTags`.
2. Add images under `public/images/gamers/<NN>/` and
   `public/images/game-thumbnails/<NN>/`.
3. Register the season in `src/data/sesong/index.ts` and set `currentSeason`. The
   landing redirect and nav follow from it.
4. Seed the results into Supabase (the `seed-a-season` skill).
5. Optional, by hand: a background-removed champion cutout at
   `public/images/champions/<NN>.png` and hero portraits at
   `public/images/heroes/<slug>.png`. Pages fall back to card art without them.
