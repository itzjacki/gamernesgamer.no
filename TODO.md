# Gamernes Gamer — Plan

Open work, and what was decided against so it isn't re-proposed. Finished
items collapse to one line or go.

## Vision

A permanent monument and celebration of the tournament. Primary value:
post-tournament (reminiscing, stats, history, "remember when"). Secondary:
live tracking during the event. The group chat stays the social hub; the site
produces artifacts that feed into it.

## Done

Phases 1–3 (Next.js rewrite, VERKSTED rebrand, Supabase + auth + admin,
S1–S4 seeded on prod). Phase 4 so far: season, game and career pages, the
indexes, titles and tags, /records, /vs, the site header, the front page
with its trophy hero, the share (OG) images, the design audit and the content
centre (shipping steps below).

---

## Phase 4 — Historical content & stats 🚧

### 1. Cards part 1

Cards as physical TCG cards, exempt from design.md's rules (see its "Gamer
cards"). Built as one family: a variant is a type code in the serial plus a
skin (`card-types.ts`), not a new component. Card data is content in code
(`src/data/sesong/<NN>/cards.ts`), never the DB.

Live on the season page, the lineup and the career gallery; a sealed card
(unrevealed season) shows only the back. `/kort` shows every card; linking
it is in Navigation below.

### 2. Content centre

Built: media in the DB, edited at `/admin/content`; shown on the season, game,
career and /vs pages, `/content` and "Dagens content".

- [ ] **Deploy:** the migration and the day-one media are on prod; the code
      isn't yet.
- [ ] **Check on a preview deploy:** after a media save, hero and champion art
      still resolve. `existsSync(public/…)` in `queries.ts`,
      `ChampionSideBlock` and the season page ran only at build time before
      on-demand revalidation. If it falls back, move those lookups onto a
      build-time manifest like `scripts/media-manifest.mjs`.
- [ ] The 8 S2 game intros sit on personal channels: re-upload them to the
      GG channel so they can't disappear.

### 3. Season page upgrade

More per-season views, stats and content; scoped when we start.

- [ ] **Season recap:** an editorial title and short recap per season, if the
      writing is realistic.
- [ ] **Superlatives:** the season's standout moments (highest score, most
      dominant game win, power-up impact from each `powerUpUse`). All-time
      bests stay on /records; don't repeat its plates. When a season's
      moment is also the all-time record, say so and link to /records.

### 4. Navigation

One pass over the header for the pages phase 4 added, with Jakob's other
nav fixes.

- [ ] **`/kort`:** no header key yet.
- [ ] **`/content`:** no header key; only Dagens links to it.

### Decided against (don't re-propose)

Visual "tried and dropped" items are in design.md.

**Site-wide**

- A separate Hall page (absorbed into /records and the front page).
- A /vs index or any per-page pair picker: the header's VS chooser is the one
  pair picker.
- A shared diagonal-portrait primitive for `PairHero` and `PlayerRoster`,
  until a third use appears.
- A configurable just-crowned window: marking a season finished is enough.

**Gamer cards**

- LISENS (race-licence card) and PLATE (anodised aluminium): too far from
  TCG cards.
- Different backs per variant (TCG cards share one back); graded slabs;
  thicker stock; age wear; print-ready exports from the start.
- Card data from the DB; gyroscope tilt.
- Parallax between layers: a real card is flat, so only light moves on it.
- Clear (acetate) stock: the base card is black stock.
- Holo on the back, and gloss patterns on it (rays, rings, guilloche,
  pinstripe, dots): the back is a matte black with a satin-black logo.
- A compact card size: one target size only.
- Tried and dropped: gloss vs matte (spot gloss, a reflection band), a
  blind-debossed season figure, an inner keyline, instrument ticks and a
  needle on the gauges, the portrait fading into the panel, and MESTER
  layout shapes (a black corner; wedge, peak, arc, shoulder or sawtooth
  panel edges).
- A flavour line per card; a season set symbol.
- Derived card numbers (overall change, title count): every printed number
  is entered by hand, so a card stands alone.

**Front page**

- Player and season lists at the bottom: they repeat the header's choosers.
  If dormant feels thin, fix the dormant state.
- "What is on the line" in the upcoming slot (speculation weeks ahead).
- A reveal-count row under the countdown.
- Per-item reveals: the category is the unit.
- Card backs as an empty slot with an LED, or the pixel logo on every tile.
- Lineup as spec sheets with ink-bar redactions and a "forseglet" stamp (wrong
  feel; it uses the season page's cards).

**Player index**

- More figures than titles and average placement: it is a list, not a second
  leaderboard.

**Career page**

- The season record as a chart (reads emptier than the numbers at ~4 seasons).

**Season page**

- Superscript power-up deltas in the matrix (totals looked inflated).

**Game page**

- Links to the same title in other seasons: game pages stay per-season.
- A "rematch" tag on a pair's second meeting in a stage (read as a replay
  overwriting the first).
