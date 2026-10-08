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
- **Cross-season point normalization:** RESOLVED. Normalize off **placement**
  (4/3/2/1), career = sum of season placement-points, two separate normalizations
  (season-level → career board; per-game → records/vs, top-anchored). No schema
  change; needs a multi-season fetch (`fetch.ts` is single-season today). Full
  decision: `working-docs/cross-season-normalization.md` (delete when /records + /vs
  ship). Unblocks /records and /vs.
- **Game title abstraction + genre tags:** PLANNED. Today's `Game` is already a
  per-season _instance_; introduce a stable **`title`** layer above it (identity +
  multi-valued genre tags; CS:GO ≈ CS2; LoL instances share a title) and an
  additive `titleId` on each instance. No DB schema change — static-data refactor in
  `src/data`. Genre tags are human-entered (part of data entry; Jakob seeds S1–S4
  manually; taxonomy deferred to build). Full plan:
  `working-docs/game-title-abstraction.md` (delete when built). Unlocks best/worst
  genre on career pages and genre comparison on /vs.
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
results-based features. Data, Auth, and RLS are in; the admin panel UI (login +
results entry) and the server actions for public reads are what's left.

**Scope:**

- [x] Supabase project set up and linked; local stack (Docker) as dev/test/staging.
- [x] Schema designed + applied (local + prod) — stage → match / stage → round
      model, 14 tables, updated_at triggers, RLS enabled (policies added later —
      see below), `set_updated_at()` search_path pinned. Model: `working-docs/game-formats.md`.
- [x] All historical data (S1–S4) seeded in `supabase/seed.sql`, reconciled on
      local, and **pushed to prod** (`db push --linked --include-seed`). Verified
      on prod: 4 seasons, 34 games, all derived totals match the working docs.
- [x] Auth for a small admin group — invite-only allowlist (`admin_user` table +
      `public.is_admin()`), no public signup. `/admin/*` gated server-side by
      `src/proxy.ts` (session refresh via `getClaims()` + redirect to `/admin/login`).
- [x] RLS policies live (migration `*_auth_admin_and_rls_policies` + the
      `*_harden_is_admin_security_invoker` follow-up): public read of structural
      data + `confirmed = true` results; all writes admin-only. On prod; security
      advisors clean.
- [x] Flipped `read.ts` to the publishable key (RLS-enforced) now that public-read
      policies exist. No app code uses the secret key anymore.
      **Workflow for each step below:** consult the relevant subagents _at the start of
      that step_ (not upfront) before building — e.g. `architect` for data/form
      structure, `ui-ux-designer` for the interface, `frontend-developer` for
      implementation, `code-reviewer` before finishing. Pick the agents that fit the
      step; don't pre-consult steps that aren't being worked yet.

