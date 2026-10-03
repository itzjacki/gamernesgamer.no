# GAME FORMATS

STATUS: as of 2026-10-02. RESOLVED MODEL section below is the decided DB data
model (also codified in .kiro/steering/structure.md "Data split" and TODO.md).
Per-game CSV-status lines verified against the raw CSVs. Companion: game-placements.md.
SQL implementation: supabase/schema.sql.

How each game's results are structured, for DB schema design.
Season points & placements (who won each game) live in game-placements.md.

Status key: [ok] data present [!] quirk/confirm [--] missing

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
sum the points (Trombone group stage).

h2h axes:
structure a stage pipeline; each stage's kind is one of the 6 in RESOLVED MODEL
(round-robin, swiss, single-elim, final-bronze, double-elim-reset,
double-elim-no-reset). Multi-stage games chain them, e.g. round-robin
-> single-elim, or round-robin -> swiss -> final-bronze (2XKO).
series bo1 | bo3 | bo5 (per stage)
match_result win-loss | score (W/L derivable)

NOTE: We ARE modeling internal formats in the DB (decided). game result ->
season points is a SEPARATE layer (per-season ladder + power-ups), not part of a
game's format; see game-placements.md. Schema stores season points per game
result, not derived from a shared table. The full model is in RESOLVED MODEL below.

## RESOLVED MODEL

Decided this session. Everything renders from three entities; no bracket
reconstruction, no overloaded fields. Field-by-field below so nothing relies on
remembering the discussion.

A GAME (e.g. "CS:GO", "2XKO") is played as an ordered PIPELINE OF STAGES. Each
stage is one phase of that game (a group phase, a swiss phase, a finals bracket).
A stage contains MATCHES (one meeting of two players). A match contains GAMES
(the individual contests inside a best-of series). So: game -> stages ->
matches -> games(rows).

Entity: stage (one phase of a game)
id PK.
game_id FK -> the game this stage belongs to.
order Position of this stage WITHIN its game's pipeline, 1-indexed.
order=1 is played first. This is what sequences the pipeline:
e.g. 2XKO has order=1 round-robin, order=2 swiss, order=3 finals.
NOT a display-sort or season-wide field - it is per-game stage order.
kind What this phase is, and therefore how it renders:
round-robin everyone plays everyone -> standings table
swiss swiss-paired phase -> standings table
single-elim 4-player knockout -> bracket template
final-bronze just a final + a bronze -> bracket template
double-elim-reset double-elim, grand final CAN be replayed
(losers-bracket winner must be beaten twice)
double-elim-no-reset double-elim, single grand final
(A "score-group" phase - a group ranked by a raw score rather than
by matches - also renders as a standings table; see note below.)

