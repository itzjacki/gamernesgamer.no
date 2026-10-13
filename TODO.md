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
  change; the multi-season fetch it needed is built (`fetchAllSeasonBundles()`).
  Full decision: `working-docs/cross-season-normalization.md` (delete when
  /records + /vs ship). Unblocks /records and /vs.
- **Game title abstraction + genre/format tags:** DATA LAYER BUILT, S1–S4 tagged.
  A stable **title** registry (`src/data/titles.ts`: identity + `genreTags`;
  CS:GO ≈ CS2; LoL instances share a title) sits above the per-season `Game`
  instance, which gained `titleId`, `formatTags` (what the contest was: duel,
  gold-rush, speedrun, …; may be empty) and an optional `genreTags` override
  (only CS2 parkour uses it). Static data only, no DB change; both vocabularies
  are closed TS unions. Per-player stats by tag are derived and composed
  (`CareerView.tagStats`, genre and format ranked together as one `Tag` list)
  and shown on the career page.
  Decisions: `working-docs/game-title-abstraction.md` (delete when the stats
  ship). Unlocks best/worst genre on career pages and genre comparison on /vs.
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

## Phase 3 — Backend + admin panel ✅

Supabase (Postgres + Auth) + the custom admin panel. Prerequisite for all
results-based features. Data, Auth, RLS, the admin panel (login, admin
management, DB overview) and the public read layer are all in. Results entry
moved to Phase 5.

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
`StatList`/`StatRow`) are in place to build on. Season pages, player career
pages, the title/genre layer and `/records` are built. Next: the
player-index follow-ups, then `/vs`.

### Build order (post-planning 2026-10-07)

Dependency-driven, not top-to-bottom. Of the three sharp dependencies, two are
now built: the **multi-season fetch** (`fetchAllSeasonBundles()`) and the **career
placement-points derivation** (`derive/career`, 4/3/2/1 sum, shared by player
pages + /records). The one left is the **title/genre layer**, which blocks only
the _genre_ stats (not the rest of any page).

1. **Season pages** — functionally done; remaining work is Jakob's manual visual
   polish (champion-hero cutouts), which does NOT block anything below. Feature
   expansion deferred to end of Phase 4 (see item below).
2. **Player career pages + index** — index BUILT; career pages BUILT (see
   must-have below). The shared career derivation (`derive/career`: placement-points
   / avg-placement / trophies, pure + unit-tested against the S1+S2 oracle) now
   exists. Best/worst-genre stat still deferred (waits on the title layer).
3. **Title/genre abstraction + S1–S4 tags** — data layer BUILT
   (`src/data/titles.ts`, `titleId`/`formatTags` on every instance), vocabularies
   and the tagging of all 34 games agreed with Jakob. Per-player tag stats are
   BUILT + unit-tested (`deriveTagStats`, joined in `composeCareerView`).
   Surfaced on the career page (`TagRecord`) and on /records (`TagCrowns`).
   Remaining: /vs comparison. See `working-docs/game-title-abstraction.md`.
4. **Multi-season fetch** — DONE early. Built as `fetchAllSeasonBundles()` (a thin
   parallel fan-out over `fetchSeasonBundle`) for the career pages; /records reuses
   it, so this is no longer a blocker there.
5. **/records** — BUILT: career board + record wall (22 plates) + category
   crowns. See the must-have item below for what is left.
6. **/vs/[a]/[b]** — last; needs a product-owner refinement pass on the relational
   stat set first (H2H W/L is the concrete starting stat).
7. **Front page** rework — any time after /records exists to link to.
8. **Season-page feature expansion** — end of Phase 4, after the other stats/content
   pages (see must-have item below).

### Must-have

