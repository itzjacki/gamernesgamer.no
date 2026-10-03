# Gamernes Gamer — Expansion Plan

## Vision

Shift from pre-tournament hype poster to a permanent monument and celebration of
the tournament. Primary value: post-tournament (reminiscing, stats, history, "remember
when"). Secondary value: during-tournament (live tracking). The group chat remains the
social hub — the site produces artifacts that feed into it.

---

## Open questions (must resolve before relevant phases)

- **Data modeling depth:** DECIDED AND SCHEMA WRITTEN. Full stage → match → match_game
  pipeline for H2H games; stage → round → round_result for non-H2H (rounds/score/placement)
  games. A single game can chain both (e.g. Trombone Champ: rounds group stage → H2H finals).
  6 stage kinds: round-robin | swiss | single-elim | final-bronze | double-elim-reset |
  double-elim-no-reset | rounds. Points = season_ladder[game_result.placement] +
  SUM(power_up_use.points_delta) — ladder is season-wide (identical across all games),
  power-up deltas stored in power_up_use. Placements always unique, stored explicitly
  (not derived) because tiebreakers can override point totals. Scope is variable roster
  size (no 4-player hardcoding). Schema source of truth: `supabase/migrations/`
  (generated reference snapshot: `supabase/schema.sql`).
  Full model: `working-docs/game-formats.md`. Points/placements: `working-docs/game-placements.md`.
- **Cross-season point normalization:** Points are not comparable across seasons (different
  point scales per game/season). All-time stats and /records require a normalization
  strategy. Exact method TBD — resolve before building /records and /vs.
  Ground truth now documented: base ladders are S2 7/4/2/1 and S3/S4 8/5/3/1
  (S1 is 4/3/2/1), and off-ladder values are power-up adjustments (e.g. Double Up
  doubles the ladder value; some cells carry +bonus, 0, or −1 penalties). Power-up
  mechanics live in `src/data/sesong/<NN>/power-ups.ts`; decoded per-game
  points/placements in `working-docs/game-placements.md`. Normalization likely works off
  placement (comparable across seasons) rather than raw points.
- **Editorial appetite:** Several "monument" features (season recaps, "how it went down"
  blocks, Skattkammeret lore content) require written content from Jakob. Scope of these
  features depends on how much curation is realistic.
- **Media volume:** Is the existing content (videos, images, memes) in the dozens or
  hundreds? Affects whether /lore is a simple data file or needs an asset pipeline.

---

## Phase 1 — Next.js rewrite ✅

Migrate the existing Astro site to Next.js. No new features — parity with the current
site.

---

## Phase 2 — Visual rebrand ✅

VERKSTED direction implemented. Neue Montreal + Martian Mono, `#17181a` graphite
background, `#E8334A` accent. Blueprint grid, surface language, full component set.
See `design.md` for the full system.

---

## Phase 3 — Backend + admin panel

Set up Supabase (Postgres + auth) and build the custom admin panel. This is the
prerequisite for all results-based features. Format modeling is decided (see Open
questions); settle the modeling *depth* before finalizing the schema.

**Scope:**

- [x] Supabase project setup (Postgres + Auth) — remote project created and linked
      via MCP; local Supabase stack (Docker) running as dev/test/staging.
- [ ] Auth for a small admin group (allowlist/invite model, not public)
- [x] Data schema design — model + depth RESOLVED (stage → match → game pipeline, see structure.md "Data split" / TODO open question). Source of truth: `supabase/migrations/` (snapshot: `supabase/schema.sql`).
- [x] Schema applied — initial schema + updated_at triggers + RLS (locked, no
      policies yet) applied to BOTH local and remote; verified (14 tables, RLS on
      all, triggers fire, FK constraints enforce); security advisors clean apart
      from the intentional "RLS enabled, no policy" INFO. `set_updated_at()`
      hardened with pinned `search_path`.
- [ ] Seed all historical season data (all 4 seasons backfilled) — `supabase/seed.sql`,
      blocked on gathering internal format details for the `[--]` games.
- [ ] Custom /admin panel:
  - [ ] Sign in via Supabase Auth
  - [ ] Results entry form (enter scores per player per game)
  - [ ] Review/edit submitted results
  - [ ] Protected server-side via Supabase session
  - [ ] RLS policies (public read of confirmed results; admin-only writes) land here
- [ ] Server actions for reading results data (used by public pages)

**Follow-ups before the next migration:**

- [ ] Link the CLI to the remote project (`supabase login` + `supabase link
      --project-ref <ref>`) so `supabase db push` becomes the apply path and we
      stop using MCP `apply_migration` (which caused migration-version drift on
      the initial schema — see tech.md "One apply path per migration").

---

## Phase 4 — Historical content & stats features

All depend on Phase 3 data being in place.

### Must-have

- [ ] **Season pages (enhanced):** Final standings, points-over-games chart, power-ups display
- [ ] **Player career pages (/spillere/[spiller]):** Career stats, championships, win rate. Evolved gamer card.
- [ ] **Player index (/spillere):** All players across all seasons
- [ ] **The Hall (/):** Reigning champion hero, championship lineage, entry points to seasons and players

### Strong ideas

- [ ] **Season recaps:** Editorial title + short recap per season. Gated on editorial appetite.
- [ ] **Season superlatives:** Highest score, most dominant win, etc. per season
- [ ] **Champion card treatment:** Special visual variant for the season winner
- [ ] **H2H widget on player pages:** Compact head-to-head record vs. each other player
- [ ] **Attached media on game/season pages:** Clips, screenshots, memes in context

### Explore later

- [ ] **/records (Hall of Records):** All-time records and superlatives. Blocked on cross-season normalization.
- [ ] **/vs/[a]/[b] (Head-to-head pages):** Lifetime record, side-by-side stats. Same blocker.
- [ ] **Collectible card expansion:** Moment cards (MVP, record-breaker, "the collapse")
- [ ] **OG/shareable images:** Champion card, podium, player stat cards via Vercel OG
- [ ] **Skattkammeret (/lore):** Floating wall of videos, memes, lore. Scope depends on media volume.

---

## Phase 5 — Live tournament mode

- [ ] Countdown component (pre-tournament anticipation)
- [ ] Live leaderboard on season page (polling, no WebSockets needed)
- [ ] Admin panel supports real-time score entry during the tournament

---

## Cut / far future

- **Predictions/picks:** Far future
- **Comments, reactions, notifications:** Cut — group chat is the social layer
- **WebSockets:** Polling is sufficient
- **Public user accounts:** No public auth. Admin access only.
- **CMS or multi-editor tooling:** The /admin panel is the ceiling
