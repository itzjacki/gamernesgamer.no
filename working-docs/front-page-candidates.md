# Front page — candidate inventory for the content workshop

Status: **input for the workshop (prepared 2026-10-14), nothing decided.**
Companion to `working-docs/front-page-and-nav.md`. Jakob sorts every
candidate into **must / maybe / no** and orders the musts; prototyping comes
after that.

> **Update 2026-10-15:** the hero no longer names anyone. The engraved names
> were removed from the plaque, and the engraving moved to a separate "just
> finished" scene (TODO.md). Wherever an entry below counts "the plaque" as
> one of the places that already names the champion (B1, C3, X4 and others),
> that overlap no longer exists. The hero is Lysbrudd: Lag + Støv.

Settled going in: the top fold is the trophy (Lysbrudd, light breaking through
it; still being refined). The site header
(`SiteHeaderBar`) already carries all navigation and a per-page readout (on `/`
today: latest season, champion, date), so `/` does not need to be a menu.
Everything below the fold — and whether the page follows the tournament
lifecycle at all — is open.

All wording here describes content. None of it is copy; any block that needs
words on the page needs Jakob's words.

---

## 1. Framing: what is `/` for?

The sort depends on which of these Jakob believes. They are not exclusive, but
one should lead.

| #   | `/` is…                   | In one line                                                                                                   |
| --- | ------------------------- | ------------------------------------------------------------------------------------------------------------- |
| F1  | **The monument**          | A lobby that says "this matters": trophy, champions, a few proud numbers. Short; the archive lives elsewhere. |
| F2  | **The status board**      | Answers "what's happening with GG right now?" — when is the next one, who holds the title, is it live.        |
| F3  | **The pub-argument tool** | Somewhere to settle the chat's arguments fast: who leads all-time, who owns whom, what the record is.         |
| F4  | **The nostalgia hook**    | Something different each visit (a past game, a record, a moment) so opening it is a small "remember when".    |
| F5  | **The invitation**        | For the spectators and the occasional newcomer: what this is, who plays, how it works.                        |

F1 + F2 suggests a lean, lifecycle-driven page. F3 + F4 suggests a richer,
rotating page. F5 pulls in explanatory content nobody in the core group needs.

---

## 2. Inventory

**Legend**

- **States:** I = idle (~85% of the year), C = countdown, L = live (2 days),
  J = just finished / crowned. "All" = I C L J.
- **Data:** ✅ exists (source named) · 🔧 needs derivation from existing data ·
  ✍️ needs new content (who makes it).
- **Cost:** S (an afternoon, reuses components) · M (new component or new
  derivation) · L (new data pipeline, Phase 5 work, or media production).
- Candidates marked **[A1]–[A8]** are the eight assumptions from the working
  doc; see the mapping table at the end of this section.

### A. The tournament now (lifecycle)

**A1. Live takeover [A1]** — During the event the fold becomes the live
standings (points race, game N of M); the trophy shrinks to a corner.

- Job: during the 2 days this is the only reason anyone opens the site;
  nothing should stand between them and "who's leading".
- States: L.
- Data: 🔧 `SeasonView.standings` / `series` exist for finished seasons, but
  live entry (results form, `confirmed` flow, polling) is Phase 5, not built.
- Cost: L (rides on Phase 5). Dependency: structured `start`/`end` dates or a
  manual `status: 'live'` flip.
- Risks: the season page will also show live standings — pick one home or
  accept a duplicate. Could be a link-out banner instead (cheaper).

**A2. Countdown** — Days/hours to the next season, with its date.

- Job: anticipation; "is it soon?" is the most-asked question between events.
- States: C (could start at announcement, so it may cover months).
- Data: ✍️ needs structured dates on `SeasonMeta` (today `date` is free text)
  and Jakob entering the next season's date when it is set.
