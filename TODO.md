# Gamernes Gamer — Plan

Open work, and what was decided against so it isn't re-proposed. What is built
is in the code; how it fits together is in `.kiro/steering/`. Finished items
collapse to one line or are deleted (git history has the detail).

## Vision

A permanent monument and celebration of the tournament. Primary value:
post-tournament (reminiscing, stats, history, "remember when"). Secondary:
live tracking during the event. The group chat stays the social hub; the site
produces artifacts that feed into it.

## Open questions

- **Editorial appetite:** season recaps, "how it went down" blocks and
  Skattkammeret lore need written content from Jakob. Their scope depends on
  how much curation is realistic.
- **Media volume:** dozens or hundreds of videos, images, memes? Decides
  whether /lore is a data file or needs an asset pipeline.

## Done

Phases 1–3 (Next.js rewrite, VERKSTED rebrand, Supabase + auth + admin
panel, S1–S4 seeded on prod). In Phase 4: season pages, player career pages
and index, the title/tag layer, /records, /vs, the site header, the season
index, structured season dates, and the front page except one block.

---

## Phase 4 — Historical content & stats 🚧

### Where we left off (2026-10-23)

The front page is built except one block and awaits Jakob's review at `/`
(`?tilstand=upcoming|live|justCrowned|dormant` previews each state). Details:
`working-docs/front-page-and-nav.md`.