- A one-round table for games entered as placements (it repeats the
  standings); only a measured score (gold, altitude) gets one.
- Scores, ladder points or power-up points as standings columns (confusing):
  the standings show the total, and its popover splits out the power-ups.
- Placement rounds shown as positions (1., 2.): a column of 1s summing to 20
  reads wrong; the stored 4..1 is easy to read.

**/records**

- Roast / "worst at" records (one player would hold them all); most
  championships or best average as plates (they are board columns); a
  consolation plate.
- "Closest to a title" (slow, said little).
- Biggest comeback to a title; seasons led without winning; season-deciding
  power-ups; fastest to five wins; the H2H rock-paper-scissors cycle; card
  stats vs. results; biggest season-over-season climb; a runner-up column on
  the crowns table.
- Records needing round-level data: not worth the fetch.
- Not possible from the data: who curses whom (every power-up affects its
  user); team/duo records (2v2 teams are not stored).
- A plate per category crown (mostly the same two names).
- Points-tie win rate counts season ties only, not game-level tiebreaks.

**Content centre**

- File uploads, an asset pipeline, or a visual image picker: images ship in
  the repo and /admin lists them.
- Drafts, a `published` flag or reveal gating: intros are added after the
  tournament.
- Weighting Dagens content by kind: mostly intros is honest.
- Greyscale media thumbnails (uninviting to click); durations on tiles;
  `maxresdefault` thumbnails (not guaranteed to exist).
- An `other` kind (a new kind is a migration); per-item pages (`/content#m-<id>`
  is the item's address).

**/vs**

- A "who won when the two took first and second" row.
- A "moments" section or "longest run ahead" plates (repeat the run row).
- Finals/deciders between the two (samples of 1–3), round-level stats,
  power-up stats, percentages, "nemesis" labels.
- Popovers on the "longest run" rows (the game-by-game block shows them).

---

## Phase 5 — Live tournament mode

- [ ] Live leaderboard on the season page (polling, no WebSockets).
- [ ] **Results entry form** (scores per player per game): needs an
      architect + UX pass against the real live-entry workflow (H2H matches
      and round scores differ). Every page is static, so its actions call
      `revalidateSite()` (`src/lib/revalidate.ts`).
- [ ] **The seed vs. admin-entered data:** `seed.sql` deletes and
      re-inserts seasons 1–4, so it can't own prod once results are entered
      in /admin. It also no longer re-runs over itself: deleting a season
      trips `match_player_a_fkey` (RESTRICT). Decide how a new season is
      seeded before Phase 5.
- [ ] Review/edit submitted results; flip `confirmed` to publish.
- [ ] Real-time score entry in the admin panel during the tournament.
- [ ] **What's at stake:** beside the live leaderboard, the streaks and
      records the next game could extend or break. Next game only, not the
      whole season. Needs a current-streak derivation.

---

## After Phase 5

- [ ] **Final hero portraits (Jakob, waiting on the players):** replace the
      placeholders in `public/images/heroes/<slug>.png` (copies of earlier
      card art; a new player needs one, or their pages have no picture), then
      revisit the player index's top crop. Not a blocker.
- [ ] **Cards part 2:** more card styles (moments: MVP, record-breaker, "the
      collapse"), FIFA-style shareable gamer cards, a place to view all
      cards; maybe a collection, a pack simulator, physical cards. Sealed
      cards and the reveal belong with the packs; video portraits later; the
      champion's points in a hidden spot on the MESTER card (e.g. its etch).
- [ ] **Engraving scene** for just crowned: the new champion's name engraved
      into the trophy, the winner's special animation.
- [ ] **Signal lights along the angular lines:** small lights shooting along
      the gamer-card diagonal, grid rules and hairlines; a sparing site-wide
      timing-board pulse, monochrome or single-accent, honouring reduced
      motion. (An on-load sweep on `/spillere` alone didn't carry its weight.)

---

## Review passes (after the main phases)

- [ ] **Cache Components** (after all feature work): `'use cache'`, static
      shell with dynamic holes, tagged refreshes. A migration of every route,
      so its own planned piece of work.
- [ ] **Instant navigation** on the deployed site: prefetching, that pages are
      really static, per-route client weight, `<img>` vs `next/image` (the
      lint rule is off in `eslint.config.mjs` until then).

---

## Cut / far future

- Predictions/picks: far future.
- Comments, reactions, notifications: cut (the group chat is the social layer).
- WebSockets: polling is enough.
- Public user accounts: none, admin only.
- CMS or multi-editor tooling: the /admin panel is the ceiling.

---

## In case

- **Timestamped moments** in long videos, if cutting separate clips proves
  too much editing work: a nullable `start_seconds` on a media item, so
  several items share one video. That would turn the S2 aftermovie into
  linkable moments.
