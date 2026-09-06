# Gamernes Gamer — Expansion Plan

## Vision

Shift from pre-tournament hype poster to a permanent monument and celebration of
the tournament. Primary value: post-tournament (reminiscing, stats, history, "remember
when"). Secondary value: during-tournament (live tracking). The group chat remains the
social hub — the site produces artifacts that feed into it.

---

## Open questions (must resolve before relevant phases)

- **Data modeling depth:** Store only final per-player points per game, or model internal
  game formats (brackets, round-robins, race rounds) in the DB too? The former doesn't
  fully replace the spreadsheet, and may limit what sort of statistics we can show. Needs a dedicated discussion before Phase 3.
- **Cross-season point normalization:** Points are not comparable across seasons (different
  point scales per game/season). All-time stats and /records require a normalization
  strategy. Exact method TBD — resolve before building /records and /vs.
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
prerequisite for all results-based features. Must resolve the data modeling open
question before starting.

**Scope:**

- [ ] Supabase project setup (Postgres + Auth)
- [ ] Auth for a small admin group (allowlist/invite model, not public)
- [ ] Data schema design (resolve open question: points-only vs. full game format modeling)
- [ ] Seed all historical season data (all 4 seasons backfilled)
- [ ] Custom /admin panel:
  - [ ] Sign in via Supabase Auth
  - [ ] Results entry form (enter scores per player per game)
  - [ ] Review/edit submitted results
  - [ ] Protected server-side via Supabase session
- [ ] Server actions for reading results data (used by public pages)

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
