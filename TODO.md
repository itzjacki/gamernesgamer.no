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
- **Rebrand direction:** Dark mode, light/refraction aesthetic. Needs design exploration
  with the UI/UX designer before implementation.

---

## Phase 1 — Next.js rewrite

Migrate the existing Astro site to Next.js. No new features — parity with the current
site. This is the foundation for everything that follows, and lets the codebase move into
a stack that's more comfortable and better suited to the dynamic features ahead.

**Scope:**

- Set up Next.js project with App Router, Tailwind CSS v4, TypeScript strict
- Migrate all existing pages: home, season pages (/sesong/[n]), game detail pages
  (/sesong/[n]/games/[game])
- Migrate all existing components (gamer cards with tilt effect, game cards, power-up
  cards, season header/nav, countdown, etc.)
- Preserve all existing data files in src/data/sesong/[n]/ as-is
- Preserve all existing design tokens, colors, and fonts
- Vercel deployment — confirm parity before switching over

**Not in scope:** No new features, no rebrand, no DB.

---

## Phase 2 — Visual rebrand

Redesign the visual identity of the site. Direction: dark mode, playing with light
(refractions, rays, glow) — not retro gaming, not generic SaaS, not vibecoded slop.
Needs design exploration before implementation.

**Scope:**

- Design exploration session with UI/UX designer
- New color palette, typography treatment, and design tokens
- Evolved base gamer card design (the FIFA card concept is a core visual asset)
- Apply new design system across all pages

**Note:** New page shells can be scaffolded here even if they're empty/placeholder —
the site map is roughly known, the content comes in Phase 4+.

---

## Phase 3 — Backend + admin panel

Set up Supabase (Postgres + auth) and build the custom admin panel. This is the
prerequisite for all results-based features. Must resolve the data modeling open
question before starting.

**Scope:**

- Supabase project setup (Postgres + Auth)
- Auth for a small admin group (not public — allowlist/invite model)
- Data schema design (resolve open question: points-only vs. full game format modeling)
- Seed all historical season data (all 4 seasons backfilled)
- Custom /admin panel in Next.js:
  - Sign in via Supabase Auth
  - Results entry form (enter scores for a game, per player)
  - Review/edit submitted results
  - Protected server-side via Supabase session
- API routes / server actions for reading results data (used by public pages)

**Decisions needed first:**

- Data modeling depth (see open questions)
- Who gets admin access and how accounts are managed

---

## Phase 4 — Historical content & stats features

Build out the post-tournament value features. These all depend on Phase 3 data being
in place. Build order within this phase is flexible.

### Must-have

- **Season pages (enhanced):** Final standings, points-over-games progression chart,
  game strip, power-ups display. Replace current static season pages with DB-backed versions.
- **Player career pages (/players/[slug]):** Career stats (seasons entered, total points,
  championships, win rate, best/worst finish). Evolved FIFA card. Links to all seasons played.
- **Player index (/players):** Overview of all players across all seasons.
- **The Hall (landing page / /):** Reigning champion hero, championship lineage across all
  seasons, entry points to seasons and players. The "monument" feel.

### Strong ideas

- **Season recaps:** Editorial title + short recap text per season. Gated on editorial appetite.
- **Season superlatives:** Highest single-game score, most dominant win, etc. per season.
- **Season card variants:** Per-season version of each player's card showing that season's stats.
- **Champion card treatment:** Special visual variant for the season winner.
- **H2H widget on player pages:** Compact head-to-head record vs. each other player,
  linking out to /vs. Only counts seasons where both played.
- **Attached media on game/season pages:** Clips, screenshots, memes in context rather
  than a central gallery.

### Explore later (post Phase 4)

- **/records (Hall of Records):** All-time records, silly awards (Wooden Spoon, longest
  drought, biggest collapse), rivalry matrix. Blocked on cross-season normalization decision.
- **/vs/[a]/[b] (Head-to-head pages):** Lifetime record, side-by-side stats, provocative
  verdict. Same blocker. Most shareable artifact type — worth building eventually.
- **Collectible card system expansion:** Moment cards beyond champion (MVP, record-breaker,
  "the collapse"). Treat as an opportunistic pattern, not a committed matrix. Ship base
  card + champion first.
- **OG/shareable images:** Champion card, podium graphic, player stat cards generated via
  Vercel OG / Satori. Doubles as social link previews for group chat sharing.
- **Skattkammeret (/lore):** Floating wall of non-season-specific content (videos, memes,
  lore). Scope depends on media volume. Comes after the stats core.

---

## Phase 5 — Live tournament mode

Build the during-tournament features. Only 2 days per tournament, every 6-12 months —
but high value on those days.

**Scope:**

- Live leaderboard on season page (polls /api every 5–15s — no WebSockets needed)
- Admin panel supports real-time score entry during the tournament
- Results entered during the tournament become the permanent archive record
  (no separate spreadsheet needed)

---

## Cut / far future

- **Predictions/picks:** Far future. LoL-pickems style.
- **Comments, reactions, notifications:** Cut completely. The group chat is the social
  layer.
- **WebSockets:** Polling is sufficient for this audience size.
- **Public user accounts:** No public auth. Admin access only.
- **CMS or multi-editor tooling:** The /admin panel is the ceiling. Content lives in code.
