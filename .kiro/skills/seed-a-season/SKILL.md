---
name: seed-a-season
description: Seed a Gamernes Gamer tournament season's historical results into Supabase. Use when the user says a season's data (CSVs) is ready, asks to seed/backfill a season into the database, or wants to append a season to supabase/seed.sql. Covers verifying the CSVs against the working docs, writing the seed SQL against the stage/match/round schema, and reconciling the result locally.
---

# Seed a Season

Backfill one tournament season's historical results into `supabase/seed.sql`, verified against the local Supabase stack. One season at a time.

The job has three phases: **verify**, **write**, **reconcile**. Do not write SQL before the verify phase reconciles cleanly — the whole point is to catch contradictions before they become bad data.

## Inputs and sources of truth

Three sources must agree before anything is seeded. When they disagree, stop and ask the user — do not guess:

1. **The CSVs** — `.temp/spreadsheets/season <N>/*.csv`. The raw per-game sheets plus an "Overall poeng" sheet. This is the ground truth for the numbers.
2. **`working-docs/game-formats.md`** — how each game is structured (stage pipeline, rounds vs H2H, aggregation). Per-game status keys: `[ok]` present, `[!]` quirk, `[--]` internal detail missing.
3. **`working-docs/game-placements.md`** — verified final points and placements per player per game, already fact-checked. Column order is **Jakob / Jørgen / Tobias / William** — the per-game CSV matrices use the same order, but confirm it each time rather than assuming.

Also read, every time:

- `supabase/migrations/*` — the live schema. Column names, enums, and constraints must match exactly. Do not trust memory; the schema evolves (e.g. `round.label` and `game_result.note` were added during the S1 run).
- `src/data/sesong/<NN>/games.ts` — the game **slugs** (must match `game.slug`) and the display order (used as `game.ordinal`, i.e. play order, unless the user says otherwise).
- `src/data/sesong/<NN>/power-ups.ts` — power-up slugs and mechanics, if the season has them.

## Phase 1 — Verify

For every game in the season, reconcile the three sources before writing any SQL:

- Derive each game's final placement from the CSV (sum rounds, or tally H2H match wins, or read the raw score) and confirm it matches `game-placements.md`.
- Confirm the season points in `game-placements.md` equal `base_ladder[placement]` plus any power-up deltas. Base ladders: **S1 4/3/2/1, S2 7/4/2/1, S3/S4 8/5/3/1** (1st/2nd/3rd/4th). Re-derive the season totals and check them against the Overall sheet.
- Confirm each game's format in `game-formats.md` is `[ok]`. A `[--]` game is missing the internal match/round detail — you can still seed its `game_result` placements and derived points, but flag to the user that the stage/match/round breakdown can't be populated yet.

Report every contradiction, quirk, or missing piece to the user and resolve it together. Expect surprises when testing against production data for the first time — this is normal and the user expects it.

**When a game's data does not map cleanly onto the schema, always stop and ask the user how to model it. Never assume a modelling decision carries over, even from a game that looked identical in a past season.** A choice that was right once (how to flatten sub-scores, how to label rounds, which tier a tiebreak belongs to) can be wrong for the next game, and silently reusing it buries a decision the user wanted to make. The cases below are **precedent to inform the question you ask** — "last time we did X here, same again?" — not defaults to apply on your own.

- **Multiple sub-scores per round** that have to collapse into one `round_result.raw_score` (S1 OSRS: placement-points + kills-points summed). This is lossy — the split is unrecoverable — so confirm both *that* flattening is acceptable and *how* to combine them.
- **Non-contiguous or named rounds** (S1 Trackmania "Track 1/2/7/9/12"; Flat Out event names). The precedent is sequential `round.ordinal` + the real name in `round.label`, but confirm the labels and ordering with the user.
- **Two different tiebreaks** that are easy to conflate: a *game-level* tie (→ `game_result.note`) and the *season-level* tie (→ `season_result.note`). Both existed in S1 (OSRS 13–13; season 20–20 Gen 6 Showdown match). Confirm which tier each tie belongs to and what the note should say.
- **Stray notes** landing in the wrong sheet because of how sequential CSV cells read. Attribute a note by its meaning, not the sheet it appears in — and confirm the attribution if there's any doubt.

This confirm-first rule governs any new, unanticipated case too, not just the four above.

## Phase 2 — Write

Append the season to `supabase/seed.sql` (never a migration — this is data, kept out of migrations so prod never re-runs it). Each season is a self-contained `do $$ ... $$` block.

Model the data onto the schema:

