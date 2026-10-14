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
  The working doc that held the full decision was deleted when /records and
  /vs shipped (2026-10-14); it is in git history.
- **Game title abstraction + genre/format tags:** DATA LAYER BUILT, S1–S4 tagged.
  A stable **title** registry (`src/data/titles.ts`: identity + `genreTags`;
  CS:GO ≈ CS2; LoL instances share a title) sits above the per-season `Game`
  instance, which gained `titleId`, `formatTags` (what the contest was: duel,
  gold-rush, speedrun, …; may be empty) and an optional `genreTags` override
  (only CS2 parkour uses it). Static data only, no DB change; both vocabularies
  are closed TS unions. Per-player stats by tag are derived and composed
  (`CareerView.tagStats`, genre and format ranked together as one `Tag` list)
  and shown on the career page, /records and /vs.
  The working doc that held the decisions was deleted once the tag stats
  were on /records and /vs (2026-10-14); it is in git history, and the model
  is described in `.kiro/steering/structure.md` ("Titles and tags").
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
pages, the player index, the title/genre layer, `/records` and `/vs` are
built, with their copy reviewed. Next: the front page and site navigation —
in refinement, see `working-docs/front-page-and-nav.md`.

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
   Surfaced on the career page (`TagRecord`), on /records (`TagCrowns`) and
   on /vs (who finished ahead per category). Nothing remaining.
4. **Multi-season fetch** — DONE early. Built as `fetchAllSeasonBundles()` (a thin
   parallel fan-out over `fetchSeasonBundle`) for the career pages; /records reuses
   it, so this is no longer a blocker there.
5. **/records** — BUILT: career board + record wall (22 plates) + category
   crowns. See the must-have item below for what is left.
6. **/vs/[a]/[b]** — BUILT and reviewed, with its entry points on the career
   page and /records. See the must-have item below.
7. **Site navigation** — BUILT (2026-10-14): `SiteHeader`, the "Tangenter"
   header (see the must-have item below). **Front page** rework — IN
   REFINEMENT: throwaway prototype routes under `src/app/proto/` on the real
   data (`/proto` in dev). /vs routing decided (`vs/[[...a]]` for `/vs` +
   `/vs/<a>`, `vs/[a]/[b]` separate; verified in Next 16) but the /vs index
   page is not built yet. The hero is the light-breaking trophy (Lysbrudd)
   over three.js, reworked into the design language with the names laser-cut
   through the plaque. Next: workshop the page's content and structure. Jakob
   has the physical trophy and can scan it. Synthesis, open questions and the
   recommendation: `working-docs/front-page-and-nav.md`. Prerequisite for a
   lifecycle-aware `/`: structured `start`/`end` dates on `SeasonMeta`.
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
        Public copy reviewed by Jakob. Positioning
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
      else falls back to the latest card art. All public copy is reviewed by
      Jakob.
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
        `src/data/tag-labels.ts`. All copy is reviewed by Jakob. Builds and prerenders with the full S1–S4 data; the
        visual result has not been reviewed in a browser yet.
  - [x] **Rivaler section — replaced by a head-to-head list.** The raw
        `Placeholder` panel was cut; now that `/vs/[a]/[b]` exists, the career
        page has a head-to-head list (`PairSummaryList`) between the category
        record and the card gallery: one row per opponent with games finished
        ahead each way, the /vs gauge and the match record, the whole row
        linking to that pair with this player on the left. Copy reviewed by
        Jakob (2026-10-14).
