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
**Workflow for each step below:** consult the relevant subagents *at the start of
that step* (not upfront) before building — e.g. `architect` for data/form
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

### Must-have

- [~] **Season pages (enhanced):** Largely built — `/sesong/[sesong]/page.tsx`
      has a `finished`/`live` branch wired to `getSeasonView(n)` +
      `composeSeasonView` (so the read layer IS now consumed by a page — the
      "not yet consumed" note in Phase 3 is stale), with final standings
      (`StandingsTable`), the points-over-games chart (`SeasonPointsChart`),
      champion hero, participants, and the games grid. `upcoming` seasons keep
      the hype poster. Remaining:
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
- [ ] **Player career pages (/spillere/[spiller]):** Career stats, championships, win rate. Evolved gamer card.
- [ ] **Player index (/spillere):** All players across all seasons
- [ ] **The Hall (/):** Reigning champion hero, championship lineage, entry points to seasons and players

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
- [ ] **Results entry form** (enter scores per player per game) — schema-heavy;
      needs an architect + UX pass (H2H match games vs. round scores differ).
      Moved here from Phase 3: it's a live-season tool, best designed against the
      actual live-entry workflow.
- [ ] Review/edit submitted results; flip `confirmed` to publish
- [ ] Admin panel supports real-time score entry during the tournament

---

## Cut / far future

- **Predictions/picks:** Far future
- **Comments, reactions, notifications:** Cut — group chat is the social layer
- **WebSockets:** Polling is sufficient
- **Public user accounts:** No public auth. Admin access only.
- **CMS or multi-editor tooling:** The /admin panel is the ceiling
