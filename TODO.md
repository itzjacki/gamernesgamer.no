# Gamernes Gamer — Expansion Plan

## Vision

Shift from pre-tournament hype poster to a permanent monument and celebration of
the tournament. Primary value: post-tournament (reminiscing, stats, history, "remember
when"). Secondary value: during-tournament (live tracking). The group chat remains the
social hub — the site produces artifacts that feed into it.

---

## Open questions (must resolve before relevant phases)

- **Data modeling depth:** RESOLVED, built, and seeded (S1–S4 live on prod). Full
  stage → match → match_game / stage → round → round_result model. Details:
  `working-docs/game-formats.md`; schema: `supabase/migrations/`.
- **Cross-season point normalization:** Raw points aren't comparable across seasons
  (different ladders + power-ups), so all-time stats (/records, /vs) need a
  placement-based normalization. Options + recommendation await Jakob's call:
  `working-docs/cross-season-normalization.md`. Resolve before building /records and /vs.
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

Supabase (Postgres + Auth) + the custom admin panel. Prerequisite for all
results-based features. Data is in; the admin panel is what's left.

**Scope:**

- [x] Supabase project set up and linked; local stack (Docker) as dev/test/staging.
- [x] Schema designed + applied (local + prod) — stage → match / stage → round
      model, 14 tables, updated_at triggers, RLS locked (no policies yet),
      `set_updated_at()` search_path pinned. Model: `working-docs/game-formats.md`.
- [x] All historical data (S1–S4) seeded in `supabase/seed.sql`, reconciled on
      local, and **pushed to prod** (`db push --linked --include-seed`). Verified
      on prod: 4 seasons, 34 games, all derived totals match the working docs.
- [ ] Auth for a small admin group (allowlist/invite model, not public)
- [ ] Custom /admin panel:
  - [ ] Sign in via Supabase Auth
  - [ ] Results entry form (enter scores per player per game)
  - [ ] Review/edit submitted results
  - [ ] Protected server-side via Supabase session
  - [ ] RLS policies (public read of confirmed results; admin-only writes) land here
- [ ] Server actions for reading results data (used by public pages)
- [ ] Flip `read.ts` to the publishable key once public-read RLS policies exist
      (currently uses the secret key because RLS is locked).

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