- [~] **Player index (/spillere):** BUILT. All players across all seasons as a
  stack of VERKSTED nameplates (`PlayerRoster`) — one six-cell-tall band per
  player, the whole band linking to the career page. Identity and nickname
  come from static data (`src/lib/players/roster.ts`: `allPlayers()` +
  `playerSlug()`, slug verified against `seed.sql`); the ranking and the
  career figures come from the /records career board
  (`getRecordsView().board`), joined by slug in the page. An on-load "arming"
  animation was prototyped and removed (see the ambient-polish section after
  Phase 5).
  - [x] **Career figures.** Two footer cells: "Titler" (seasons won, as a
        number) and "Snitt" (average final season placement, one decimal — the
        career page's headline stat). Kept to these two by decision
        (2026-10-13): it is a player list, not a second leaderboard — career
        points, game wins and win rate stay on /records and the career page.
        Both labels reuse copy already on /records.
  - [x] **Reigning-champion mark.** The winner of the latest decided season
        gets a small muted (grey, on-token) GG trophy next to the rank mark —
        `TrophyIcon`'s `muted` variant. Hovering the trophy fades in the label
        "Regjerende mester" beside it in the header strip (CSS only: the plate
        is one link, so the mark cannot be a popover trigger; the label is
        transparent at rest, so screen readers still get it). No hover on
        touch screens. Label reviewed by Jakob (2026-10-14). Replaced an
        earlier pass that drew one gold trophy per title.
  - [x] **Sort by average placement.** Ordered by average season placement,
        best first; the small mono rank mark on each plate is a real all-time
        ranking. Equal averages keep the /records board order
        (placement-points, then titles, then average game placement), so the
        two pages cannot disagree; plates equal on all of it share a rank. A
        player with no finished season yet sorts last with no rank mark and
        "–" for the average. Accent at rest (Jakob, 2026-10-14) is the rank mark on
        EVERY plate: consistent down the sheet, not a prize for the highest
        number. Tried and dropped the same day: accent only on the leader's
        mark (almost no red), on title counts above zero (number-based), and
        on the diagonal (works on /vs, not here).
  - [x] **Visual rework.** Built and approved by Jakob (2026-10-13). Each plate is ruled like the site's other instruments: a
        mono header strip (rank mark, champion mark), the name (Neue Montreal 800) over the mono nickname, and a footer of hairline-divided figure
        cells (mono eyebrow + mono figure, as in `CareerLedger`). The portrait
        sits at the right end behind ONE diagonal hairline that echoes the
        gamer-card diagonal; the plate stays `bg-bg` throughout (an earlier
        pass lifted the portrait onto a slanted `bg-surface` panel, which read
        as a different design language). Portraits are greyscale at rest so
        photos from different seasons read as one set; hover/focus brings back
        the colour and turns the border, the diagonal and the name accent. The
        portrait is the dedicated hero image (`public/images/heroes/<slug>.png`,
        via `findHeroImage` in `queries.ts`, shared with the career hero) when
        one exists, else the latest card art, cropped from the top. Idea not tried: the figure breaking out of the
        plate's top edge. (An accent duotone on hover was tried on /vs and
        dropped — see there.)
  - [ ] **Real portraits** (Jakob). No dedicated hero image exists yet, so
        every plate shows card art as a placeholder — the same manual step as
        the career page's "Dedicated hero portraits". Revisit the top crop
        once the real images land.
