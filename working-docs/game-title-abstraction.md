# Game Title Abstraction + Genre/Format Tags — BUILT ON THE CAREER PAGE

> **TEMPORARY working doc.** Delete when the genre/format stats have also
> shipped on `/records` and `/vs`. The permanent description of
> the model is in `.kiro/steering/structure.md` ("Titles and tags").

## The problem

"Game" was overloaded. The static `Game` object (in
`src/data/sesong/<NN>/games.ts`) is a **per-season instance**: slugs like
`league-of-legends-04` exist, and S4 LoL (3-match Arena rounds) is a completely
different contest from S2 LoL (dual-round-robin bo3 dodgeball). "Same game
across seasons" was inferred by string-matching titles — fragile, and unable to
express that **CS:GO ≈ CS2**. Genre had nowhere to live.

## The model (built)

- **title** (`src/data/titles.ts`, type in `src/types/title.ts`; tag vocabularies
  in `src/types/tag.ts`) — the stable
  identity. One entry per real game, keyed by id: `league-of-legends`,
  `counter-strike` (both CS:GO and CS2), `trackmania`. Carries the canonical name
  and **`genreTags`**.
- **game / instance** (`Game`, `src/types/game.ts`) — one appearance in one
  season. Gained **`titleId`**, **`formatTags`** and an optional **`genreTags`**
  override. Results attach here, unchanged.
- **results** — unchanged, in Supabase, keyed to the instance.

Naming: `title`, not `franchise`/`series` (`series` collides with the H2H
`series_len`/bo3 concept). "Game" keeps meaning the instance results attach to.

## Decisions (2026-10-12)

- **Two independent axes.** Genre is what kind of game the title is; format is
  what the contest was. Hollow Knight is a `platformer` whose format was a
  `speedrun` — no override involved.
- **`formatTags` may be empty.** A game played in its genre's standard way has no
  format worth aggregating on (Trackmania time trials; Garry's Mod, where the
  races only measured sandbox effectiveness and players didn't affect each
  other).
- **Genre override is rare.** An instance replaces its title's `genreTags` only
  when it wasn't the title's usual genre. Only CS2 (parkour map → `platformer`)
  uses it.
- **Static TS, not the DB.** Tags are descriptive metadata like the rest of
  `games.ts`; stats are aggregated in the TS derive layer, so the DB would add a
  migration and a wider fetch for nothing. Revisit only if all static game
  content moves into the DB.
- **Format is hand-tagged, not derived from `stage.kind`.** The DB can only
  distinguish match stages from rounds stages, so only `duel` overlaps — and
  `stage.kind` records how results are stored (sometimes a modelling workaround),
  not what the contest was. A cheap guard to consider when the first format stat
  is built: a fail-loud check in `compose.ts` that a `duel`-tagged game has at
  least one match stage.
- **Single-title genres are kept** (`fighting`, `sports`, `moba`, `sandbox`) as
  honest labels, even though one title can't carry a stat alone.

## One concept downstream (2026-10-12)

Genre and format are attached in different places only because some tags
naturally follow the game and others follow the season's contest. To a reader
they answer the same question ("what is this player good at"), so stats, labels
and UI use a single `Tag = GenreTag | FormatTag`: one `tagStats` list, one
`tagLabels` map, one table on the career page. Known effects, accepted: tags
that cover nearly the same games sit next to each other (`climb` is inside
`platformer`; `gold-rush` shares two of three games with `rpg`), and the
extremes are usually 3-game tags because the big buckets (`duel`,
`free-for-all`) average toward the middle.

## Vocabularies

- **Genre:** `shooter`, `racing`, `strategy`, `rpg`, `simulation`, `platformer`,
  `card`, `puzzle`, `party`, `fighting`, `sports`, `moba`, `sandbox`.
- **Format:** `duel` (1v1 between the players), `free-for-all` (everyone in the
  same match, affecting each other), `battle-royale` (PUBG only), `score-attack`
  (highest score in parallel), `gold-rush` (a character in an open world, most
  money in a fixed time — Skyrim, Sims 4, WoW), `climb` (get furthest in a fixed
  time), `speedrun` (fastest time — Hollow Knight only).

The tagging of all 34 S1–S4 games was agreed with Jakob and lives in the data
files.

## Stats (built)

- `assembleCareer` emits `games`: one row per game the player played (season,
  game slug, placement). DB-only.
- `deriveTagStats` (`src/lib/results/derive/career/tags.ts`) groups
  already-tagged rows into `{ tag, games, wins, averagePlacement, results }`,
  best first: lower average, then more games, then more wins. Averages are
  compared at the one decimal they are shown with, so tags that read the same
  on the page count as tied. `results` are the games behind the tag (season, slug, title,
  placement), shown in a popover on the career page.
  A multi-tag game counts toward each tag; an untagged game toward none.
- `composeCareerView` merges each game's genres (its own `genreTags`, else its
  title's) and `formatTags` into one tag list (`gameTags`) and fills
  `CareerView.tagStats` — a single list ranking genre and format tags together.
- `CareerView.tagStatsWithoutOwnPicks` is the same list computed without the
  games the player chose themselves (`chosenBy` equals the player's name; each
  result also carries `ownPick`). The career page toggles between the two with a
  checkbox, off by default.
- Placement is used raw, with no field-size adjustment (a win is a win, per
  `cross-season-normalization.md`).
- **No minimum sample in the producers.** The consuming component decides which
  tags have enough games to be ranked; the agreed cutoff is 3.

## Remaining

- Career page: BUILT (`src/components/TagRecord.tsx`, labels in
  `src/data/tag-labels.ts`). Copy is best-effort `TODO(copy)` awaiting Jakob's
  pass. It prerenders with the full S1–S4 data; the visual result has not
  been reviewed in a browser yet.
- Still to surface: `/records` superlatives and `/vs` comparison.
- Optional guard when a format stat is first shown: a `duel`-tagged game must
  have at least one match stage (fail-loud in `compose.ts`).

## What this unlocks (downstream)

- Career pages: **best genre / worst genre** per player.
- `/vs`: **genre comparison** between two players (see
  `records-vs-hall-directions.md`).
- `/records`: cross-season "best at [genre/format]" superlatives.
- Correctly treating CS:GO and CS2 as one game for all-time stats.