- Cost: S once dates exist. Dependency: structured dates.
- Risks: overlaps the header's tier-2 readout, which design B reserved for
  tournament status on `/` — decide whether it lives in the header, the page,
  or both. Meaningless when no date is set.

**A3. Next-season teaser** — What is known about the upcoming season so far:
roster, games revealed, power-ups revealed (drip reveal).

- Job: hype; "what are we playing this time?" fuels chat speculation.
- States: C (maybe late I, once a season is announced).
- Data: ✅ static `src/data/sesong/<NN>/` + `SeasonMeta.reveal*` flags (the
  upcoming season page already does this as a poster).
- Cost: S–M (compact version of the existing poster sections).
- Risks: duplicates the upcoming season page; maybe just a door to it.

**A4. Live ticker / last result** — Compact strip: current game, last game's
winner, points gap at the top.

- Job: the glance version of A1 for someone checking from a phone between games.
- States: L.
- Data: 🔧 same as A1 (Phase 5).
- Cost: M on top of A1. Dependency: Phase 5.
- Risks: overlaps A1; probably one or the other.

**A5. Just-crowned moment [A2 partly]** — The new champion's name engraved on
the plaque (the planned animation), with the winning figures: points, margin
to second, titles now held.

- Job: the emotional payoff; this is the screenshot that goes to the chat.
- States: J.
- Data: ✅ `SeasonView.standings` (points, margin), `CareerBoardRow.championships`.
- Cost: M (the engraving is part of the hero work; the readout is S).
  Dependency: structured dates to know when J ends; a decided window length.
- Risks: needs a short line of copy per champion, or none. Fades to idle — the
  page needs a plan for what replaces it.

**A6. What changed last season [A8]** — The delta the last season caused:
records broken or newly tied, all-time board movement, new category crowns.

- Job: "what did that tournament actually change?" — turns one weekend into
  history. Strong in the weeks after an event.
- States: J, early I.
- Data: 🔧 compute `deriveRecords` over S1..S(n-1) and S1..Sn and diff the
  holders/values (derivation is pure, so this is a new compose step, no fetch).
- Cost: M.
- Risks: needs a presentation that isn't a copy of /records; labels can reuse
  the record plate labels. Some seasons may change little (empty state).

**A7. Event practicals** — Where, when, who hosts, schedule for the two days.

- Job: logistics for participants and spectators who might drop in.
- States: C, L.
- Data: ✍️ new fields per season (Jakob).
- Cost: S.
- Risks: the chat already does logistics, and this is semi-private info on a
  public site. Likely a "no" unless spectators need it.

### B. History

**B1. Season rows / trophy cabinet [A3]** — Every season, newest first:
number, date, champion (accent), small trophy; the upcoming season as an unlit
row. Each row links to the season page.