- [x] **Site navigation:** BUILT (2026-10-14), replacing `SeasonHeader`.
      `SiteHeader` (server: data) + `SiteHeaderBar` (client), in the root
      layout. The "Tangenter" header, two tiers:
  - **Rail of keys:** a dot-matrix logo (`DotMatrixLogo`, sampled from
    `public/images/branding/logo.svg`, links to `/`), then Sesonger,
    Spillere, Rekorder, VS. Each key shows a function number, its label and a
    status LED; the LED is steady on the current section. A model stamp
    (`GG–S04`) sits at the right on desktop.
  - **Display row:** shows one thing at a time. At rest it is the page's
    readout, label over value: season / date / games / champion on season
    pages, player / seasons / titles on career pages, and the latest champion
    elsewhere. On a pair page the VS picker itself is the readout
    (pre-filled, with BYTT and GÅ).
  - **Choosers:** Sesonger and VS are choosers, not links. They take over
    the display (season keys; a quick pair picker) while their LED blinks.
    Escape, a click outside, the key again or navigating closes them.
    Spillere and Rekorder are plain links.
  - **Copy:** all labels are best-effort, flagged `TODO(copy)` in
    `SiteHeaderBar.tsx`.
  - [ ] **/vs index page:** decided as two dropdowns + go, pre-filled by path:
        `vs/[[...a]]` serves `/vs` and `/vs/<a>`, while `vs/[a]/[b]` stays
        separate (pattern verified in `src/app/proto/vs/`). The header's VS
        chooser covers quick picks meanwhile. Rework the picker component when
        building it.
  - [ ] **Redundant pair switcher:** the /vs page's own pair switcher now
        duplicates the header's VS chooser and BYTT. Decide whether it stays.
  - [ ] **Logo states:** the dot-matrix logo pulses while the current season
        is `upcoming` and blinks while `live` (from `SeasonMeta.status`). A
        "just crowned" state waits on structured season dates.

- [ ] **"Just finished" scene:** a special front-page scene for the days
      after a final, where the new champion's name is engraved into the
      trophy (Jakob, 2026-10-14). Probably a completely different trophy
      style from the everyday hero, just for that scene. The engraving did not
      work inside the Lysbrudd hero and was removed there; the prototypes'
      laser-cut and 3D engraving experiments are in git history and the
      working doc. Needs structured season dates to know when it applies.
- [ ] **Front page (/):** IN REFINEMENT — everything about it is open again
      (Jakob, 2026-10-14). The top fold must be visually striking: the trophy
      backlit with light breaking through it (Lysbrudd, chosen over 3D in
      round 2), the winners' names laser-cut through the plaque. The rest of
      the page's content and structure is to be workshopped; the PO's
      candidate list for that workshop is in
      `working-docs/front-page-candidates.md`. Synthesis,
      prototypes and ranked open questions: `working-docs/front-page-and-nav.md`.
- [x] ~~**The Hall (/):**~~ **DROPPED** — absorbed into /records (the all-time
      career leaderboard becomes the headline board there) + the front page
      (champion hero). In a world with front page + player pages + /records, a
      separate Hall had no distinct job. (The directions doc this came from was
      deleted when /records and /vs shipped; it is in git history.)
