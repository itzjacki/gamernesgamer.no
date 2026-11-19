# Design audit

Working doc for the Phase 4 design audit (TODO.md). Delete it once every
finding is fixed, ruled into `design.md`, or moved to `TODO.md`.

**Passes:** 1. code consistency inventory (done) · 2. page-by-page walkthrough,
desktop and phone · 3. cross-page patterns · 4. direction check (Jakob decides).

Severity: **broken** (breaks a design.md rule or a11y) · **drift** (same role,
different values) · **opportunity**. Effort: **fix** (mechanical, no decision)
· **decide** (needs Jakob).

Admin (`src/app/admin/**`) is out of scope: it has its own timing-sheet rules.

---

## Pass 1 — code consistency inventory

Measured on the public pages: class counts from the source, and grid
registration measured in the browser at 1280px (each bordered or filled
block's top and bottom edge against the 40px grid lines).

### A. Grid registration — the biggest finding

design.md says vertical sizes and gaps below the header come in whole cells,
so every page keeps the same rows. In practice only the header and the front
page's hero are in register. Every other page drifts from its first block:

| Page               | Blocks on grid | Off grid |
| ------------------ | -------------: | -------: |
| `/`                |              2 |        4 |
| `/sesong`          |              1 |       15 |
| `/sesong/04`       |              0 |       37 |
| `/sesong/04/2xko`  |              2 |       23 |
| `/spillere`        |              4 |       12 |
| `/spillere/jakob`  |              0 |       47 |
| `/records`         |              0 |      101 |
| `/vs/jakob/tobias` |              1 |       49 |

The same few causes repeat on every page:

1. **The page title block** (`Heading as='h1'` with `aboveLine`/`belowLine`,
   `pt-8`) is 124–144px tall, so everything after it starts off a line.
2. **The gap between sections** is `sm:gap-28` (112px) in `layout.tsx`, not a
   whole number of cells. Each section boundary adds 8px of drift. (The front
   page stacks its blocks 120px apart, which is in whole cells.)
3. **Table rows are 41px (header) and 49px (body)** where they use `py-3`
   (`StandingsTable`, `CareerBoard`, `SeasonRecord`, the season page's
   tables), against 40px (`h-10`) in `RoundsTable`, `RoundRobinStage` and
   the match lists. Two row heights for the same thing.
4. **The h2 + `gap-8` pairing:** a 40px h2 line plus 32px is 72px. The
   label + `gap-6` pairing does fit: a 16px label line plus 24px is one cell,
   which is likely why that pairing reads well.
5. **Fixed sizes that aren't cells:** the stage band `h-15` (60px), the
   season/player plates (224px and 240px tall, offset by the drift above),
   the record plates (275px).

Not drift: the front page's `calc(round(…, 40px))` positions all exist to put
the hero's parts on grid lines. Any fix must keep them.

→ **Decision D1** below.

### B. Type

**Sizes below the 10px floor (broken):** the site header's readout labels are
`text-[8px]` (`SiteHeaderBar` `LABEL`), and its function numbers and phone key
labels are `text-[9px]`. They are also `text-text-muted`, so they are the
smallest and faintest text on the site. → **D3**

**Font weights:** fixed. Mono figures used `font-bold`/`font-semibold`, which
Chrome fakes on Martian Mono (only 400/500 load); they are now
`font-medium`. Sans `font-bold` (rendered 800) is now `font-extrabold`.
design.md's Type section lists the real weights. Side effect to judge in
pass 2: the best round in a rounds table now stands out less (500 vs 400).

**Label letter spacing (drift):** uppercase mono labels use three systems:

| Tracking                           | Uses | Where                                        |
| ---------------------------------- | ---: | -------------------------------------------- |
| `tracking-widest` (0.1em)          |   35 | `SectionLabel`, older pages                  |
| `tracking-wide sm:tracking-widest` |   13 | /vs, /records board, rosters, archive totals |
| `tracking-[0.2em]`                 |    4 | header readout, hero side blocks             |

The responsive one exists because long labels don't fit a phone at 0.1em.
→ **D4**

**Label sizes:** `text-xs` almost everywhere, `text-[10px]` in dense
instruments; design.md now names 10px as that small size. Pass 2 checks each
10px use earns it.

### C. Spacing

Gaps in use: 4, 8, 12, 16, 20, 24, 32, 40, 80 and 112px. By role:

| Role                               | Values in use             | Proposed                         |
| ---------------------------------- | ------------------------- | -------------------------------- |
| Between page sections              | 80 (phone), 112 (desktop) | 80 / 120                         |
| Label (`SectionLabel`) → its block | 24                        | 24 (keep: 1 cell with the label) |
| h2 `Heading` → its block           | 32                        | 40 (or move to labels, D2)       |
| Page title block → first content   | 16, 24, 40                | one value                        |
| Inside plates and table cells      | 4–20, by context          | leave; internal                  |

Padding is consistent enough inside cells (`px-3`/`px-4`, `py-3`); the
problem is only where padding sets a row's height (A3).

### D. Colour and tokens

- **`SeasonPointsChart`** hard-codes its colours (SVG can't take the
  utilities directly), including `#706b66` for the other players' lines,
  which is not a token: `--color-text-muted` is `#8a847e`. Either a
  deliberate dimmer line colour, then a token, or drift. → small **decide**
- **`GamerCard`** `#221a1c` (card fill): not a token. Probably part of the
  card art, which the redesign (Phase 4 item 2) will replace; leave.
- Fine as they are: `TrophyIcon` metals (the documented exception),
  `TrophyHero` mask colours, the Google sign-in logo.

### E. Primitives and patterns

- **`aboveLine` uses two dashes:** `GG - Alle sesonger` (hyphen, 3 pages) and
  `GG — Sesong N` (em dash, 3 pages). Copy, so Jakob's pick. (decide, small)
- **Links: three styles.** design.md says links are underlined at rest with
  accent on hover. In practice: underlined at rest (back links, body text);
  underline on hover only (names in `StandingsTable` and other tables); no
  underline (record lines, plates, cards). Whole-block links (plates, cards)
  are rightly different, but names in tables are inline links that read as
  plain text. → **D5**
- **Back links** exist on the game page (→ season) and career page
  (→ players) only; the season page has none to the index, /vs none. Belongs
  to pass 2 (wayfinding), noted here because it's the same component copied
  twice.

---

## Decisions for Jakob (from pass 1)

- **D1 — Grid registration beyond the front page.** Either (a) commit to it:
  section gap 120px, table rows 40px, title blocks and stage bands sized to
  cells, so every desktop page keeps the grid's rows; or (b) relax the rule:
  the header and front page are in register, elsewhere the grid is texture.
  (a) is a real but bounded piece of work (most of it is five shared causes,
  not per-page fixes) and is the stronger expression of VERKSTED.
- **D2 — Section headings: big h2 or mono label?** The season and game pages
  head their sections with large `Heading` h2s; /records, the career page and
  /vs use `SectionLabel` as the heading. Two languages for the same thing.
  The label version is quieter and fits the grid; the h2 version gives the
  archive pages more presence. Pick one (or a rule for when each applies).
- **D3 — The header's 8px and 9px text.** Raise them to the 10px floor, or
  make the header an explicit exception (instrument-panel micro labels).
- **D4 — Label letter spacing.** One standard for uppercase mono labels:
  `tracking-widest`, or wide on phones and widest from `sm`, built into
  `SectionLabel`. And whether the hero's 0.2em stays as a deliberate
  exception.
- **D5 — Inline links in tables:** underlined at rest like other links, or
  keep names plain until hover (and say so in design.md).

Pass 1's ready fixes are applied (legacy tokens deleted, weights, the table
links' focus outline, design.md's Type section). The label class string
copied in seven components is the label's type style used for other roles
(nicknames, captions, table header rows), not a missed `SectionLabel`; left
as is.
