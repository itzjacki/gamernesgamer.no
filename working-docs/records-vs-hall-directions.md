# /records, /vs, and the Hall — Directions

> **TEMPORARY working doc.** Delete when `/records` and `/vs` are built. Not a
> permanent doc. Captures DIRECTIONS + seed ideas, not final specs — concrete
> page design is deliberately deferred to when each page is actually built, and
> the relational `/vs` stats below need a product-owner refinement pass first.

Depends on `cross-season-normalization.md` (DECIDED) and benefits from
`game-title-abstraction.md` (genre tags) for the genre-based stats.

## The Hall — DROPPED (absorbed into /records + front page)

The Hall was conceived before `/records` and player pages were fully scoped. In a
world that already has **front page + per-player pages + /records**, it has no
distinct job left and would duplicate them:

- "Celebrate the all-time champion" → the **front page** already does (champion
  hero); it can carry an all-time banner.
- "All-time superlatives / who's the greatest" → that **is `/records`**.
- "A player's career story" → that's the **player page**.

**Decision:** no standalone `/hall` page. Its one unique element — the persistent
all-time career leaderboard — becomes the **headline board at the top of
`/records`**. (This changes the previous plan, which had The Hall as `/`. The front
page stays "latest champion + hook"; it is NOT the career board.)

## /records — the superlative wall

Direction: **a grid of distinct "best at X" cards, each naming a player and a
number** — the screenshot-into-the-group-chat page — topped by the all-time career
leaderboard. NOT one big table.

Seed candidate records (all derivable from placement + existing data, no new
storage):

- **All-time career leaderboard** (headline): sum of 4/3/2/1 season placement-points.
- Most **championships** (season 1st-places).
- **Best average finish** (consistency crown; min-seasons bar, e.g. ≥2).
- Most **game 1st-places** all-time.
- **Best at a single game** (most wins at [game], via the Title layer so CS:GO+CS2
  count together).
- **Biggest season-over-season climb.**
- Later, once genre tags exist: **best at [genre]** (best at racing, etc.).

Deferred to build-time: which subset ships v1, card layout, whether "streak"
records make the cut. (Streaks need a defined ordering of games within a season —
an order DOES exist in the model, verify it survives into the derived view before
relying on it.)

## /vs/[a]/[b] — head-to-head, RELATIONAL

Direction: stats that **characterize the pair**, not two columns side by side. A
per-game placement dump was explicitly rejected — it turns into a numbers dump.

Seed relational stats (need a product-owner refinement pass):

- **H2H win-loss record** in genuinely head-to-head formats — the `match` /
  `match_game` structure gives real W/L. Most legible; build this first.
- **Genre comparison** — who's better at which genres (needs the Title + genre-tag
  layer).
- **Most similar / most different** — the season, genre, or game where the two
  players were closest / furthest apart. The rivalry/foil narrative; the most
  group-chat-able stat.

Deferred to build-time: handling games only one player played; defining "ahead"
when they tied a season; visual treatment; the exact similarity metric.

## Front page (for the record)

Stays the current/latest-season hook: **latest champion hero + entry points** into
seasons, players, and `/records`. It is the live-companion surface (wants recency);
the monument depth lives on `/records` and player pages.