1. **Jakob reviews `/`** in all four states, desktop and phone.
2. **What is on the line** (the upcoming state's slot): Jakob decides the
   "within reach" rules, then build it (needs a current-streak derivation).
   Proposal: an active streak by a player on the coming roster counts if it
   is at least half the record or within 3 of it; count records (game wins,
   titles) if someone is within 2 of the holder or one win from tying a
   title count; rates and averages left out.
3. **Content of the day:** decide what it rotates (clips, photos, a past
   game…) and where the content comes from.
4. **Open design points:** the champion photo crop (the footer cuts it at the
   chin); accent text contrast (`--color-accent` is 4.23:1 on `bg`, so small
   accent figures miss AA site-wide — needs a token or size decision).
5. **Copy:** every front-page label is a bracketed `TODO(copy)` placeholder.
6. **Remove the wireframe switcher** and `?tilstand=` once every block is real
   (`/` is rendered per request until then).
7. **Trophy hero** (deferred, a fair amount of work; list in the working doc),
   then the **engraving scene** for "just crowned" (the new champion's name
   engraved into the trophy; probably a different trophy treatment).

### Open items

- [ ] **Copy (`TODO(copy)`):** the season index (headings, status stamps,
      plate labels) and the site header's labels.
- [ ] **Season index:** Jakob's visual review.
- [ ] **"Just crowned" window** (6 weeks after `end`, shared by the logo
      state and the front page): later configurable in the admin panel.
- [ ] **Manual images (Jakob)** — pages fall back to card art until they exist:
  - champion cutouts, `public/images/champions/<NN>.png`;
  - hero portraits, `public/images/heroes/<slug>.png` (then revisit the
    player index's top crop);
  - season photos, `public/images/seasons/<NN>.jpg` (about 2:1).
- [ ] **Career-stat OG card:** deferred until hero portraits exist, since the
      final hero art may change the shape the card mirrors.
- [ ] **Diagonal portrait:** `PairHero` and `PlayerRoster` each draw the
      clipped greyscale portrait and its diagonal; extract a primitive only if
      a third use appears.
- [ ] **/vs later:** per-match scorelines, an OG image.
- [ ] **Season pages — feature expansion (end of Phase 4):** the "go deeper"
      pass (more per-season views, stats, content), scoped at that point.

### Strong ideas

- [ ] **Season recaps:** editorial title + short recap per season. Gated on
      editorial appetite.
- [ ] **Season superlatives:** highest score, most dominant win, etc. per
      season. Candidate: a "power-up impact" superlative (net power-up points
      per player across the season); the composed data already carries every
      `powerUpUse`. This is the home for the season-level power-up story, not
      a popover on the matrix's totals row.
- [ ] **Champion card treatment:** a special variant for the season winner.
- [ ] **Attached media on game/season pages:** clips, screenshots, memes.
- [ ] **Gamer-card redesign** (see design.md, "Deferred").

### Explore later

- [ ] **Collectible card expansion:** moment cards (MVP, record-breaker, "the
      collapse").
- [ ] **OG/shareable images:** champion card, podium, player stat cards via
      Vercel OG.
- [ ] **Skattkammeret (/lore):** floating wall of videos, memes, lore. Scope
      depends on media volume.

### Decided against (don't re-propose)

Visual "tried and dropped" items are in design.md.

**Site-wide**

- A separate Hall page: absorbed into /records (career board) and the front
  page.
- A /vs index, the /vs masthead as a picker, or any per-page pair picker or
  "other pairs" links: the header's VS chooser is the one pair picker.

**Player index (`/spillere`)**

- More figures than titles and average placement: it is a player list, not a
  second leaderboard.

**Career page**

- The season record as a chart: at about four seasons a line chart reads
  emptier than the numbers.

**Season page**

- Superscript power-up deltas in the matrix (made totals look inflated); the
  per-cell popover replaced it.

**/records**

- Roast / "worst at" records (one player would hold them all); most
  championships or best average as plates (they are board columns); a
  consolation plate for a player who holds none.
- "Closest to a title" (built, removed: slow and said little).
- Biggest comeback to a title; seasons led without winning; season-deciding
  power-ups (season page material); fastest to five wins; the H2H
  rock-paper-scissors cycle; card stats vs. results; biggest
  season-over-season climb; a runner-up column on the crowns table.
- Records needing round-level data (rounds won in games not won, share of the
  field's score, share of rounds won): not worth the fetch for one plate.
- Not possible from the data: who targets whom with curses (every power-up
  affects its own user); team/duo records (2v2 composition is not stored).
- A plate per category for the crowns: a wall of crowns would mostly repeat
  the same two names.
- Points-tie win rate counts season ties only, not game-level tiebreaks.

**/vs**

- A "who won when the two took first and second" row (unintuitive).
- A separate "moments" section, or "longest run ahead" plates (they repeated
  the Games group's run row).
- Finals/deciders between the two (samples of one to three), round-level
  stats, power-up stats, percentages, "nemesis"-style labels.
- Popovers on the two "longest run" rows: the game-by-game block shows the
  runs.

---

## Phase 5 — Live tournament mode

- [ ] Live leaderboard on the season page (polling, no WebSockets).
- [ ] **Results entry form** (scores per player per game): schema-heavy;
      needs an architect + UX pass (H2H match games vs. round scores differ).
      Design it against the real live-entry workflow.
- [ ] Review/edit submitted results; flip `confirmed` to publish.
- [ ] Real-time score entry in the admin panel during the tournament.

---

## Ambient polish (post-Phase 5, exploratory)

- [ ] **"Signal lights" along the angular lines.** Small bright lights that
      shoot along the site's existing angular lines (the gamer-card diagonal,
      grid rules, panel hairlines) as a sparing, site-wide motion motif — a
      timing-board pulse, not per-element decoration. Must stay monochrome or
      single-accent, honour reduced motion and read as purposeful. (An on-load
      "arming" sweep on `/spillere` was tried and removed: it didn't carry its
      weight alone.)

---

## Review passes (after the main phases)

- [ ] **Instant navigation.** Check that moving between pages feels instant on
      the deployed site, not just in dev. If not: check prefetching, that pages
      are really static, and each route's client weight (the header's client
      half, images). Includes `<img>` vs `next/image` (the lint rule is off
      in `eslint.config.mjs` until then).
- [ ] **Design audit.** Does the site follow VERKSTED clearly, and does
      VERKSTED (design.md, "indie high performance") still express a permanent
      monument (product.md)? Where not, change the design language, not just
      the pages. Known leads:
  - **The dark display colour** (`--color-display`): try it beyond the header,
    e.g. for readouts or key figures.
  - **Spacing:** almost every section has a large gap around it; use spacing
    more deliberately.

---

## Cut / far future

- **Predictions/picks:** far future.
- **Comments, reactions, notifications:** cut — the group chat is the social
  layer.
- **WebSockets:** polling is enough.
- **Public user accounts:** none. Admin access only.
- **CMS or multi-editor tooling:** the /admin panel is the ceiling.