- Job: the archive at a glance; the entry to the deep pages.
- States: All (in L, the live season's row could pulse).
- Data: ✅ season registry `src/data/sesong/index.ts` + `SeasonView.standings`
  (champion) — the header already resolves the same data.
- Cost: S.
- Risks: overlaps the header's Sesonger chooser **and** the plaque in the
  fold, which already lists every champion. Three places for one fact.

**B2. Podium history** — B1 extended: top three per season, not only the
champion.

- Job: gives the non-winners a place on the front page; "I was second twice".
- States: I, J.
- Data: ✅ `SeasonView.standings`, `CareerSeasonRow`.
- Cost: S.
- Risks: overlaps the /records career board's placement strip. Alternative to
  B1, not in addition.

**B3. Remember-when game** — One past game, picked by date: title, thumbnail,
season, who won and how (placements, a power-up swing if any). Links to the
game page.

- Job: the nostalgia hook; "oh, the Mundo Dodgeball one" in the chat.
- States: I (mainly).
- Data: ✅ `GameSummary` (results, matches, power-up uses) + static `Game`
  (title, thumbnail, `shortDescription`). 34 games is enough to rotate.
- Cost: S–M.
- Risks: needs a rotation rule (cross-cutting). `shortDescription` is
  pre-tournament hype copy, not a "what happened" line — a recap line would
  be ✍️ Jakob.

**B4. Season recap teaser** — An editorial title + two lines per season,
showing the latest (or a rotating one).

- Job: the story, not the numbers: "the season the curse decided it".
- States: I, J.
- Data: ✍️ Jakob writes one per season (TODO "Season recaps", gated on
  editorial appetite).
- Cost: S to build, ongoing writing cost.
- Risks: blocked on copy; if the recaps never get written, the block is empty.

**B5. Featured media** — One clip, photo or meme from a past season (video
embed or image), maybe rotating.

- Job: the strongest "remember when" there is; makes the page feel human.
- States: I, J.
- Data: ✍️ needs media collected. `videoEmbedUrl` exists on ~26 games
  (S2–S4) and on S2's meta, but those are mostly game trailers/intros, not
  tournament footage.
- Cost: S per item to show; L if it means an asset pipeline (TODO open
  question "Media volume", Skattkammeret).
- Risks: depends entirely on media existing; video embeds are heavy for the
  front page.

**B6. Season timeline (tape)** — Seasons on a real time axis with the gaps in
months and a "now" marker; the next season appears when announced.

- Job: shows the tournament's rhythm and how long since the last one.
- States: I, C.
- Data: 🔧 needs structured dates (the round-2 "Tidslinje" header idea).
- Cost: M. Dependency: structured dates.
- Risks: a decorative variant of B1; was a header candidate that lost to
  Tangenter.

### C. People

**C1. Portrait strip [A5]** — All players as a row of portraits (diagonal
strip in the prototype), linking to /spillere or each career page.

- Job: "who are these people" for spectators; a face for each name.
- States: I, C (in C, filtered to the coming roster).
- Data: ✅ `allPlayers()` + `findHeroImage` (card art fallback — no dedicated
  hero portraits exist yet).
- Cost: S.
- Risks: duplicates /spillere's top; looks unfinished until real portraits
  exist (Jakob's manual step).

**C2. Reigning champion card [A2 partly]** — The champion's FIFA-style gamer
card from the season they won, or a special champion variant.

- Job: bragging rights between tournaments; a chat-shareable object.
- States: I, J.
- Data: ✅ `CareerCard` / static gamers; 🔧 champion variant is the TODO
  "Champion card treatment".
- Cost: S (existing card) / M (special variant).
- Risks: competes with the trophy as the hero (open question 1: object or
  person); S1 has no card art.

**C3. Champion readout under the trophy [A2]** — The champion's name as the
headline with a row of figures: points, margin, titles, days as champion.

- Job: answers "who holds it" instantly, with context.
- States: I, J.
- Data: ✅ standings + board; 🔧 "days as champion" needs structured dates.
- Cost: S.
- Risks: the header readout on `/` already shows season + champion + date;
  the plaque also names the champion. Triple-stated if all three stay.

**C4. Player spotlight** — One player per day (seeded by date) with their
headline career figures and best category, linking to their page.

- Job: everyone gets their day on the front page; mild needling material.
- States: I.
- Data: ✅ `CareerView` (`ledger`, `tagStats`, `trophies`).
- Cost: S–M.
- Risks: with 5–8 players it repeats within a week; a weak player's day may
  read as a roast (records already decided against roasts).

**C5. Rivalry of the moment** — One pair, headline reading (games finished
ahead each way, current run), linking to `/vs/a/b`. Either the closest rivalry
or a rotating pair.

- Job: the chat's favourite topic; the door to /vs, which otherwise has no
  index yet.
- States: I, C (in C: pairs that meet in the coming roster).
- Data: ✅ `RecordsView.rivalries`, `PairSummary`, `PairStats.gameRuns.current`.
- Cost: S–M.
- Risks: overlaps /records' "Jevneste rivaleri" plate.

**C6. VS picker inline [A6]** — The two dropdowns + go, on the front page.

- Job: a direct path to settling an argument.
- States: I.
- Data: ✅ roster.
- Cost: S (the component is needed for the /vs index anyway).
- Risks: the header's VS chooser already does exactly this on every page.
  Strongest "no" candidate on overlap grounds.

### D. Stats & records

**D1. All-time board, mini [A8]** — Top 4 (or everyone) by career placement
points, titles beside, linking to /records.

- Job: "who leads all-time" — PO's most-asked question.
- States: I, C (in J it shows the movement, see A6).
- Data: ✅ `RecordsView.board` (`CareerBoardRow`).
- Cost: S.
- Risks: duplicates /records' headline and /spillere's ordering (design
  argued doors only). With ~5 players "top 4" is almost the whole board.

**D2. Record of the day [A4]** — One record plate, picked by date so everyone
sees the same one, linking to its `/records#fragment`.

- Job: a small fresh thing per visit; a chat prompt ("did you see today's?").
- States: I.
- Data: ✅ `RecordsView` + `RecordPlate` + fragment ids (22 plates).
- Cost: S.
- Risks: reuses plate labels (no new copy) or needs new lines (open question
  10). 22 plates cycle in three weeks.
- Variant D2b: 2–3 plates auto-picked by relevance (records broken last
  season, else headline ones) — design's version; merges with A6.

**D3. Archive odometer** — A row of big mono totals: seasons, games played,
matches, game wins handed out, power-ups fired, titles in the archive.

- Job: the monument in numbers; cheap pride, fits the instrument look.
- States: I, J (ticks up after a season).
- Data: 🔧 counts over `fetchAllSeasonBundles()` / `RecordsView` — trivial.
- Cost: S.
- Risks: numbers without a story; could live in the header readout instead.

**D4. On the line next season** — What is at stake: active streaks carrying
across the season boundary (win/top-two runs, a current pair run, the
all-time wins lead), records within reach, title counts that could tie.

- Job: makes the next tournament matter before it starts; pure chat fuel.
- States: C (and late I).
- Data: 🔧 current (not longest) streaks per player need a small derivation in
  `derive/records/streaks.ts`; pair runs exist (`PairStats.*Runs.current`);
  "within reach" needs rules.
- Cost: M.
- Risks: "within reach" thresholds are judgement calls; needs labels.

**D5. Category crown of the day** — One tag with its crowned player, linking
to /records' crowns.

- Job: a variant of D2 for the category data.
- States: I.
- Data: ✅ `RecordsView.tagCrowns` + `MIN_RANKED_GAMES`.
- Cost: S.
- Risks: a weaker D2; probably folded into the same rotation if D2 is a yes.

### E. Fun / alive

**E1. Fact of the day** — One generated sentence from the data, picked by
date (e.g. a pair's finished-ahead count, a title specialist, a home-advantage
figure).

- Job: the most chat-shareable unit on the page; reads like a sports
  broadcast stat.
- States: I, C.
- Data: 🔧 all facts derive from existing view-models; ✍️ each fact type needs
  a sentence template from Jakob.
- Cost: M (a fact generator + templates).
- Risks: template copy is real public copy; overlaps D2/D5 (pick one rotating
  slot, or let E1 be that slot).

**E2. Power-up / curse of the day** — One card from the catalog with how it
played out (net effect when used).

- Job: the power-ups are the tournament's signature chaos; a fun reminder.
- States: I, C (in C: the coming season's revealed ones, overlaps A3).
- Data: ✅ static `power-ups.ts` + `PowerUpUseEntry` across seasons.
- Cost: S–M.
- Risks: only S2–S4 have power-ups; art exists for only three.

**E3. Game library** — Every game ever played as a thumbnail grid (34 now),
grouped or filterable by title/genre, linking to game pages.

- Job: "what have we played?" — useful when picking games for the next season.
- States: I, C.
- Data: ✅ static games + `titles.ts` + tag labels.
- Cost: S–M.
- Risks: a whole page's worth of content; maybe its own route instead.

**E4. Days counter** — "Days since the last tournament" or "days as champion"
as a single big number.

- Job: a playful tension gauge; needles the champion and the challengers.
- States: I.
- Data: 🔧 structured dates.
- Cost: S. Dependency: structured dates.
- Risks: overlaps C3's "days as champion"; might fit the header readout better.

**E5. Shareable card** — A ready-made image (champion card, podium, stat
card) with a "copy / share" action for the chat.

- Job: the product brief says the site feeds the chat with artifacts; this is
  the most direct form of that.
- States: J (podium), I (record/fact card).
- Data: ✅ data exists; 🔧 OG image generation (TODO "OG/shareable images").
- Cost: M–L.
- Risks: arguably belongs on the source pages (season, career, /vs), not `/`.

**E6. Lore teaser (Skattkammeret)** — A wall/peek of memes, quotes and
running jokes, linking to a future /lore.

- Job: the in-jokes are the friendship; the most "ours" content possible.
- States: I.
- Data: ✍️ media + captions from Jakob/the group (TODO "Skattkammeret").
- Cost: L (no media pipeline yet).
- Risks: a teaser for a page that doesn't exist; blocked on media volume.

### F. Utility

**F1. Group-chat link [A8]** — A link/button to the group chat.

- Job: closes the loop between site and the social hub.
- States: All.
- Data: ✍️ the chat URL.
- Cost: S.
- Risks: a public site exposing a private group link; the core group already
  has the chat open. Likely a "no" or admin-only.

**F2. How it works** — The format in brief: games picked by players,
placement points, power-ups and curses, what wins a season.

- Job: for spectators and newcomers (F5 framing); nobody in the group needs it.
- States: I, C.
- Data: ✍️ Jakob's copy; points ladder exists in data.
- Cost: S.
- Risks: copy-heavy; rules vary per season (power-ups), so it may go stale.

**F3. About / origin** — Where the tournament came from, when it started,
what the trophy is.

- Job: the monument's plaque text; gives context to the trophy fold.
- States: I.
- Data: ✍️ Jakob's copy.
- Cost: S.
- Risks: pure copy; could be a footer line instead of a block.

**F4. Add to calendar** — An .ics download for the next season's dates.

- Job: practical; nobody misses the weekend.
- States: C.
- Data: 🔧 structured dates.
- Cost: S. Dependency: structured dates.
- Risks: the chat already sets the date; low value for 5–10 people.

**F5. Section doors** — Four large tiles to Sesonger / Spillere / Rekorder /
VS.

- Job: discoverability for first-time visitors.
- States: I.
- Data: ✅ none needed.
- Cost: S.
- Risks: already decided against in spirit — the header carries the nav and
  "no page has to be reached via `/`". Listed so it can be explicitly rejected.

### G. Structure (not blocks, but on the list)

**G1. Lifecycle behaviour [A1]** — Whether the page changes by state at all.
See decision X1.

**G2. Section order and count [A7]** — The prototype assumed four sections.
Comes out of the sort; see decision X8.

### Mapping: the eight working-doc assumptions

| Assumption                                              | Candidates                      |
| ------------------------------------------------------- | ------------------------------- |
| [A1] Lifecycle-driven; live takes the fold              | G1, A1 (and A4), decision X1–X3 |
| [A2] Champion headline + readout                        | C3, A5, C2                      |
| [A3] Season list, newest first                          | B1 (variants B2, B6)            |
| [A4] Record of the day as a plate                       | D2 (variants D2b, D5, E1)       |
| [A5] Portrait strip                                     | C1                              |
| [A6] VS picker on the front page                        | C6 (alternative: C5)            |
| [A7] Order of sections, four of them                    | G2, decision X8                 |
| [A8] Missing: board, last season, upcoming, media, chat | D1, A6, A2/A3, B5, F1           |

### At a glance

| ID  | Candidate                 | States | Data | Cost | Biggest overlap / risk           |
| --- | ------------------------- | ------ | ---- | ---- | -------------------------------- |
| A1  | Live takeover             | L      | 🔧   | L    | Phase 5; season page             |
| A2  | Countdown                 | C      | ✍️   | S    | header readout; needs dates      |
| A3  | Next-season teaser        | C      | ✅   | S–M  | upcoming season page             |
| A4  | Live ticker               | L      | 🔧   | M    | A1                               |
| A5  | Just-crowned moment       | J      | ✅   | M    | window length                    |
| A6  | What changed last season  | J, I   | 🔧   | M    | /records                         |
| A7  | Event practicals          | C, L   | ✍️   | S    | the chat; privacy                |
| B1  | Season rows / cabinet     | All    | ✅   | S    | plaque + header chooser          |
| B2  | Podium history            | I, J   | ✅   | S    | /records board strip             |
| B3  | Remember-when game        | I      | ✅   | S–M  | rotation rule; recap copy        |
| B4  | Season recap teaser       | I, J   | ✍️   | S    | editorial appetite               |
| B5  | Featured media            | I, J   | ✍️   | S–L  | media volume                     |
| B6  | Season timeline (tape)    | I, C   | 🔧   | M    | B1; needs dates                  |
| C1  | Portrait strip            | I, C   | ✅   | S    | /spillere; no real portraits yet |
| C2  | Champion card             | I, J   | ✅   | S–M  | trophy-vs-person hero            |
| C3  | Champion readout          | I, J   | ✅   | S    | header readout + plaque          |
| C4  | Player spotlight          | I      | ✅   | S–M  | repeats weekly; roast risk       |
| C5  | Rivalry of the moment     | I, C   | ✅   | S–M  | /records rivalry plate           |
| C6  | VS picker inline          | I      | ✅   | S    | header VS chooser                |
| D1  | Mini all-time board       | I, C   | ✅   | S    | /records, /spillere              |
| D2  | Record of the day         | I      | ✅   | S    | copy question 10                 |
| D3  | Archive odometer          | I, J   | 🔧   | S    | numbers without story            |
| D4  | On the line next season   | C, I   | 🔧   | M    | judgement thresholds; labels     |
| D5  | Category crown of the day | I      | ✅   | S    | D2                               |
| E1  | Fact of the day           | I, C   | 🔧✍️ | M    | template copy; D2                |
| E2  | Power-up of the day       | I, C   | ✅   | S–M  | only S2–S4                       |
| E3  | Game library              | I, C   | ✅   | S–M  | page-sized                       |
| E4  | Days counter              | I      | 🔧   | S    | C3; header                       |
| E5  | Shareable card            | J, I   | 🔧   | M–L  | belongs on source pages?         |
| E6  | Lore teaser               | I      | ✍️   | L    | no /lore, no media               |
| F1  | Group-chat link           | All    | ✍️   | S    | privacy                          |
| F2  | How it works              | I, C   | ✍️   | S    | copy; goes stale                 |
| F3  | About / origin            | I      | ✍️   | S    | pure copy                        |
| F4  | Add to calendar           | C      | 🔧   | S    | low value                        |
| F5  | Section doors             | I      | ✅   | S    | header (already decided against) |

33 block candidates (A1–F5) plus the two structural items (G1, G2).

---

## 3. Cross-cutting decisions the sort will force

**X1. Does `/` follow the lifecycle?**
(a) No — one static page all year. (b) Two states: normal / live. (c) Four
states: idle / countdown / live / just finished. (d) Four states, but only the
fold changes; everything below is fixed.
_Forced by:_ A1–A5, D4, B6, E4. Anything but (a) needs structured dates first.

**X2. What happens during live?**
(a) The fold becomes the standings (A1). (b) A banner/ticker above or under the
trophy linking to the season page (A4). (c) `/` redirects to the live season
page for the 2 days. (d) Nothing special — the header's LED/pill is enough.

**X3. How long is "just finished"?**
(a) Fixed: 1, 2 or 3 weeks. (b) Until the next season is announced. (c) Until
Jakob flips a flag in static data. (d) No such state.

**X4. Who is the idle headline — the trophy or the champion?**
(a) Trophy only; the champion lives on the plaque. (b) Trophy + champion name
and figures (C3). (c) Trophy + champion card (C2). Also decides how many
times the champion is stated (plaque, header readout, page).

**X5. All-time board on `/`?**
(a) No, doors only (/records owns it). (b) Leader only, one line. (c) Mini
board (D1). (d) Only as movement after a season (A6).

**X6. Rotation: what is "fresh" on each visit?**
(a) Nothing rotates. (b) One daily slot, seeded by date so everyone sees the
same thing (shareable). (c) Several daily slots. (d) Random per visit (not
shareable). (e) Per season (changes when a season finishes).
And: which pool feeds a rotating slot — records (D2), crowns (D5), games (B3),
players (C4), pairs (C5), facts (E1), power-ups (E2), or a mix?

**X7. How much may `/` repeat other pages and the header?**
(a) Strict: `/` only shows what exists nowhere else (rules out B1, C6, D1, F5,
probably C3). (b) Teasers allowed: a slice of another page as a door. (c)
Anything goes. Related: does the countdown/status live in the header readout,
on the page, or both?

**X8. Page length and section count.**
(a) Fold only, or fold + one block. (b) Short lobby: 2–3 blocks. (c) Almanac:
5+ blocks, a scroll worth taking. Also the order, and whether the phone order
differs from the desktop order.

**X9. Editorial appetite.**
Which ✍️ blocks is Jakob willing to keep fed: none / one-off copy only (F2, F3,
fact templates) / per-season writing (B4, A5 lines) / ongoing media (B5, E6)?
Every "must" with ✍️ is a standing commitment.

**X10. Who is the page for first?**
(a) The 4–5 players (assume all context; stats and needling). (b) Spectators
too (some explanation: F2, C1). (c) Newcomers (F3, F5). Shifts which of the
"utility" group survive.

**X11. Prerequisites to accept now.**
Structured `start`/`end` dates on `SeasonMeta` (needed by A2, A5, B6, C3's
days, E4, F4, X1/X3), and whether the "next season" exists as a registered
season early (needed by A2, A3, D4's roster). Phase 5 live entry gates A1/A4.

---

## 4. Example sorts (examples only — not recommendations)

These only show how the inventory can combine. The order is top to bottom
under the trophy fold.

**Lean ("the monument", F1 + F2)** — X1 (c) fold only, X5 (a), X6 (a), X8 (a).

- Idle: trophy + C3 champion readout → B1 season rows.
- Countdown: A2 countdown replaces C3.
- Live: A4 ticker under the trophy, linking to the season page.
- Just finished: A5 engraving moment.

**Rich ("the almanac", F3 + F4)** — X1 (a) or (d), X5 (c), X6 (b) one daily
slot, X8 (c).

- Trophy → D3 odometer → D1 mini board → D2 record of the day (or E1) → B3
  remember-when game → C5 rivalry → B1 season rows.

**Lifecycle-heavy (F2 + F4)** — X1 (c), X2 (a), X3 (b), X6 (e).

- Idle: trophy → B3 remember-when (daily) → C5 rivalry → B1 rows.
- Countdown: trophy (graphite) + A2 → A3 teaser → D4 on the line.
- Live: A1 takeover → B1 rows with the live row pulsing.
- Just finished: A5 → A6 what changed → E5 podium card to share.