Entity: match (one meeting of two players, within a stage)
id PK.
stage_id FK -> parent stage.
slot_id Position of this match inside a bracket template. NULL for table
stages (round-robin/swiss/score-group have no bracket). For elim
stages it is a fixed label from that kind's template, e.g.
single-elim: SF1, SF2, F, BR ; double-elim: WB-SF1, WB-F, LB-F,
GF (+ GF2 for -reset). The template defines which slot feeds which,
so no feeds_into column is needed.
player_a FK -> player.
player_b FK -> player.
series_len bo1 | bo3 | bo5. How many games this match is at most.
(NO result column. The match's outcome is DERIVED from its game rows.)

Entity: game (one individual contest inside a match - the only place a result
is stored)
match_id FK -> parent match.
game_number Which game of the series, 1-indexed within the match (1..series_len).
score_a player_a's score in THIS game.
score_b player_b's score in THIS game.

RESULT / SCORING RULES

- Every result is a game row holding two integers (score_a, score_b). This is
  the single source of truth; nothing else stores a result.
- WIN-LOSS games (chess, FC25 knockouts by W/L, etc.) store the win as 1-0
  (loser 0). They render literally as "1-0", chess-site style. There is NO
  win-loss-vs-score flag: 1-0 always means "winner 1, loser 0", which is true
  whichever kind of game it was, so no disambiguation is needed.
- SCORE games store the real numbers (FC25 goals e.g. 6-1; Trombone song score).
- A MATCH's winner = who won more game rows. A STAGE's standings = tally match
  (or game) wins across the stage. Both are DERIVED at read time, never stored.
- series_len vs rows: bo1 => exactly 1 game row; bo3 => 2 or 3 rows; bo5 => 3
  to 5 rows (only the games actually played).

NON-H2H STAGES (rounds / score / placement) - the match/game entities above are
h2h-only; these stages have no matches. They store per-player values directly.

Entity: round (one sub-event within a rounds stage - a track, song, map, match)
id PK.
stage_id FK -> parent rounds stage.
order Which sub-event, 1-indexed within the stage (track 1, song 2, ...).

Entity: round_result (one row per player per round)
round_id FK -> parent round.
player FK -> player.
raw_score One number, HIGHER = BETTER. A real score if the game recorded one
(Trombone song score, OSRS kills); for a placement-only round the
player inputs 4..1 (4 = best), mirroring the CSVs. Never null.

stage.aggregation decides how raw_score becomes standings:
sum add raw_score across the stage's rounds. Placement-type rounds
(Trackmania, Curve Fever, Garry's Mod) use sum - their raw_score
already IS the 4..1 points. Also BattleBlock, OSRS.
rank-then-sum per round, rank players by raw_score, award N..1 points
(N = players, highest raw_score gets N), sum the points.
Used when raw scores are not directly comparable across rounds
(Trombone group: song scores differ wildly per song).

SCORE / PLACEMENT top-level games (no rounds, no matches): a single stage holding
one round_result per player (one round, order=1). score games store raw_score
with higher = better always (direction high/low is display-only, noted on the
game in static TS — never stored; a score-low game is modeled as a rounds (sum)
game with placements as raw_score);
placement games store the final 4..1.

RENDERING (driven by stage.kind, not by any free-text label)
SEEDING between stages is NOT stored. Which group finishers advance to which
finals slot is derived at read time from the group standings + the finals
matches naming the players, obvious when stages are viewed in `order`.
(Trombone: group standings -> top 2 to the final, bottom 2 to bronze.)

- round-robin / swiss / score-group -> STANDINGS TABLE (derive W/L or points,
  sort). 2XKO's round-robin (order=1) and swiss (order=2) share one carried
  W/L record; render them as one combined table or two, reader's choice.
- single-elim / final-bronze / double-elim-\* -> BRACKET drawn from a FIXED
  4-PLAYER TEMPLATE per kind. Each match's slot_id places it into the template;
  the template's wiring (who advances to where) is static, so the match list +
  slot_id is enough - no feeds_into / seeding columns.

SEPARATE LAYER (not part of this model): a game's final result -> SEASON POINTS
(per-season ladder + power-up adjustments). Points are DERIVED at read time:
season_ladder[game_result.placement] + SUM(power_up_use.points_delta). The ladder
is season-wide (identical across all games). Decoded values live in game-placements.md.

SCOPE: 4-player seasons only (Kristin nearly joined S3 but did not play), so one
bracket template per kind, no player-count variants. If a future season changes
size, add a size-specific template or a feeds_into column then - a non-destructive
addition, because the stored matches/slots are unaffected.

WORKED EXAMPLE - 2XKO (a game, read top to bottom):
stage(order=1, kind=round-robin) -> matches with slot_id=NULL; standings table
stage(order=2, kind=swiss) -> matches slot_id=NULL; continues same record
stage(order=3, kind=final-bronze) -> match slot_id=F (final), match slot_id=BR
(bronze); drawn from the final-bronze template
Each match holds its game rows (bo3 group/swiss, bo5 late); win-loss stored 1-0;
who won each match and the standings are computed from those rows.

## INVENTORY (per game)

How the shorthand below maps to the model's stage.kind:
"single-round-robin" -> kind=round-robin
"single-elim" -> kind=single-elim
"bronze-final-and-final" -> kind=final-bronze
"double-elim-reset" / "double-elim-no-reset" -> that exact kind (named on the
game line). -no-reset is unused so far, kept for
expected future seasons.
"swiss" -> kind=swiss
"rounds"/"score"/"placement" top-level types are the per-game-row shapes, not
bracket stages; see TAXONOMY.

## SESONG 1

Sjakk h2h single-round-robin, bo1, win-loss
[ok] single-round-robin matrix

OSRS (LMS) rounds sum (3 rounds)
[ok] per-round finish+kills, sums 13/13/7/6, Jørgen won tiebreak

CS:GO h2h single-round-robin -> single-elim, bo1, score
[ok] William + Tobias won semis, Jakob won bronze, William won finals

Skyrim score high
[ok]

Tetris score high
[ok]

Pokemon h2h single-round-robin -> single-elim, bo1, win-loss
[ok]

Trackmania rounds sum (5 tracks)
[ok]

Flat Out 2 rounds sum (12 events)
[ok]

## SESONG 2

Hearthstone h2h single-round-robin -> bronze-final-and-final, bo1, win-loss
[ok]

Curve Fever rounds sum (8 rounds)
[ok]

The Sims 4 score high
[ok]

Warcraft 3 placement
[--]

Poker placement
[--]

Wreckfest rounds sum (10 tracks)
[--] placement + point for fastest lap - resolved: store as raw_score, sum

Total War: Empire h2h double-elim-reset, bo1, win-loss
[ok]

League of Legends h2h single-round-robin -> single-elim, bo3, win-loss
[ok]

## SESONG 3

World of Warcraft score high
[--]

BattleBlock Theater rounds sum
[--] per-player CSVs J/Jø/T/W (W=recount)

Kerbal Space Program score high
[--] tiebreak: science remaining

GeoGuessr score high
[--] # of 1st-place finishes

Jump King placement
[--] highest point after 60 min

Planet Coaster score high
[--] visitor count @ 60 min

War Thunder h2h single-round-robin -> double-elim-reset, bo1 group / bo3/bo5 late, win-loss
[ok]

Hollow Knight rounds sum (1 round)
[--] fastest completion (originally score low; modeled as a 1-round sum game
     storing placements as raw_score — DB has no score direction, see TAXONOMY)

Pummel Party score high
[--] cumulative minigame

PUBG placement
[--]

## SESONG 4

League of Legends rounds sum (3 matches)
[ok] raw per-match score summed directly; 2v2 alternating teams. Jakob/Tobias tie 12, Jakob wins tiebreaker

PEAK score high
[ok] J 569 / T 387 / Jø 448 / W 315 (Andre spill CSV)

Ratz Instagib rounds rank-then-sum (6 matches)
[ok] raw kills -> per-match placement

Trombone Champ rounds rank-then-sum (8 songs) -> h2h, bronze-final-and-final, bo3, score (song score)
[ok]

Counter-Strike 2 placement
[--] furthest progress on parkour map

Garry's Mod rounds sum (6 races)
[ok]

FC25 h2h single-round-robin -> single-elim, bo1, score (goals)
[ok]

2XKO h2h single-round-robin -> swiss (continues same W/L record to 3W or 3L) -> bronze-final-and-final, bo3 group/swiss / bo5 late, win-loss
[ok] full round-robin first, THEN swiss-paired on carried record until each player has 3W or 3L
