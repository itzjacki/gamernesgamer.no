# Game formats

**Secondary reference — the Supabase DB is the source of truth.** How each
game's results are structured. Schema: `supabase/migrations/`.
Points/placements: `game-placements.md`. Season points (per-season ladder +
power-ups) are a separate layer, not part of a game's format.

## Taxonomy

Top-level types:

- **score** — one number per player.
- **rounds** — N sub-events; axes: raw score × aggregation.
- **h2h** — matches; axes: structure × series × match result.
- **placement** — final positions only, no sub-data.

Score and placement games are stored as a single rounds stage with one round
(see the model).

**raw_score** is one number per player per round, always HIGHER = BETTER;
direction is not stored. It is a real score if the game recorded one
(Trombone song score, OSRS kills); for a placement-only round the player
inputs 4..1 (4 = best), mirroring the CSVs. What it means (a measured value,
a 4..1 placement or combined points) is the static Game's `roundScore`. A
score-low game stores placements instead (Hollow Knight).

**Aggregation** (rounds):

- `sum` — add raw_score across rounds (BattleBlock, Trackmania, OSRS).
  Placement-type rounds use sum.
- `rank-then-sum` — per round, rank by raw_score, award N..1 points, sum the
  points (Trombone group, Ratz Instagib). Used when raw scores aren't
  comparable across rounds.

**H2H axes:**

- structure — a stage pipeline; each stage's kind is one of the six below.
  Multi-stage games chain them, e.g. round-robin → single-elim (CS:GO), or
  round-robin → final-bronze (2XKO).
- series — bo1 | bo3 | bo5, per match.
- match result — win-loss | score (W/L derivable).

## Model

A **game** is an ordered pipeline of **stages**. H2H: game → stages →
matches → game rows. Non-H2H: game → stage → rounds → round results.

**stage** — `game_id`, `ordinal` (1-indexed; 1 played first), `kind`:

- `round-robin` — everyone plays everyone → standings table. Also covers a
  DUAL round-robin (every pair twice, S2 LoL) and a "swiss finish" (a few
  rematches to settle standings, S4 2XKO): repeated pairings carry
  `match.leg = 2`. There is no separate swiss or dual kind.
