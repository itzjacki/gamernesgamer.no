# Game Title Abstraction + Genre Tags — PLANNED

> **TEMPORARY working doc.** Delete when the Title layer + genre tags are built,
> seeded, and reflected in `src/data` + the compose layer. Not a permanent doc.

## The problem

"Game" is overloaded today. The current static `Game` object (in
`src/data/sesong/<NN>/games.ts`) is already a **per-season instance**: slugs like
`league-of-legends-04` exist, and S4 LoL (3-match Arena rounds) is a completely
different format from S2 LoL (dual-round-robin bo3 H2H). They're already separate
objects that merely share a title string.

"Same game across seasons" is currently inferred by **string-matching titles** —
fragile, and it can't express that **CS:GO ≈ CS2** (same game, different launcher).
And **genre** ("driving", "shooter") is a property of the game's identity, not of a
single season's appearance — so it has nowhere clean to live today.

## The model (additive — confirmed low-risk)

Three levels. Naming chosen deliberately (`title`, not `franchise`/`series`):
`series` collides with the H2H `series_len`/bo3 concept; `franchise` overclaims
(LoL S2 vs S4 is the _same_ game, not a franchise).

- **`title`** (NEW, stable identity) — the canonical game. One row per real game:
  `league-of-legends`, `counter-strike` (both CS:GO and CS2 point here),
  `trackmania`. Carries: canonical name, **genre tags (multi-valued)**, optional
  franchise/identity notes. This is what career "best genre / worst genre" and
  cross-season "best at racing" aggregate over.
- **`game` / instance** (TODAY's `Game`, unchanged in role) — a specific appearance
  in one season: format, `chosenBy`, descriptions, thumbnail, duration. Gains a
  **`titleId`** pointing at its `title`. Results attach here.
- **results** (unchanged) — stay in Supabase, keyed to the instance.

So: `title` (identity + genres) ← `game` instance (`titleId`, format, season) ←
results.

### Why this is safe

- **No DB schema change.** Results already key to the per-season game instance.
- Pure **static-data refactor** in `src/data`: add a `titles` registry, add
  `titleId` to each instance, join the title (and its genres) in `compose.ts` where
  static content already meets DB results.
- Keep "game" meaning the thing a player actually played in a season (what results
  attach to); do NOT rename the instance to "title" — that would silently change the
  meaning of every `game` reference in the results layer.

## Genre tags

- **Multi-tag** (a game can be e.g. ["party", "minigame"]) and **human-entered** —
  genre is fuzzy judgment (Pummel Party = party or minigame? PUBG = shooter or
  battle-royale?), not auto-generatable.
- **Data-entry flow:** genre tagging becomes part of adding a game in the admin
  panel (Phase 5 results-entry work). Jakob **seeds the existing S1–S4 games
  manually** in the interim.
- **Taxonomy vocabulary is deferred to build-time.** The quality of genre-comparison
  stats depends entirely on a coherent tag vocabulary; defining it is a small
  content-design task to do when `/vs` genre comparison is actually built, not now.

## What this unlocks (downstream)

- Career pages: **best genre / worst genre** per player.
- `/vs`: **genre comparison** between two players (see
  `records-vs-hall-directions.md`).
- `/records`: cross-season "best at [genre]" superlatives.
- Correctly treating CS:GO and CS2 as one game for all-time stats.
