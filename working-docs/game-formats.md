# GAME FORMATS

**Secondary reference — the Supabase DB is the source of truth.** This documents
how each game's results are structured, for the DB model. All S1–S4 results are
seeded in `supabase/seed.sql` and live in the database. Schema: `supabase/migrations/`
(snapshot: `supabase/schema.sql`). Points/placements: `game-placements.md`.
Raw CSVs: `working-docs/result-spreadsheets/`.

## TAXONOMY

Top-level type:
score one number per player. direction high|low is DISPLAY-ONLY (noted in the
static TS game data), NOT stored in the DB — round_result.raw_score is always
higher = better. A score-low game is modeled as a rounds (sum) game instead,
with placements as raw_score (see Hollow Knight).
rounds N sub-events. axes: raw_score x aggregation
h2h matches. structure + series + match_result
placement final positions only, no sub-data

rounds axes:
raw_score one number per player per round, HIGHER = BETTER (all our
games). A real score if the game recorded one (Trombone song
score, OSRS kills); for a placement-only round the player
inputs 4..1 (4 = best), mirroring the CSVs.
aggregation sum add raw_score across rounds (BattleBlock,
Trackmania, OSRS). Placement-type rounds use sum.
rank-then-sum per round rank by raw_score, award N..1 points,
sum the points (Trombone group, Ratz Instagib).

h2h axes:
structure a stage pipeline; each stage's kind is one of the 6 in MODEL below.
Multi-stage games chain them, e.g. round-robin -> single-elim (CS:GO),
or round-robin -> final-bronze (2XKO). A DUAL round-robin (every pair
twice, S2 LoL) and a round-robin with a "swiss finish" (a few rematches
to settle standings, S4 2XKO) are BOTH a single round-robin stage whose
repeated pairings carry match.leg = 2. No separate "swiss" or "dual" kind.
series bo1 | bo3 | bo5 (per match)
match_result win-loss | score (W/L derivable)

Season points are a SEPARATE layer (per-season ladder + power-ups), not part of
a game's format — see game-placements.md.

## MODEL

A GAME is an ordered PIPELINE OF STAGES. A stage contains MATCHES (H2H) or
ROUNDS (non-H2H). An H2H match contains per-game rows. So H2H: game -> stages ->
matches -> game rows; non-H2H: game -> stage -> rounds -> round_results.

