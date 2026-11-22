# Gamernes Gamer — Plan

Open work, and what was decided against so it isn't re-proposed. What the
site is for: `.claude/rules/product.md`.

**Done:** Phases 1–4 (Next.js rewrite, VERKSTED rebrand, Supabase + auth +
admin, S1–S4 on prod, and the historical content and stats).

---

## Phase 5 — Live tournament mode

- [ ] Live leaderboard on the season page (polling, no WebSockets).
- [ ] **Results entry in /admin** (scores per player per game, during the
      tournament): needs an architect + UX pass against the real live-entry
      workflow (H2H matches and round scores differ). Every page is static,
      so its actions call `revalidateSite()` (`src/lib/revalidate.ts`).
- [ ] Review/edit submitted results; flip `confirmed` to publish.
- [ ] **How a new season reaches prod:** `seed.sql` is local-only (it
      deletes and re-inserts seasons 1–4, and refuses to run on prod), so a
      new season's rows need another path, e.g. /admin or a data migration.
      Decide before Phase 5.
- [ ] **Backups:** the free plan has none. Set up a regular data dump of
      prod (`supabase db dump --linked --data-only`) kept outside the repo,
      or move to a plan with daily backups before the tournament.
- [ ] **Preview deploys write to prod:** Vercel previews share the prod
      database, so /admin on a preview edits real data. Decide whether
      previews get their own project or stay read-only.
- [ ] **What's at stake:** beside the live leaderboard, the streaks and
      records the next game could extend or break. Next game only, not the
      whole season. Needs a current-streak derivation.

## After Phase 5

- [ ] **Season recaps (Jakob):** an editorial title and paragraphs per
      season, in its `meta.ts` (`recap`). Nothing shows until one is written.
- [ ] **Final hero portraits (Jakob, waiting on the players):** replace the
      placeholders in `public/images/heroes/<slug>.png` (copies of earlier
      card art; a new player needs one, or their pages have no picture), then
      revisit the player index's top crop.
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

## Review passes (after the main phases)

- [ ] **Cache Components** (after all feature work): `'use cache'`, static
      shell with dynamic holes, tagged refreshes. A migration of every route,
      so its own planned piece of work.
- [ ] **Instant navigation** on the deployed site: prefetching, that pages are
      really static, per-route client weight, `<img>` vs `next/image` (the
      lint rule is off in `eslint.config.mjs` until then).

## In case

- **Timestamped moments** in long videos, if cutting separate clips proves
  too much editing work: a nullable `start_seconds` on a media item, so
  several items share one video (the S2 aftermovie as linkable moments).

---

## Decided against (don't re-propose)

Visual "tried and dropped" items are in design.md.

**Site-wide**

- A separate Hall page (absorbed into /records and the front page).
- Pair pickers outside /vs: the header's VS chooser and the pair hero are
  the only two.
- A shared diagonal-portrait primitive for `PairHero` and `PlayerRoster`,
  until a third use appears.
- A configurable just-crowned window: marking a season finished is enough.
- WebSockets (polling is enough); a CMS or multi-editor tooling (/admin is
  the ceiling). Predictions/picks: far future at most.

**Gamer cards**

- LISENS (race-licence card) and PLATE (anodised aluminium): too far from
  TCG cards.
- Different backs per variant (TCG cards share one back); graded slabs;
  thicker stock; age wear; print-ready exports from the start.
- Card data from the DB; gyroscope tilt.
- Parallax between layers: a real card is flat, so only light moves on it.
- Clear (acetate) stock: the base card is black stock.
- Holo or gloss patterns on the back: it is matte black with a satin-black
  logo.
- A compact card size: one target size only.
- Tried and dropped: gloss vs matte (spot gloss, a reflection band), a
  blind-debossed season figure, an inner keyline, instrument ticks and a
  needle on the gauges, the portrait fading into the panel, and MESTER
  layout shapes (a black corner; shaped panel edges).
- A flavour line per card; a season set symbol.
- Derived card numbers (overall change, title count): every printed number
  is entered by hand, so a card stands alone.

**Front page**

- Player and season lists at the bottom: they repeat the header's choosers.
  If dormant feels thin, fix the dormant state.
- "What is on the line" in the upcoming slot (speculation weeks ahead).
- A reveal-count row under the countdown; per-item reveals (the category is
  the unit).
- Card backs as an empty slot with an LED, or the pixel logo on every tile.
- Lineup as redacted spec sheets with a "forseglet" stamp: it uses the
  season page's cards.

**Player index**

- More figures than titles and average placement: it is a list, not a second
  leaderboard.

**Career page**

- The season record as a chart (reads emptier than the numbers at ~4 seasons).

**Season page**

- Superscript power-up deltas in the matrix (totals looked inflated).
- Season moments beyond power-ups and records (biggest haul, most dominant
  win, lead changes, biggest comeback).
- In the power-up effect: the biggest single swing, and a verdict line on
  who'd have had the most without power-ups (the table already says it).

**Game page**

- Links to the same title in other seasons: game pages stay per-season.
- A "rematch" tag on a pair's second meeting in a stage (read as a replay
  overwriting the first).
- A one-round table for games entered as placements (it repeats the
  standings); only a measured score (gold, altitude) gets one.
- Scores, ladder points or power-up points as standings columns: the
  standings show the total, and its popover splits out the power-ups.
- Placement rounds shown as positions (1., 2.): a column of 1s summing to 20
  reads wrong; the stored 4..1 is easy to read.

**/records**

- Roast / "worst at" records (one player would hold them all); most
  championships or best average as plates (they are board columns); a
  consolation plate; a plate per category crown (mostly the same two names).
- "Closest to a title" (slow, said little).
- Biggest comeback to a title; seasons led without winning; season-deciding
  power-ups; fastest to five wins; the H2H rock-paper-scissors cycle; card
  stats vs. results; biggest season-over-season climb; a runner-up column on
  the crowns table.
- Records needing round-level data: not worth the fetch.
- Not possible from the data: who curses whom (every power-up affects its
  user); team/duo records (2v2 teams are not stored).
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