- `single-elim` — 4-player knockout → bracket template (SF1, SF2, F, BR).
- `final-bronze` — just a final and a bronze → template (F, BR).
- `double-elim-reset` — the grand final can be replayed → template (WB-SF1,
  WB-SF2, WB-F, LB-R1, LB-F, GF, GF2). One LB-R1 for 4 players (the schema
  comment's LB-R1-1/LB-R1-2 is wrong).
- `double-elim-no-reset` — single grand final (unused so far); the same
  template without GF2.
- `rounds` — non-H2H sub-events → standings via `aggregation` (`sum` |
  `rank-then-sum`; required for rounds stages, null otherwise).

**match** (one meeting of two players in an H2H stage) — `stage_id`,
`player_a`, `player_b` (`season_player.id`), `series_len`.

- `slot_id` — bracket position from the kind's fixed template; NULL for
  round-robin. Template wiring is static, so there is no `feeds_into` column.
- `leg` — meeting number of this pairing in the stage, 1-indexed. 2+ is a
  rematch (dual round-robin, swiss finish, or a bracket rematch such as a
  double-elim WB-F then GF between the same pair). The unique key is
  `(stage_id, player_a, player_b, leg)`, the only thing letting a pair meet
  twice in one stage.
- The outcome is DERIVED from the game rows, never stored.

**game row** (`match_game`, one contest inside a match; the only place an H2H
result is stored) — `match_id`, `game_number` (1..series_len), `score_a`,
`score_b`, `tiebreak_winner`.

- Win-loss games store the win as 1-0; score games store real numbers.
- A match winner is who won more game rows; stage standings tally wins.
  Derived.
- bo1 → 1 row; bo3 → 2–3 rows; bo5 → 3–5 rows (only games actually played).
- `tiebreak_winner` ('a' | 'b') is set iff `score_a = score_b`.

**round + round_result** (non-H2H; these stages have no matches) —
`round(stage_id, ordinal, label)`, `round_result(round_id, season_player_id,
raw_score)`: one number, higher = better, never null, negatives allowed. A
rank-then-sum tie shares the higher points (N − players strictly better).

Seeding between stages is NOT stored: which group finishers reach which
finals slot follows from the group standings and the finals matches naming
the players (e.g. Trombone top 2 → final, bottom 2 → bronze).

**Scope:** 4-player seasons, so one bracket template per kind. A different
roster size needs a size-specific template or a `feeds_into` column — a
non-destructive addition; stored matches and slots are unaffected.

## Inventory

Format names map to `stage.kind` as above. `[!]` flags a quirk worth
knowing; `[--]` flags internal match/round detail not captured (placements
still seeded).

### Sesong 1

| Game       | Format                                                                                   |
| ---------- | ---------------------------------------------------------------------------------------- |
| Sjakk      | h2h round-robin, bo1, win-loss                                                           |
| OSRS (LMS) | rounds sum (3 rounds): per-round finish + kills; sums 13/13/7/6, Jørgen won the tiebreak |
| CS:GO      | h2h round-robin → single-elim, bo1, score                                                |
| Skyrim     | score                                                                                    |
| Tetris     | score                                                                                    |
| Pokemon    | h2h round-robin → single-elim, bo1, win-loss                                             |
| Trackmania | rounds sum (5 tracks)                                                                    |
| Flat Out 2 | rounds sum (12 events)                                                                   |

### Sesong 2

| Game              | Format                                                                           |
| ----------------- | -------------------------------------------------------------------------------- |
| Hearthstone       | h2h round-robin → final-bronze, bo1, win-loss                                    |
| Curve Fever       | rounds sum (8 rounds)                                                            |
| The Sims 4        | score                                                                            |
| Warcraft 3        | placement: 4-way FFA last-man-standing                                           |
| Poker             | placement: Texas Hold'em cash game, bust-out order                               |
| Wreckfest         | rounds sum (10 tracks): placement + fastest-lap bonus combined per track (lossy) |
| Total War: Empire | h2h double-elim-reset, bo1, win-loss [!]                                         |
| League of Legends | h2h dual round-robin → final-bronze, bo3, win-loss                               |

[!] Total War: WB-F and GF are both Jakob–Tobias; WB-SF2 and LB-F both
Tobias–Jørgen, so the second meeting of each carries leg 2. The WB survivor
won the GF, so GF2 was unplayed (6 matches).

### Sesong 3

| Game                 | Format                                                                           |
| -------------------- | -------------------------------------------------------------------------------- |
| World of Warcraft    | score: gold @ 60 min                                                             |
| BattleBlock Theater  | rounds sum (11 levels): per-level combined points (sub-tables not stored, lossy) |
| Kerbal Space Program | score: techs unlocked @ 60 min                                                   |
| GeoGuessr            | score: number of 1st-place round finishes                                        |
| Jump King            | placement: highest point @ 60 min                                                |
| Planet Coaster       | score: visitor count @ 60 min                                                    |
| War Thunder          | h2h round-robin → double-elim-reset, bo1 group / bo3–bo5 late, win-loss [!]      |
| Hollow Knight        | rounds sum (1 round): score-low (fastest time), stored as placements             |
| Pummel Party         | score: cumulative minigame score                                                 |
| PUBG                 | placement: FFA last-man-standing                                                 |

[!] War Thunder: Jakob fell to the LB (lost WB-F to Tobias 2-1), then beat
Tobias in GF and GF2 (reset). They meet three times: WB-F leg 1, GF leg 2,
GF2 leg 3.

### Sesong 4

| Game              | Format                                                                                                               |
| ----------------- | -------------------------------------------------------------------------------------------------------------------- |
| League of Legends | rounds sum (3 matches): raw per-match score, 2v2 rotating teams; Jakob and Tobias tie on 12, Jakob wins the tiebreak |
| PEAK              | score: altitude                                                                                                      |
| Ratz Instagib     | rounds rank-then-sum (6 matches): raw kills ranked per match                                                         |
| Trombone Champ    | rounds rank-then-sum (8 songs) → final-bronze, bo3, score: top 2 to the final, bottom 2 to the bronze                |
| Counter-Strike 2  | placement: furthest on a KZ parkour map [--]                                                                         |
| Garry's Mod       | rounds sum (6 races)                                                                                                 |
| FC25              | h2h round-robin → single-elim, bo1, score (goals)                                                                    |
| 2XKO              | h2h round-robin with a swiss finish → final-bronze, bo3 group / bo5 late, win-loss [!]                               |

[!] 2XKO: a full round-robin, then one swiss-paired rematch (Jakob–William,
leg 2) in the SAME stage, until each player hit 3W or 3L.
