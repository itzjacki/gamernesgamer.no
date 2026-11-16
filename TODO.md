# Gamernes Gamer — Plan

Open work, and what was decided against so it isn't re-proposed. Finished
items collapse to one line or go.

## Vision

A permanent monument and celebration of the tournament. Primary value:
post-tournament (reminiscing, stats, history, "remember when"). Secondary:
live tracking during the event. The group chat stays the social hub; the site
produces artifacts that feed into it.

## Open questions

- **Editorial appetite:** season recaps, "how it went down" blocks and
  Skattkammeret lore need written content from Jakob; their scope depends on
  how much curation is realistic.
- **Media volume:** dozens or hundreds of videos, images, memes? Decides
  whether /lore is a data file or needs an asset pipeline.

## Done

Phases 1–3 (Next.js rewrite, VERKSTED rebrand, Supabase + auth + admin,
S1–S4 seeded on prod). Phase 4 so far: season, game and career pages, the
indexes, titles and tags, /records, /vs, the site header, and the front page
with its trophy hero.

---

## Phase 4 — Historical content & stats 🚧

### Open items

- [ ] **Season index:** Jakob's visual review.
- [ ] **"Just crowned" window** (6 weeks after `end`, shared by the logo and
      the front page): later configurable in the admin panel.
- [ ] **Manual images (Jakob)** — pages fall back to card art until they exist:
      champion cutouts (`champions/<NN>.png`), hero portraits
      (`heroes/<slug>.png`; then revisit the player index's top crop), season
      photos (`seasons/<NN>.jpg`, about 2:1).
- [ ] **Career-stat OG card:** waits for hero portraits, which may change the
      shape the card mirrors.
- [ ] **/vs later:** per-match scorelines, an OG image.
- [ ] **Season pages — "go deeper" pass** (end of Phase 4): more per-season
      views, stats, content; scoped then.

### Front page — later

- **Engraving scene** for just crowned: the new champion's name engraved into
  the trophy.
- **Countdown in the scene** (upcoming): the numerals part of the hero, not
  type laid over it.
- **Trophy silhouette:** a scan of the real trophy (Jakob can scan it) to
  replace `trophy.svg`?
- **Content of the day:** what it rotates and where the content comes from.
  Waits for the content work; a placeholder until then.
- **Accent text contrast:** `--color-accent` is 4.23:1 on `bg`, so small
  accent figures miss AA site-wide. Needs a token or size decision.

### Strong ideas

- [ ] **Season recaps:** editorial title + short recap per season (gated on
      editorial appetite).
- [ ] **Season superlatives:** highest score, most dominant win, etc. A
      "power-up impact" superlative (net power-up points per player) belongs
      here; the composed data already carries every `powerUpUse`.
- [ ] **Champion card treatment:** a special variant for the season winner.
- [ ] **Attached media on game/season pages:** clips, screenshots, memes.
- [ ] **Gamer-card redesign:** the prime candidate for a visual centrepiece
      (chrome highlights tracking the tilt, material surfaces); the current SVG
      shape limits it. When a feature calls for it.

### Explore later

- [ ] **Moment cards:** MVP, record-breaker, "the collapse".
- [ ] **OG/shareable images:** champion card, podium, player stat cards.
- [ ] **Skattkammeret (/lore):** a wall of videos, memes, lore; scope depends
      on media volume.
- [ ] **What's at stake (live, Phase 5):** streaks and records the next game
      could extend or break, beside the live leaderboard. Needs a
      current-streak derivation.

### Decided against (don't re-propose)

Visual "tried and dropped" items are in design.md.

**Site-wide**

- A separate Hall page (absorbed into /records and the front page).
- A /vs index or any per-page pair picker: the header's VS chooser is the one
  pair picker.
- A shared diagonal-portrait primitive for `PairHero` and `PlayerRoster`,
  until a third use appears.

**Front page**

- Player and season lists at the bottom: they repeat the header's choosers.
  If dormant feels thin, fix the dormant state.
- "What is on the line" in the upcoming slot (speculation weeks ahead; see
  "What's at stake").
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

**/vs**

- A "who won when the two took first and second" row.
- A "moments" section or "longest run ahead" plates (repeat the run row).
- Finals/deciders between the two (samples of 1–3), round-level stats,
  power-up stats, percentages, "nemesis" labels.
- Popovers on the "longest run" rows (the game-by-game block shows them).

---

## Phase 5 — Live tournament mode

- [ ] Live leaderboard on the season page (polling, no WebSockets).
- [ ] **Results entry form** (scores per player per game): needs an architect + UX pass against the real live-entry workflow (H2H matches and round
      scores differ). Every page is static, so its actions must
      `revalidatePath` each page the data shows on: `/`, season and game
      pages, career pages, `/records`, `/vs`.
- [ ] Review/edit submitted results; flip `confirmed` to publish.
- [ ] Real-time score entry in the admin panel during the tournament.

---

## Ambient polish (post-Phase 5)

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
- [ ] **Design audit:** does the site follow VERKSTED, and does VERKSTED
      still express a permanent monument? Change the language, not just pages.
      Leads: `--color-display` beyond the header (readouts, key figures);
      more deliberate spacing (almost every section has a large gap).

---

## Cut / far future

- Predictions/picks: far future.
- Comments, reactions, notifications: cut (the group chat is the social layer).
- WebSockets: polling is enough.
- Public user accounts: none, admin only.
- CMS or multi-editor tooling: the /admin panel is the ceiling.