**Prerequisite (Jakob, dashboard) — Google OAuth bootstrap:** sign-in is
Google-only (no passwords). With OAuth the admin's `auth.users` row is created
automatically on first sign-in — do NOT create it by hand. Bootstrap: (1) set up
the Google provider (see "Google OAuth setup" below), (2) sign in once through
`/admin/login` (you'll hit the "not an admin" rejection — expected), (3) insert
your `admin_user` row via the service role, (4) reload `/admin`.

- [x] Custom /admin panel:
  - [x] Sign in via Google OAuth — login page + `signIn`/`signOut` server
        actions + `/auth/callback` code-exchange route. Allowlist gate in
        `admin/(protected)/layout.tsx` (`is_admin` RPC); authenticated
        non-admins get a graceful rejection screen with sign-out. Google-only
        by decision (no password handling; everyone has a Google account).
        Admin UI copy is agent-generated Norwegian (admin pages are exempt from
        the human-written-copy rule).
  - [x] Admin dashboard shell (protected landing at `/admin`, sign-out) —
        minimal; verifies the full auth loop. Expands into results UI next.
  - [x] Admin management: add/remove other admins (manage the `admin_user`
        allowlist from the UI instead of by hand via the service role) — built:
        `/admin/admins` + `admin_add`/`admin_remove`/`admin_list_users` RPCs,
        last-admin lockout guard, add-from-signed-in-users only.
  - [x] DB overview: a small read-only sanity panel confirming the data is
        intact (season/game/user counts, current season) — built:
        `DbOverview.tsx` on the dashboard (a `<dl>`, not a result browser).
- [x] Server actions for reading results data (used by public pages) — the
      read layer is built + unit-tested: `getSeasonView(n)` / `getGameView(n,
slug)` in `src/lib/results/queries.ts`, backed by `read.ts` (publishable
      key, RLS-enforced). Note: these are read functions for Server Components
      to call directly (reads aren't Server Actions — those are for mutations),
      per code-conventions. **Now consumed:** `/sesong/[sesong]/page.tsx` wires
      `getSeasonView(n)` + `composeSeasonView` into its finished/live branch
      (Phase 4's "Season pages (enhanced)", in progress).

> Results entry (the scores-per-player-per-game form + review/edit/confirm) moved
> to Phase 5 — it's a live-season tool, not a prerequisite for the Phase 4
> historical pages (which read already-seeded S1–S4 data).

### Google OAuth setup (Jakob, one-time)

1. **Google Cloud** — create an OAuth **Web application** client:
   - Authorized JavaScript origins: `http://localhost:3000` (dev) +
     `https://<prod-domain>`.
   - Authorized redirect URIs point at **Supabase's** callback, not the app:
     `http://127.0.0.1:54321/auth/v1/callback` (local) and
     `https://<project-ref>.supabase.co/auth/v1/callback` (prod).
   - Copy the Client ID + Client Secret.
2. **Supabase dashboard** → Auth → Providers → Google: enable, paste ID/secret.
   Auth → URL Configuration: set the Site URL and add the app's own callback
   (`https://<prod-domain>/auth/callback`, plus
   `http://localhost:3000/auth/callback` for dev) to the redirect allow-list.
3. **Local stack** — `supabase/config.toml` `[auth.external.google]` with
   `enabled = true` and the client id/secret via `env(...)` (secret in a
   gitignored `supabase/.env`); `supabase stop && supabase start` to apply.

---

## Phase 4 — Historical content & stats features 🚧

Started. Phase 3 data is live and the shared UI primitives (`Panel`, `Button`,
`StatList`/`StatRow`) are in place to build on. First target: enhanced season
pages (wire `getSeasonView(n)` into `/sesong/[n]`). `/records` + `/vs` stay
blocked on cross-season normalization.

### Build order (post-planning 2026-10-07)

Dependency-driven, not top-to-bottom. The three sharp dependencies: a **multi-season
fetch** (`fetch.ts` is single-season) blocks only /records + /vs; the **title/genre
layer** blocks only the _genre_ stats (not the rest of any page); the **career
placement-points derivation** (4/3/2/1 sum) is shared by player pages + /records —
build it once, pure + tested.

1. **Season pages** — functionally done; remaining work is Jakob's manual visual
   polish (champion-hero cutouts), which does NOT block anything below. Feature
   expansion deferred to end of Phase 4 (see item below).
2. **Player career pages + index** — index BUILT; career pages BUILT (see
   must-have below). The shared career derivation (`derive/career`: placement-points
   / avg-placement / trophies, pure + unit-tested against the S1+S2 oracle) now
   exists. Best/worst-genre stat still deferred (waits on the title layer).
3. **Title/genre abstraction + seed S1–S4 genres** — self-contained static-data
   refactor Jakob does manually; pin the genre taxonomy first. Lights up genre stats
   for /records, /vs, and retroactively the player pages. See
   `working-docs/game-title-abstraction.md`.
4. **Multi-season fetch** — DONE early. Built as `fetchAllSeasonBundles()` (a thin
   parallel fan-out over `fetchSeasonBundle`) for the career pages; /records reuses
   it, so this is no longer a blocker there.
5. **/records** — career leaderboard (reuses step 2's derivation) + superlative wall;
   now unblocked by steps 3 + 4.
6. **/vs/[a]/[b]** — last; needs a product-owner refinement pass on the relational
   stat set first (H2H W/L is the concrete starting stat).
7. **Front page** rework — any time after /records exists to link to.
8. **Season-page feature expansion** — end of Phase 4, after the other stats/content
   pages (see must-have item below).

### Must-have

- [~] **Season pages (enhanced):** Largely built — `/sesong/[sesong]/page.tsx`
  has a `finished`/`live` branch wired to `getSeasonView(n)` +
  `composeSeasonView` (so the read layer IS now consumed by a page — the
  "not yet consumed" note in Phase 3 is stale), with final standings
  (`StandingsTable`), the points-over-games chart (`SeasonPointsChart`),
  champion hero, participants, and the games grid. `upcoming` seasons keep
  the hype poster. **Remaining work is manual visual polish (blocked by
  Jakob) — it does NOT block progressing to the other stats/content pages.**
  Remaining:
  - [x] **Per-game points matrix (`GamePointsMatrix`).** Box-score table on the
        finished view, placed after the chart ("the numbers behind the race").
        Axes flipped (games as rows, players as columns) to stay narrow on
        mobile; player columns follow standings order, cells re-keyed by
        seasonPlayerId so columns align. Each cell shows the plain TOTAL; cells
        with a power-up/curse are a **native-popover trigger** (HTML Popover API
        — no JS, stays a Server Component) marked with a dotted underline, whose
        panel breaks the total into a "Grunnpoeng" line + one line per power-up
        with its signed delta (real U+2212 minus, no colour-coding — accent
        stays reserved for rank-1). This replaced an earlier superscript idea
        that made totals look inflated. Reusable later on player/records pages.
        **Public copy is placeholder** (heading "Poeng per spill", the help
        line, totals label "Totalt", the Grunnpoeng line, the trigger
        aria-label) — flagged in-file, needs human Norwegian review. Positioning
        uses CSS Anchor Positioning with the browser's centered-popover default
        as a graceful fallback for older browsers.
  - [x] **Power-ups surfaced on the finished view (results-integrated).** Chose
        option (b): the results layer now carries per-cell power-up usage end to
        end. `PowerUp` static type gained a `slug` (populated S2–S4, matching the
        DB `power_up.slug`, unique per season); `fetch` pulls the `power_up`
        anchors; `derive` builds a per-use list and derives the net as its sum
        (single summation — list and net can't drift); `compose` joins the
        static name/description by slug (fail-loud `requirePowerUp`); view-model
        gained `PowerUpUseEntry` / composed `ComposedPowerUpUse`. Zero-delta uses
        are included. Vitest grew to 42 tests (S2 oracle: net-unchanged, Σlist,
        zero-delta inclusion, name-join, fail-loud). The finished view surfaces
        power-ups two ways: per-cell effect breakdowns in the matrix popovers,
        AND a static CATALOG section (power-ups + curses as `PowerUpCard`s,
        everything revealed) after the games grid, matching the poster layout.
        S1 (no power-ups) renders no catalog.
  - [ ] **Champion hero needs manual work (not automatic).** `ChampionHero`
        resolves a dedicated background-removed cutout at
        `public/images/champions/<NN>.png` at build time, falling back to the
        regular gamer portrait when absent. The cutout has to be produced by
        hand per season (background removal); without it the hero renders the
        plain portrait rather than the intended treatment. Track per-season
        cutout creation as a manual step (and fold it into the "Adding a new
        season" workflow).
- [x] **Player career pages (/spillere/[spiller]):** BUILT. Nameplate hero
      (`PlayerHero` — accent used for every player by design, not champion-gated),
      a Transfermarkt-style `TrophyShelf` (season gold/silver/bronze + per-game
      golds, native-popover hover/focus labels linking out; the real GG trophy art
      is now wired in — season tiers render the actual trophy SVG metal-tinted
      gold/silver/bronze, game-golds keep the small on-token cup; see
      `TrophyIcon.tsx`), a `CareerLedger` instrument-panel (avg placement as the
      headline skill stat, career points, seasons played, best/worst season), a
      `SeasonRecord` mono stepped readout (not a chart, by decision), a FUTBIN-style
      `CardGallery` of all per-season FIFA cards, and a "&larr; Alle spillere" back
      link up to the index. Trophies sort by significance (gold→silver→bronze) then
      age. Data layer: `derive/career` (pure, 15 oracle-backed tests inc. trophy
      ordering), `composeCareerView`, `getCareerView`/`getAllPlayerSlugs`; hero
      portrait resolves a dedicated `public/images/heroes/<slug>.png` when present,
      else falls back to the latest card art. All public copy is `TODO(copy)`
      placeholder for human Norwegian (incl. the "Alle spillere" back-link label).
      Remaining (all deferred/blocked, do NOT block /records):
  - [ ] **Dedicated hero portraits** (Jakob) — `public/images/heroes/<slug>.png`;
        falls back to card art until then. Deferred by decision.
  - [ ] **Career-stat OG card** — DEFERRED until hero portraits exist, since the
        final hero art may change the component shape the OG card mirrors. Hero
        shape is already OG-export-ready when we pick it up.
  - [ ] **Best/worst genre stat** — BLOCKED on the title/genre layer.
  - [x] **Rivaler section — CUT until /vs lands.** Was a raw `Placeholder` panel;
        removed entirely rather than shipping a stub. Revisit as a compact H2H
        teaser once `/vs/[a]/[b]` exists (see the H2H-widget strong idea).
- [~] **Player index (/spillere):** BUILT (first pass). All players across all
  seasons as a VERKSTED "entrant sheet" — one row per player (portrait plate +
  name + latest-season nickname), whole row links to the career page, accent
  earned on hover/focus, plus a mono `#` run-order rail and a header strip.
  Static sheet — an on-load "arming" animation was prototyped and removed (see
  the ambient-polish section after Phase 5). Pure static data
  (`src/lib/players/roster.ts`: `allPlayers()` + `playerSlug()`, slug verified
  against `seed.sql`) — no results layer, so no career stats yet. Follow-up
  (ALL gated on the career placement-points derivation — build-order step 2,
  shared with /records):
  - [ ] **Career-stats columns.** The seasons-appeared column was removed (it said
        nothing while everyone has played every season). When career stats land,
        add the first real right-hand mono column(s) — championships / total career
        points / win rate — back into `PlayerRoster`. `allPlayers()` already carries
        each player's `seasons` list for reuse. This is also when accent-at-rest
        finally earns its place (champion callouts).
  - [ ] **Visual rework (AFTER the career-stats columns land).** The first pass is
        deliberately basic — a plain hairline sheet. Once the rows actually carry
        content, give it a proper visual pass: taller rows (~2–3× current height) to
        make room for a larger player image and less trivial geometry, and a small,
        intentional touch of accent. Deferred on purpose — hard to judge the right
        treatment before the rows are filled out, so don't design it against today's
        near-empty row.
  - [ ] **Sort by average placement.** The row index number next to each name
        currently implies a ranking it doesn't have (players are sorted
        most-tenured, then alphabetically). Once career placements are derivable,
        sort the sheet by **average placement** (best first) so the `#` rail
        becomes a real all-time ranking rather than a cosmetic counter.
- [ ] **Front page (/):** Latest-champion hero + entry points into seasons,
      players, and /records. The live-companion surface (recency); it is NOT the
      all-time career board.
- [x] ~~**The Hall (/):**~~ **DROPPED** — absorbed into /records (the all-time
      career leaderboard becomes the headline board there) + the front page
      (champion hero). In a world with front page + player pages + /records, a
      separate Hall had no distinct job. See `working-docs/records-vs-hall-directions.md`.
- [ ] **Season pages — feature expansion (END of Phase 4):** Deliberately deferred
      until after the other stats/content pages (player pages, /records, /vs) are
      built. The season page is functionally complete now; this is the "go deeper"
      pass (additional per-season views/stats/content), scoped at that point. Separate
      from Jakob's manual visual polish above.

### Strong ideas

- [ ] **Season recaps:** Editorial title + short recap per season. Gated on editorial appetite.
- [ ] **Season superlatives:** Highest score, most dominant win, etc. per season.
      Candidate: a "power-up impact" superlative (net power-up points gained per
      player across the season) — the composed data already carries every
      `powerUpUse`, so it's a pure aggregation. This is the right home for the
      season-level power-up story (considered and rejected as a clickable matrix
      totals-row popover — it'd just re-roll the per-game rows above and make the
      sheet's bottom line interactive; the standings/player pages are where a
      season rollup is new information).
- [ ] **Champion card treatment:** Special visual variant for the season winner
- [ ] **H2H widget on player pages:** Compact head-to-head record vs. each other
      player. This is the intended replacement for the career page's cut "Rivaler"
      section — build it when `/vs/[a]/[b]` lands.
- [ ] **Attached media on game/season pages:** Clips, screenshots, memes in context

### Explore later

- [ ] **/records (Hall of Records):** All-time records + superlatives, topped by the
      all-time career leaderboard (absorbs The Hall). Normalization RESOLVED;
      directions + seed records in `working-docs/records-vs-hall-directions.md`.
      Build dependency: multi-season fetch.
- [ ] **/vs/[a]/[b] (Head-to-head pages):** Relational stats (H2H W/L record, genre
      comparison, most-similar/most-different), NOT a per-game dump. Normalization
      RESOLVED; needs a product-owner refinement pass on the stat set first. See
      `working-docs/records-vs-hall-directions.md`. Genre stats need the title/genre layer.
- [ ] **Collectible card expansion:** Moment cards (MVP, record-breaker, "the collapse")
- [ ] **OG/shareable images:** Champion card, podium, player stat cards via Vercel OG
- [ ] **Skattkammeret (/lore):** Floating wall of videos, memes, lore. Scope depends on media volume.

---

## Phase 5 — Live tournament mode

- [ ] Countdown component (pre-tournament anticipation)
- [ ] Live leaderboard on season page (polling, no WebSockets needed)
- [ ] **Results entry form** (enter scores per player per game) — schema-heavy;
      needs an architect + UX pass (H2H match games vs. round scores differ).
      Moved here from Phase 3: it's a live-season tool, best designed against the
      actual live-entry workflow.
- [ ] Review/edit submitted results; flip `confirmed` to publish
- [ ] Admin panel supports real-time score entry during the tournament

---

## Ambient polish (post-Phase 5, exploratory)

Low-priority visual flourishes — only worth doing once the core monument is
complete, and only if they can be made to feel intentional rather than decorative.

- [ ] **"Signal lights" tracing the angular lines.** A prototyped on-load "arming"
      animation for the `/spillere` entrant sheet (rows resolving as a hairline
      swept across each) was tried and **removed** — it didn't carry its weight in
      isolation. The idea worth keeping from it: small bright "lights" that shoot
      along the site's existing angular lines (the gamer-card diagonal, grid rules,
      panel hairlines) as a deliberate, sparing motion motif — a timing-board /
      instrument-panel pulse, not per-element decoration. Needs real design work to
      fit VERKSTED: must stay monochrome-or-single-accent, honor reduced-motion, and
      read as purposeful (e.g. one accent light on a champion row) rather than
      ambient sparkle. Scope it as a site-wide motion language, not a one-off.
- [ ] Do a review of spacing on the page. Currently, we have large amounts of spacing
      between almost all sections, this should probably be changed, so spacing is used
      more intentionally. This will also help reinforce VERKSTED.

---

## Cut / far future

- **Predictions/picks:** Far future
- **Comments, reactions, notifications:** Cut — group chat is the social layer
- **WebSockets:** Polling is sufficient
- **Public user accounts:** No public auth. Admin access only.
- **CMS or multi-editor tooling:** The /admin panel is the ceiling
