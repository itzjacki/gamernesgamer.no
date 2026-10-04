# Cross-Season Normalization — options for a decision

STATUS: analysis for Jakob to decide. Blocks `/records` and `/vs/[a]/[b]`
(all-time stats). Nothing built yet. Grounded in the seeded S1+S2 data.

## The problem

Raw season points are NOT comparable across seasons — the base ladder differs:

| Season | 1st | 2nd | 3rd | 4th |
| ------ | --- | --- | --- | --- |
| S1     | 4   | 3   | 2   | 1   |
| S2     | 7   | 4   | 2   | 1   |
| S3/S4  | 8   | 5   | 3   | 1   |

Plus power-ups push totals off-ladder (S2+). So "most career points" rewards
whoever played the most high-ladder seasons, not who performed best. Real data:

| Season | Champion total | S1 vs S2       |
| ------ | -------------- | -------------- |
| S1     | Tobias 24      | A 2nd-place S2 |
| S2     | Tobias 39      | (32) beats an  |
|        |                | S1 win (24).   |

A 3rd place in S2 (Jakob, 32) outscores the S1 champion (Tobias, 24). Summing
raw points across seasons is meaningless.

## What IS comparable: placement

Every season is 4 players, finishing 1–4. Placement is the one axis that means
the same thing in every season. All viable options normalize off placement.

## Options

### A. Placement points (fixed scale)

Map finishing place to a fixed scale, identical every season, e.g. 1st=4 … 4th=1
(or 3/2/1/0). Career score = sum of placement points. Game-level version: per
game, map game placement the same way.

- **+** Dead simple, intuitive, stable as rosters/ladders change.
- **+** Works today with zero new data (placement already stored, gapless).
- **−** Ignores margin (a dominant win == a squeaker).
- **−** Fixed-size assumption (fine now: all seasons 4p; revisit if size changes).

### B. Normalized points share (0–1 per season)

Per season, divide each player's total by the season's total (or by the max).
Career = sum or mean of shares.

- **+** Keeps margin/dominance signal.
- **−** Power-ups distort the base (a Gamba Time swing changes shares).
- **−** Harder to explain on a stat card ("0.27 career share").

### C. Average finish

Career = mean placement (lower = better). Tie-break by count of seasons/wins.

- **+** The most honest "how good are they" single number; roster-size robust.
- **−** Not additive (can't rank a leaderboard by a growing sum); hides volume
  (one great season looks like a steady one).

## Recommendation

**Primary: A (fixed placement scale), with C (average finish) as a secondary
display stat.** A gives an additive, explainable career leaderboard that is
correct across ladders and needs no new data; C adds the "how consistently good"
read on player pages without pretending to be a running total. Defer B — its
only advantage (margin) is better served later by per-game superlatives
("most dominant win") than by a blended career number.

Open sub-decisions for Jakob:

1. Placement scale: **4/3/2/1** or **3/2/1/0**? (0-based makes 4th place
   contribute nothing; 1-based always rewards showing up.)
2. Normalize at **season** placement only, or **also per-game** placement
   (enables "best average game finish", H2H-adjacent stats)?
3. Does **season placement** or **game placement** anchor /records? (Likely
   both: season for the lineage, game for superlatives.)

## Worked example (seeded S1+S2, scale 4/3/2/1)

Season placements → career placement points:

| Player  | S1 place | S2 place | Career (A) | Avg finish (C) |
| ------- | -------- | -------- | ---------- | -------------- |
| Tobias  | 1 (→4)   | 1 (→4)   | **8**      | 1.0            |
| Jørgen  | 2 (→3)   | 2 (→3)   | 6          | 2.0            |
| Jakob   | 3 (→2)   | 3 (→2)   | 4          | 3.0            |
| William | 4 (→1)   | 4 (→1)   | 2          | 4.0            |

Contrast raw career points, which rank the same here only by coincidence but
distort the gaps: Tobias 63, Jørgen 52, Jakob 52, William 46 — S2's bigger
ladder inflates everyone and compresses the standings. Option A keeps the gaps
even and ladder-independent.

(Both seasons had identical finishing orders, so career order is unsurprising;
the point is the SCALE: A's gaps are even and ladder-independent, raw points'
are not.)

## Implementation note (when it lands)

Pure, lives alongside derivation (e.g. `src/lib/results/derive/career.ts`),
unit-tested against this doc's table. Needs a multi-season fetch (fetch.ts is
single-season today — add a `fetchAllSeasons` or compose N bundles). No schema
change: placement is already stored and gapless. Not started — UI (`/records`,
`/vs`) is out of scope until seeding is done.