stage (one phase of a game)
  game_id, ordinal (1-indexed position in the game's pipeline; 1 played first).
  kind:
    round-robin           everyone plays everyone -> standings table. Covers DUAL
                          round-robin and a "swiss finish" too (repeated pairings
                          carry match.leg; no separate kind).
    single-elim           4-player knockout -> bracket template (SF1, SF2, F, BR)
    final-bronze          just a final + a bronze -> bracket template (F, BR)
    double-elim-reset     double-elim, grand final can be replayed (GF2)
    double-elim-no-reset  double-elim, single grand final (unused so far)
    rounds                non-H2H sub-events -> standings via aggregation
  aggregation: sum | rank-then-sum. Required for rounds stages, null otherwise.

match (one meeting of two players, within an H2H stage)
  stage_id, player_a, player_b (season_player.id), series_len (bo1|bo3|bo5).
  slot_id   bracket position from the kind's fixed template; NULL for round-robin.
            Template wiring is static, so no feeds_into column.
  leg       meeting number of this pairing in the stage, 1-indexed. 1 = first/only;
            2+ = a rematch (dual round-robin, swiss finish, OR a bracket rematch —
            e.g. a double-elim WB-F then GF between the same pair). unique key is
            (stage_id, player_a, player_b, leg) — the only thing letting a pair
            appear twice in one stage. Outcome DERIVED from game rows, never stored.

game row (one contest inside a match — the only place an H2H result is stored)
  match_id, game_number (1..series_len), score_a, score_b, tiebreak_winner.
  - Win-loss games store the win as 1-0; score games store real numbers.
  - A match winner = who won more game rows; stage standings tally wins. Derived.
  - bo1 => 1 row; bo3 => 2-3 rows; bo5 => 3-5 rows (only games actually played).
  - tiebreak_winner ('a'|'b') set iff score_a = score_b.

round + round_result (non-H2H; these stages have no matches)
  round(stage_id, ordinal, label). round_result(round_id, season_player_id,
  raw_score) — one number, HIGHER = BETTER, never null, negatives allowed.
  aggregation decides standings:
    sum           add raw_score across rounds. Placement-type rounds store 4..1
                  and sum (Trackmania, Curve Fever, Garry's Mod, Warcraft FFA).
    rank-then-sum per round rank by raw_score, award N..1, sum the points. Used
                  when raw scores aren't comparable across rounds (Trombone song
                  scores, Ratz kills).

SCORE / PLACEMENT top-level games = a single rounds stage, one round per player.
score stores the real number (higher=better; a score-low game stores placements
instead — DB has no direction). placement stores the final 4..1.

Seeding between stages is NOT stored — which group finishers reach which finals
slot is derived from group standings + the finals matches naming the players
(obvious when stages are read in order; e.g. Trombone top 2 -> final, bottom 2 ->
bronze).

SCOPE: 4-player seasons, so one bracket template per kind. A different roster size
later needs a size-specific template or a feeds_into column — a non-destructive
addition; stored matches/slots are unaffected.

## INVENTORY (per game)

Format shorthand -> stage.kind: single-round-robin & dual-round-robin ->
round-robin (dual plays every pair at leg 1 and 2); single-elim; bronze-final-
and-final -> final-bronze; double-elim-reset / -no-reset as named. "swiss finish"
is NOT a kind — a round-robin stage with extra-leg rematches (match.leg=2 for some
pairs, see 2XKO). rounds/score/placement are per-game-row shapes (see TAXONOMY).
Below, [!] flags a quirk worth knowing; [--] flags internal match/round detail
not captured (placements still seeded).

## SESONG 1

Sjakk            h2h single-round-robin, bo1, win-loss
OSRS (LMS)       rounds sum (3 rounds) — per-round finish+kills, sums 13/13/7/6, Jørgen won tiebreak
CS:GO            h2h single-round-robin -> single-elim, bo1, score
Skyrim           score high
Tetris           score high
Pokemon          h2h single-round-robin -> single-elim, bo1, win-loss
Trackmania       rounds sum (5 tracks)
Flat Out 2       rounds sum (12 events)

## SESONG 2

Hearthstone      h2h single-round-robin -> final-bronze, bo1, win-loss
Curve Fever      rounds sum (8 rounds)
The Sims 4       score high
Warcraft 3       placement — 4-way FFA last-man-standing; placement as raw_score
Poker            placement — Texas Hold'em cash game, bust-out order
Wreckfest        rounds sum (10 tracks) — placement + fastest-lap bonus combined per track (lossy)
Total War: Empire  h2h double-elim-reset, bo1, win-loss
  [!] WB-F & GF both Jakob-Tobias; WB-SF2 & LB-F both Tobias-Jørgen -> second
      meeting of each carries leg=2. WB survivor won GF, so GF2 unplayed (6 matches).
League of Legends  h2h dual-round-robin -> final-bronze, bo3, win-loss

## SESONG 3

World of Warcraft  score high — gold @ 60 min
BattleBlock Theater  rounds sum (11 levels) — per-level COMBINED points as raw_score (sub-tables not stored, lossy)
Kerbal Space Program  score high — techs unlocked @ 60 min
GeoGuessr        score high — # of 1st-place round finishes as raw_score
Jump King        placement — highest point @ 60 min
Planet Coaster   score high — visitor count @ 60 min
War Thunder      h2h single-round-robin -> double-elim-reset, bo1 group / bo3/bo5 late, win-loss
  [!] Jakob fell to LB (lost WB-F to Tobias 2-1), then beat Tobias in GF AND GF2
      (reset). Jakob-Tobias meet 3× -> WB-F leg 1, GF leg 2, GF2 leg 3.
Hollow Knight    rounds sum (1 round) — score-low (fastest time) modeled as placements as raw_score
Pummel Party     score high — cumulative minigame score
PUBG             placement — FFA last-man-standing

## SESONG 4

League of Legends  rounds sum (3 matches) — raw per-match score; 2v2 rotating teams. Jakob/Tobias tie 12, Jakob wins placement tiebreak
PEAK             score high — altitude
Ratz Instagib    rounds rank-then-sum (6 matches) — raw kills ranked per match
Trombone Champ   rounds rank-then-sum (8 songs) -> final-bronze, bo3, score — real song scores; top 2 to final, bottom 2 to bronze
Counter-Strike 2 placement — furthest on KZ parkour map
  [--] no per-attempt internal detail; final placement only
Garry's Mod      rounds sum (6 races)
FC25             h2h single-round-robin -> single-elim, bo1, score (goals)
2XKO             h2h round-robin (swiss-finish via match.leg) -> final-bronze, bo3 group / bo5 late, win-loss
  [!] full round-robin, then one swiss-paired rematch (Jakob-William, leg=2) in
      the SAME round-robin stage until each player hit 3W or 3L. No swiss kind.