- `season` (status `complete`, with `started_at`/`ended_at` if known), `season_player` (one per roster player, FK to the shared `player` rows), `season_ladder` (one row per placement).
- `game` per game: `slug` from `games.ts`, `ordinal` = play order, `status = 'complete'`.
- **H2H games** → `stage` (kind `round-robin`/`single-elim`/`final-bronze`/`double-elim-*`) → `match` → `match_game`. Win-loss games store the win as `1-0`; score games store the real numbers. Standings and match winners are DERIVED at read time — never store them. A DUAL round-robin (every pair twice, e.g. S2 LoL) or a round-robin with a "swiss finish" (a few extra rematches, e.g. S4 2XKO) is still ONE `round-robin` stage — the replayed pairings carry `match.leg = 2`. There is no `swiss` kind.
- **Non-H2H games** → `stage` (kind `rounds`, with `aggregation` `sum` or `rank-then-sum`) → `round` → `round_result`. `raw_score` is always higher-is-better; a score-low or placement-only round stores placements (N..1, N=best) as the raw_score. Score/placement top-level games are a single `rounds` stage with one round.
- `game_result` — final placement per player, `confirmed = true` for historical data. Add `note` for a game-level tiebreak story.
- `season_result` — final placement per player, `confirmed = true`. Add `note` for the season-level tiebreak story.

**The `match.player_a < match.player_b` (by UUID) constraint** is the main trap. `season_player` ids are random UUIDs, so you cannot know the ordering when writing calls by hand. Use the `pg_temp.seed_h2h_match()` helper defined at the top of `seed.sql`: pass the two `season_player` ids in natural (e.g. winner, loser) order plus their score arrays, and it normalises the a/b ordering and flips the stored scores to match. It also refuses to insert a drawn game without an explicit `tiebreak_winner`, which guards the `tiebreak_iff_draw` constraint. Reuse it; do not hand-write `insert into match`. For a dual round-robin or a swiss-finish rematch, pass the pairing's leg (default 1; use 2 for the second meeting) — the unique key is `(stage_id, player_a, player_b, leg)`. (The S1 seed predates the `leg` column; extend the helper with a `leg` parameter when seeding the first season that needs it.)

Never hardcode UUIDs. Resolve ids via `returning ... into` locals (season, season_players, game, stage, round) exactly as the S1 block does. Keep the seed idempotent: the file deletes the seasons and shared players it owns at the top before re-inserting, so `db reset` can run repeatedly.

The approved copy exception: tiebreak `note` fields are factual archive data, and the user has agreed the agent may write them (normally all site copy is human-written). Keep them factual and in Norwegian. They may never surface on the site; the point is to have them in the data.

## Phase 3 — Reconcile (verify locally)

Apply and check against the **local** stack. The MCP Supabase tools talk to the **remote** project, which is intentionally left empty until the whole multi-season run is done — so verify locally, not via MCP, and never push to prod mid-run.

```
supabase db reset        # replays all migrations + seed.sql from scratch
```

There is no local `psql` on PATH; query through the db container (name from `docker ps`, e.g. `supabase_db_gamernesgamer.no`):

```
docker exec <db_container> psql -U postgres -d postgres -A -F "|" -c "<query>"
```

Run reconciliation queries and confirm every one matches the working docs before declaring the season done:

- Per-player **season totals** from derived points (`sum(season_ladder[placement])` grouped by player) == the Overall sheet.
- Per-game **points matrix** == `game-placements.md` row-for-row.
- **Round sums** (`sum(raw_score)` per player per rounds game) == the CSV totals.
- **H2H group standings** (match wins derived from `match_game`) == the CSV group tables.
- **Invariants** (all must be clean): `game_result`/`season_result` placements are gapless `{1..N}`; `rounds` stages have no matches and non-rounds stages have no rounds; every `match` satisfies `player_a < player_b`; `season_ladder` has exactly N rows; no stray `tiebreak_winner`.

After the schema is touched (only if a verify-phase surprise forced an additive migration): regenerate the snapshot with `supabase db dump --local -f supabase/schema.sql` and re-add its `DO NOT EDIT` header. Then run `npm run build` to confirm nothing broke.

## Scope discipline

- One season per run. Do not seed ahead of the user's "it's ready."
- Schema changes are a last resort and must be **additive** nullable columns (so no backfill, no risk to existing seeded data), authored as a hand-edited migration file created via `supabase migration new <name>` and applied with `db reset` then — only during the eventual prod push — `supabase db push`. Never apply schema via MCP `apply_migration` (it caused version drift before).
- Do not build UI, read-layer code, or derivation logic as part of seeding. Seeding ends when the data reconciles locally.