- [~] **Season pages (enhanced):** Largely built — `/sesong/[sesong]/page.tsx`
  has a `finished`/`live` branch wired to `getSeasonView(n)` +
  `composeSeasonView`, with final standings
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
      headline skill stat, career points, seasons played, then best/worst
      season, best category, avg game placement — eight cells, no blanks), a
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
  - [x] **Best/worst category (`TagRecord`).** BUILT. A `tag-record` section
        between the season record and the card gallery: ONE full-width
        `TagRecord` with genre and format tags ranked together (decision: the
        genre/format split is a data-entry detail, not a reader-facing
        distinction). A best/worst headline sits over the full breakdown table
        (games, wins, average placement to one decimal). Rows are sorted best
        first; averages that read the same at one decimal are tied and broken
        by more games, then more wins. Each tag name is a
        native-popover trigger (same no-JS pattern as `GamePointsMatrix`)
        listing the games behind the row: title linking to the game page,
        season and placement. The ranking cutoff is applied on the
        consuming side (`MIN_RANKED_GAMES = 3` in `src/lib/tag-ranking.ts`,
        shared with `CareerLedger`'s best-category cell): tags below it are collapsed by default in a native
        `<details>` ("Vis flere"), under a caption explaining they are not
        ranked. A checkbox in the frame's footer row ("Uten egne
        spillvalg", off by default; the custom VERKSTED `Checkbox` primitive) leaves out the games the player chose themselves, since
        people pick what they are good at; both variants are prerendered and
        toggled in CSS alone (`:has(input:checked)`, no JS). Accent only on
        game wins inside the popover (rank-1 data) and on the checked checkbox;
        nothing else takes it at rest. Display labels live in
        `src/data/tag-labels.ts`. **All copy is best-effort Norwegian marked
        `TODO(copy)`** (tag labels, "Best i" / "Svakest i" eyebrows, "Kategori"
        and the other column heads, disclosure labels, explainer caption, the
        own-picks filter label) —
        needs Jakob's pass. Builds and prerenders with the full S1–S4 data; the
        visual result has not been reviewed in a browser yet.
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
  (all UNBLOCKED — the career derivation they were gated on, `derive/career`,
  now exists):
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
- [~] **/records (Hall of Records):** BUILT, `src/app/records/`. Three parts:
  - **Career board (`CareerBoard`)** — every player, ordered by summed season
    placement-points (4/3/2/1), with a per-season placement strip, titles and
    game wins. The leader's position marker carries the accent. The strip
    drops out on narrow screens. Average game placement is not shown but is
    still the board's last ordering tiebreak.
  - **Record wall (`RecordPlate`)** — 22 plates in four groups (an odd last
    plate spans the row):
    - _Seire:_ most game wins; most wins at one title (played at least
      twice); wins in own picks; wins in others' picks; home advantage
      (average placement in others' picks minus in own, min. 4 own picks);
      longest as all-time wins leader (games after which a player led or
      shared the career game-wins tally).
    - _Sesonger og streaks:_ longest win, top-two and top-three streaks (they
      run across season boundaries); best single season (average game
      placement); best closer and best opener (average placement in each
      season's last / first game, min. 3 seasons).
    - _Poeng:_ most points in total (raw season points summed — the one
      record not normalised off placement); most points from power-ups (net
      effect on the player's own score).
    - _Matcher:_ head-to-head match win rate; sweep rate (bo3/bo5 won without
      losing a game); deciders (series that went the full distance, min. 3);
      finals (won of reached, one per game, a grand-final reset counting
      once, min. 3); flawless brackets (H2H game won without losing a match,
      min. 3 matches); longest hold over one opponent (consecutive match wins
      against one player); closest rivalry (a PAIR as holder: games each
      finished ahead of the other, most level pair first); points-tie win
      rate (season ties only, by decision — game-level tiebreaks are not
      counted).

    **The plate:** label + season stamp; holder name(s) (ties share the
    plate on one line — no hidden tiebreaks; a pair shows both names); the
    number in accent with its unit running on from it; up to three
    runners-up, so the whole field of four appears; an empty ruled footer
    row. Every number — the holder's and each runner-up's — is a
    native-popover trigger (dotted underline, no JS) listing what is behind
    it (`RecordLines`). Each plate has a fragment id (`/records#beste-sesong`).
    No portraits.

  - **Category crowns (`TagCrowns`)** — best player per tag (genre and format
    together, `MIN_RANKED_GAMES` applied in the component). Tags under the
    cutoff fold into a "Vis flere" disclosure (`UnrankedRows`), a footer
    checkbox swaps in the crowns computed without each player's own picks
    (CSS-only toggle), and each category name opens the holder's games under
    it (`GameListPopover`). All three pieces are shared with the career
    page's `TagRecord`.

  **Data layer:** `assembleAllCareers` (derive/career) → `composeRecordsView`
  → `deriveRecords` (`derive/records/`: `index.ts` for the placement- and
  season-based records, `match-records.ts`, `rivalries.ts`, shared
  `helpers.ts`/`rank.ts`/`streaks.ts`), read through `getRecordsView`. The
  match records read the `stage`/`match`/`match_game` tables, which the
  season bundle now carries; a match's outcome is derived in
  `derive/matches.ts`, which reads both ways a series is stored (one row per
  game, or one row holding the series score). Unit-tested against the S1+S2
  oracle plus synthetic rows. A game picked by a non-player (Kristin, S3)
  counts as "away" for everyone.

  **Where the records came from, and what was decided against** (so it is
  not re-proposed): the first eight plates came from a product + design pass
  (2026-10-12); the rest from Jakob and from two "committee" rounds of
  independent subagents (2026-10-13).
  - Against in principle: roast / "worst at" records (one player would hold
    them all); most championships and best average as plates (they are board
    columns); a consolation plate for a player who holds none.
  - Built, then removed by Jakob: "closest to a title" (title chance if the
    rest of a season were a coin flip) — slow to compute in dev and it said
    little, since games usually favour one player clearly.
  - Considered and left off: biggest comeback to a title; seasons led
    without winning (near-roast); season-deciding power-ups (better on the
    season page); fastest to five wins; the H2H rock-paper-scissors cycle
    (no holder, one result breaks it); card stats vs. results (belongs with
    the player cards).
  - Would need round-level data (`round`/`round_result`, not fetched yet):
    rounds won in games the player did not win; largest share of the field's
    combined score in one game; share of individual rounds won (one player
    sweeps it). Not worth the fetch for one plate.
  - Not possible from the data: who targets whom with curses (every
    power-up affects its own user); team/duo records (team composition in
    the one 2v2 game is not stored).

  Remaining:
  - [~] **Copy.** Jakob's pass is done on the page (2026-10-13). Still
    best-effort and flagged `TODO(copy)`: the "Vis flere" disclosure
    labels and its caption in `UnrankedRows` (shared with the career
    page).
  - [ ] **Phone review.** Checked at 375px for overflow only; the plates and
        popovers have not been reviewed by eye on a phone.
  - [ ] **No entry point.** Nothing links to /records yet — it arrives with
        the front-page rework.
  - [ ] **`RecordEntry` is a bag of optional fields** (`season`, `title`,
        `tiebreaks`, `seasonPoints`, `matchLines`, `matches`, `opponent`,
        `split`, `partner`, `pair`), one or two per record kind. Fine at
        this size; if more record kinds are added, split it into a
        discriminated union.
  - [ ] **Three near-identical popover stylesheets** (`GamePointsMatrix`,
        `GameListPopover`, `RecordPlate`) share their trigger, panel and
        anchor-positioning rules. Left separate on purpose for now (their
        triggers differ); worth one shared module if a fourth appears.
  - [ ] **Deferred records:** biggest season-over-season climb (has happened
        once), a runner-up column on the crowns table.

- [ ] **/vs/[a]/[b] (Head-to-head pages):** Relational stats (H2H W/L record, genre
      comparison, most-similar/most-different), NOT a per-game dump. Normalization
      RESOLVED; needs a product-owner refinement pass on the stat set first. See
      `working-docs/records-vs-hall-directions.md`. Genre stats need the title/genre layer.
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
