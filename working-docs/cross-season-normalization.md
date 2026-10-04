# Cross-Season Normalization — open decision

Blocks `/records` and `/vs/[a]/[b]`. Raw points aren't comparable across seasons
(ladders differ: S1 4/3/2/1, S2 7/4/2/1, S3–S4 8/5/3/1; power-ups add noise), so
normalize off **placement** — the one axis constant every season (always 1–4).

**Options:** (A) fixed placement scale, career = sum — simple, additive, ladder-
independent, no new data, ignores margin. (B) normalized points share 0–1 — keeps
margin but power-ups distort it and it reads poorly. (C) average finish — honest
"how good" number but not additive.

**Recommendation:** A as the primary career leaderboard + C as a secondary
consistency stat on player pages. Defer B (margin is better served by per-game
superlatives).

**Awaiting Jakob:**

1. Scale **4/3/2/1** or **3/2/1/0**?
2. Normalize season placement only, or also per-game?
3. Season or game placement anchors /records? (Likely both.)

Implementation when it lands: pure, alongside derivation, unit-tested; needs a
multi-season fetch (`fetch.ts` is single-season today). No schema change.