- [x] **/records (Hall of Records):** BUILT and reviewed, `src/app/records/`. Three parts:
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
  - Deferred at first, then cut by Jakob (2026-10-14): biggest
    season-over-season climb (it has happened once); a runner-up column on
    the crowns table.
  - Would need round-level data (`round`/`round_result`, not fetched yet):
    rounds won in games the player did not win; largest share of the field's
    combined score in one game; share of individual rounds won (one player
    sweeps it). Not worth the fetch for one plate.
  - Not possible from the data: who targets whom with curses (every
    power-up affects its own user); team/duo records (team composition in
    the one 2v2 game is not stored).

  Closed out (nothing is left on the page itself; linking to it is the "Site
  navigation" item):
  - [x] **Copy.** Jakob's pass is done on the page (2026-10-13), including
        the "Vis flere" disclosure labels and caption in `UnrankedRows`
        (shared with the career page).
  - [x] **Phone review.** Jakob has looked at it on mobile (2026-10-14): it
        looks good.
  - [x] **One popover for the whole site** (2026-10-14). The three
        near-identical popover stylesheets (`GamePointsMatrix`,
        `GameListPopover`, `RecordPlate`) and the trophy shelf's fourth are
        gone: every popover is now the `Popover` primitive
        (`src/components/Popover.tsx` + `Popover.module.css`), and every list
        inside one is `RecordLines`, styled by the same stylesheet. So a
        popover opens, positions and reads alike on the season page, the
        career page, /records and /vs: 13px rows (title in the text face,
        season and figure in mono), a 12px mono heading. Triggers differ only
        by `tone` (`word`, `accent`, or `none` for the boxed trophy).

- [x] **/vs/[a]/[b] (Head-to-head pages):** BUILT (2026-10-13/14),
      `src/app/vs/[a]/[b]/`; reviewed by Jakob, copy included. What is left is
      under "Follow-ups" at the end of this item. One page per ORDERED pair:
      the first slug is the left-hand side, so /vs/x/y and /vs/y/x are two pages
      (decision: it lets a page have a "protagonist" — arriving from your own
      career page puts you on the left). Every figure is over what the two shared
      (games both played, seasons both finished, matches against each other),
      never over either career. Decisions came from a product-owner + designer
      sparring pass, then Jakob's calls.
  - **Masthead (`PairHero`)** — names at the outer edges, the two portraits
    meeting in the middle across one accent diagonal (the page's only "vs"),
    and the headline reading along the foot: **games finished ahead** (Jakob's
    call: finished-ahead first, match record second). Games placed level are
    counted separately and shown only when there are any. Each side — name
    and portrait together — is ONE link to that player's career page;
    hovering anywhere on a side brings its portrait's colour back and turns
    its name accent (the portrait's clip-path is also its hit area).
  - **Game by game (`PairTrace`)** — every shared game in play order, one
    block per season: a column per game with side a's final placement above a
    hairline and side b's below it. The placement that finished ahead is
    strong (plain text colour, medium weight), the other muted; level games
    leave both muted. A game win is deliberately NOT told apart from any other
    game finished ahead, and nothing is accent (Jakob's call, 2026-10-14).
    Each block ends in the season's tally, which opens the games. Replaced a
    first version that drew a tick above or below a line per game, with height
    for the placement gap — it was too hard to read.
  - **The balance, in three groups of `PairRow` cells** (Jakob's split,
    2026-10-14 — it was one "Balanse" wall before):
    - _Matches_ — H2H matches won (one match counts as one whatever its length
      — decision — with one smaller axis per series length, "best of 1/3/5",
      centred underneath as sub-parts (`PairMini`)), and the longest run of
      match wins each way plus the current run (needs 3 matches). The whole
      group is hidden when the pair never met in a match.
    - _Games_ — games finished ahead (the masthead's reading again, on
      purpose, here with a popover of every shared game); the longest run of
      games finished ahead each way plus the current run (a level game breaks
      a run); and who finished ahead split by whose pick the game was (three
      `PairMini`s).
    - _Seasons_ — seasons finished ahead, with the seasons table in the same
      frame: per shared season, both final placements and both points totals.
      A season won (1st) is accent. The frame closes with mirrored
      `PairMoment` plates, one per side: that player's best season against the
      other (the largest points margin in a season they finished ahead in).
      Both plates always show: a side that never finished a season ahead
      gets the plate with a muted dash (Jakob's call, 2026-10-14 — it was
      omitted silently before). The figure is accent, as on a record plate.

    A "who won when the two took first and second" row was built and removed
    by Jakob as unintuitive — don't re-propose it.

  - **Categories** — per tag, who finished ahead over the shared games under
    it, most level first; `MIN_RANKED_GAMES` applies to the shared games, the
    rest fold into `UnrankedRows` (muted, and still with a needle). The names
    and their popover are set like the career page's category table: the name
    is a `GameListPopover` trigger (text face, semibold when ranked), and the
    panel lists each game with both placements ("2–4", via a new optional
    `opponentPlacement` on its results). A pair's rows are never accent — no
    red "1". The pick-split labels and the best-of labels open the same
    panel (for the best-of ones the two figures are the series score).
  - **No separate "moments" section** (removed by Jakob, 2026-10-14). It
    held the best-season plates, now in the Seasons group, and two "longest
    run ahead" plates, cut because they repeated the Games group's run row.
  - **Pair switcher** — plain links to each side's other pairs.

  **The comparison grammar:** one reading on a shared axis, never two columns.
  Both figures share a colour and weight; a needle on a hairline gauge leans
  toward whoever has more (centre when level). Every gauge has its needle,
  whatever the sample: a first version hid it under 3 decided games, and the
  bare axis read as a bug. Nothing accents "the leader" — in a lopsided
  pairing that would paint one side top to bottom. Counts, never percentages.

  **Red on the page** (Jakob's rule of thumb, 2026-10-14: every screenful
  should have some): the masthead diagonal; every gauge needle (it marks the
  reading, not a player); season wins in the seasons table; and the
  best-season figures. Still never the figure of whoever is ahead, and the
  figures inside the /vs popovers are plain too (a red "1" there was removed
  by Jakob, 2026-10-14).

  **Entry points:** the career page's head-to-head list (`PairSummaryList`,
  one row per opponent linking to that pair, replacing the cut "Rivaler"
  section); the two pair plates on /records ("Lengste tak på motstander",
  "Jevneste rivaleri"), whose names are one link to the pair ("Jørgen på
  William", "Jakob – Tobias" — `RecordPlate`'s `pairLink`, for the holder and
  the runners-up alike) instead of a link per player; and the switcher. No /vs
  index yet. (A "Se oppgjøret" link in the plates' footer row came first and
  was removed by Jakob, 2026-10-14.)

  **Data layer:** `derive/pair.ts` (`derivePair`, pure, reads the same joined
  rows as the records) → `composePairView` / `composePairSummaries` →
  `getPairView(a, b)`, `getPairSummaries(slug)`, `getAllPairSlugs()`.
  Unit-tested against the S1+S2 oracle (`pair.test.ts`). No new fetch or
  storage.

  Follow-ups:
  - [x] **Copy.** Reviewed and rewritten by Jakob (2026-10-14): the whole /vs
        page, the career page's head-to-head list, and the two pair plates on
        /records. No `TODO(copy)` marker is left anywhere in `src/`. The
        labels quoted in this item are descriptions, not the live strings —
        read the code for those.
  - [x] **Jakob's review of the page** (2026-10-14): the masthead links,
        the game-by-game block, the sub-axes, the removed one-two row, the
        three balance groups, the needle on every gauge, and the moments
        section folded into Seasons. The needle leaning toward the leader
        (rather than a share bar) is confirmed. The two "longest run" rows
        deliberately have no popover — the game-by-game block above shows the
        runs.
  - [x] **Hover tint — tried and dropped (2026-10-14).** An accent duotone on
        hover (an accent layer multiplied over the greyscale portrait, masked
        by the image) replaced the colour-on-hover on the /vs masthead for one
        round. Jakob: it does not really work. Both /vs and the player index
        restore the photo's own colour on hover. Don't re-propose it.
  - [x] **Popover stylesheet.** Done: /vs uses the site-wide `Popover`
        (see the note under /records).
  - [x] **Screen readers** (2026-10-14, a light pass): the game-by-game grid
        stays hidden from assistive tech, but each season now carries a
        visually hidden list naming every game with both placements; an empty
        best-season plate reads "Ingen" rather than a bare dash.
  - [ ] **Diagonal portrait.** `PairHero` and `PlayerRoster` each draw the
        clipped greyscale portrait and its diagonal hairline; extract a shared
        primitive if a third use appears.
  - [ ] **Later:** a /vs index (a small matrix of all pairs), per-match
        scorelines, an OG image. Cut by decision: finals/deciders between the
        two (samples of one to three), round-level stats, power-up stats,
        percentages, "nemesis"-style labels.
  - [x] The temporary working docs `records-vs-hall-directions.md` and
        `cross-season-normalization.md` were deleted (2026-10-14), as their
        own headers asked once /records and /vs shipped.

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
- [x] **H2H widget on player pages:** BUILT with /vs as the career page's
      head-to-head list (`PairSummaryList`).
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
