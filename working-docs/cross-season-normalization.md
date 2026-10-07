# Cross-Season Normalization — DECIDED

> **TEMPORARY working doc.** Delete when `/records` and `/vs` are built and this
> decision is reflected in code + the derivation layer. Not a permanent doc.

Unblocks `/records` and `/vs/[a]/[b]`. Raw points aren't comparable across seasons
(ladders differ: S1 4/3/2/1, S2 7/4/2/1, S3–S4 8/5/3/1; power-ups add per-season
noise), so all cross-season comparison normalizes off **placement** — the one axis
constant every season (always 1–4).

## Decisions (locked)

1. **Axis: placement, not points.** Points measure ladder inflation, not skill.
   Placement (1st–4th) is the only season-invariant.

2. **Scale: 4/3/2/1.** 1st = 4 … 4th = 1. Participation always scores — zeroing out
   last place (3/2/1/0) cuts against the monument/belonging theme and makes a player
   who always came last indistinguishable from one who never played. Winning gets its
   emphasis from a separate **championships count** (number of 1st-place finishes),
   not a steeper scale.

3. **Two distinct normalizations, different purposes:**
   - **Season placement** → career leaderboard (lives on `/records`; see
     `records-vs-hall-directions.md`). "Who is the Gamernes Gamer across all time."
   - **Per-game placement** → `/records` superlatives and `/vs`. "Best at racing
     games," "most game 1st-places," genre comparisons.

4. **Career metric: SUM of season placement-points.** Additive, so the career total
   grows each season (fits the monument framing). Valid *because* every player has
   currently played every season (equal participation).
   - **Guardrail (YAGNI, do not build now):** if participation ever becomes unequal
     (someone joins late / skips a season), a pure sum penalizes latecomers. The
     pre-agreed fallback is to add a per-season **average** placement-points metric
     alongside (or ahead of) the sum. Add it to the places that use totals *at that
     point*, not before.

5. **Per-game scale anchors to the TOP (1st = 4) regardless of field size.** Not
   every game had 4 players (field sizes vary; games change every season). Anchoring
   the top means winning a 3-player game is worth the same as winning a 4-player one —
   a win is a win. (The alternative, scaling to field size, makes small-field wins
   worth less, which is unintuitive.)

## Implementation notes (for build-time)

- **No schema change.** Results already key to the per-season game instance; this is
  pure derivation over existing data.
- **One real dependency:** a **multi-season fetch**. `fetch.ts` is single-season
  today — `/records` and `/vs` need to read across seasons.
- Keep the derivation **pure, alongside the existing `derive/` layer, unit-tested**
  (follow the existing Vitest oracle pattern).

## Superseded

Earlier Options B (normalized 0–1 points share) and C (average finish as the primary
number) are not the primary career metric. B is dropped (margin is better served by
per-game superlatives). C's "average" survives only as the unequal-participation
fallback in decision 4.
