---
inclusion: fileMatch
fileMatchPattern: ['src/**/*.tsx', 'src/**/*.css']
---

# Design

## Direction: VERKSTED

"Indie high performance." The restraint is the identity — everything purposeful
by default, accent used sparingly.

**Reference points:** Teenage Engineering (instrument-panel restraint),
Braun/Dieter Rams (grid discipline, no decoration without function), motorsport
timing sheets (monospace data, hairline rules, density without noise).

The archive doesn't get a more "monumental" language than the live pages.
Tried and dropped: permanent records on the `--color-display` surface;
one oversized hero moment per page; section labels on hairline rules with
catalogue numbers.

## Tokens

Values live in `src/styles/global.css` under `@theme`. Use the tokens, never raw
hex (exceptions: the season trophies' real gold, silver and bronze; the points
chart's other-player lines, darker than any token). All
colours are solid — no transparency, because overlapping translucent
borders double up.

The share images can't read CSS variables, so `src/lib/og/frame.tsx` copies
the tokens as hex: change a token in both places. The images follow the page
rules (greyscale portraits, accent only on rank-1 data and the instrument).

The accent is one colour in two tokens: `--color-accent` for marks (borders,
outlines, the diagonal, needles, fills) misses AA as small text, so any text
in accent, at rest or on hover, uses `--color-text-accent`.

| Token                   | Role                           |
| ----------------------- | ------------------------------ |
| `--color-bg`            | Page background                |
| `--color-surface`       | Single-step surface lift       |
| `--color-display`       | The header's recessed display  |
| `--color-accent`        | Pinkish-red. The single accent |
| `--color-text-accent`   | The accent as text (AA)        |
| `--color-text`          | Body text                      |
| `--color-text-muted`    | Metadata, labels (AA on `bg`)  |
| `--color-border`        | Structural borders             |
| `--color-border-accent` | Red-tinted border              |

**Accent at rest:** leaderboard rank 1, champion callouts, record-holder
figures on /records, the gamer-card diagonal. Everything else earns accent on
interaction. Rank-1 data may take it freely; it doesn't need rationing to one
mark per page. (A /records wall without accent was tried and read flat.) A
category's best is a maximum, not rank-1 data: the category tables carry no
accent at rest.

Rule of thumb for any page: every screenful should carry some accent. Where
there is no rank-1 datum to spend it on, put it on the instrument rather than
on a person.

On the player index the accent at rest is the rank mark on EVERY plate, a
consistent rhythm rather than a prize. (Tried and dropped: accent only on the
leader's mark, which left almost no red; on title counts above zero; on the
diagonal.)

## Two-player pages (/vs)

"Ahead of the other" is not rank-1 data: never accent the leader of a stat, or
a one-sided pairing paints one side red.

- **One reading on a shared axis, never two columns.** Both figures share a
  colour and weight; a needle on a hairline gauge leans toward whoever has
  more (centre when level). Every gauge shows its needle whatever the sample:
  a bare axis reads as a bug. Counts, never percentages.
- **Weight, not colour, for who finished ahead:** that placement in plain
  text colour, the other muted; level games leave both muted. A game win is
  not told apart from any other game finished ahead.
- **Accent goes on the instrument:** the masthead diagonal, every gauge
  needle, season wins in the seasons table, the best-season figures (tried
  neutral: the page read too flat). Never a red "1" in the /vs popovers.
- Both best-season plates always show; a side with none gets a muted dash.
- Tried and dropped: per-game ticks above/below a line with height for the
  placement gap (hard to read).

## Portraits

Greyscale at rest so photos from different seasons read as one set; hover or
focus brings back the photo's own colour. (An accent duotone on hover was
tried on /vs and dropped.) Champion pictures are the exception: at rest they
take `ChampionTone`, greyscale with red midtones, so they belong to the
red-lit scene; as a link they get their colour back on hover. Use the shared
tones (`portrait-tone.ts`, `CHAMPION_TONE`), never a hand-copied filter. A
portrait that isn't a link (the career hero) just stays greyscale.

No portraits on the /records boards and plates: one player holding several
plates would repeat the same face, and identity is the roster's and the
hero's job.

## Career page

The ledger is an instrument panel with large mono figures (a plain
`StatList` read flat next to the trophy shelf and cards). The hero is the
shared `Hero` (as is the season page's champion), with the player's name as
the page's h1 and the catalogue line above it.

## Game page

Only the game's result is rank-1 data: accent on the standings' winner, the
deciding bracket plate (F, or GF2 when played, else GF) and its winning
score, and a rounds table's winner only when that stage settled the game. A
group or stage leader gets weight, not accent, so one player isn't painted
red by every stage. Brackets are drawn (plates on the 20px-row grid, hairline
connectors for winners' routes only); on phones a double-elim bracket splits
into its sections instead of scrolling.

With two or more stages, each opens with an h3 (h5 size) on a 60px
`bg-surface` band (a lone stage has none; a one-round table is headed "Score"
and names what was scored in its row). The band is louder than the mono h2
label above it; accepted, since the stages are the page's main content (a
hairline rule reads as one more grid line; one cell felt cramped). If more
places end up with a child louder than its mono heading, revisit mono
section headings. Blocks
inside a stage take `SectionLabel`s, so a stage never reads at the same
strength as its parts. Blocks only as wide as they need: the standings beside
the media, a group's table and matches side by side.

## Gamer cards

The cards are their own product, physical trading cards rather than UI:
every rule in this file is optional for them (radius, shadows, translucency,
light effects, colours beyond the accent). They only have to work on the
site, not look integrated. Aim for cool first. They share the site's sheet
serial grammar (`GG-04 / SPILLER / 03`).

## Type

Neue Montreal (self-hosted) for display (800), body (400) and emphasis (600:
names, "weight, not colour"); Martian Mono for metadata and figures, 400 with
500 for emphasis. Only those weights are loaded: anything else falls back or
is faked (Martian Mono at 600+ is smeared 500). No text below 10px, except
the site header's instrument micro text (function numbers, readout labels),
which is one size, 8px; the phone key labels are navigation, so 10px. 10px is
the small label size for dense instruments (bracket slots, chart axes, compact
cards), `text-xs` everywhere else. Labels are `SectionLabel` (mono, xs,
muted), placed above a block's frame with `gap-6`, never inside it. A label
that heads a section is the section's heading: render it `as='h2'` (pages
use mono labels, not large h2s, for their sections). Every uppercase mono
label is `tracking-wide sm:tracking-widest`, so long labels fit a phone; only
the header's and the hero's instrument text keeps its wider 0.2em.

## Notation

- **Seasons:** "Sesong 4" in headings and prose; "S4" in tables and
  readouts ("S1–S4" for a range); the zero-padded "04" only as the season
  index plates' big figure and inside sheet serials (`GG-04`).
- **Placements** next to points are written "1.", so the two can't be
  confused; a table's leading rank column stays a plain "1".
- **The line above a page title** is a catalogue line in the sheet-serial
  grammar (`GG-04 / 13.12.2025 – 14.12.2025`, `GG / 4 spillere`): facts the
  page doesn't state elsewhere, parts split by " / ", never a sentence. No
  line when there is nothing new to say. On a game page it is the game
  card's serial, and its season part links back.
- **Names in tables and lists** are mixed-case semibold; only mono labels
  are uppercase. Heroes set names in uppercase display type.

## Grid

- 40px cells, `rgba(232,216,216,0.04)`, centred horizontally and anchored to
  the top: `background-position: calc(50% + 20px) 8px`, so the header's
  bottom edge (168px on desktop) is a grid line. Blocks line up with the
  grid's columns (the 800px content width is 20 cells). Vertically, only the
  header and the front page's hero are kept in register (the front page
  stacks its blocks 120px apart); pages with dynamic content don't chase grid
  rows, since table and text heights can't be held to cells.
- Container `max-w-220` (880px = 22 cells) with `lg:px-10`, giving an 800px
  content width (20 cells).
- The grid scrolls with the page. Alignment is a desktop feature: on mobile the
  grid is texture only, with normal padding (`px-4 sm:px-6`).

## Tables, rows and readouts

- **Tables** use the shared classes in `table-classes.ts`: 40px rows,
  `px-3` cells (`px-1.5 sm:px-3` for tables with many columns), a 48px rank
  column and an 80px figure column. Tables of the same shape look identical
  (the season standings, game standings and a group's table). /vs keeps its
  `sm:px-8` cells to line up with the page's walls.
- **Rows outside tables:** data rows 40px; a row that is itself a link 44px
  (tap target); dense lines inside a plate 32px. The /vs gauge rows are
  plates, not data rows.
- **Readouts** (a label with its figure) are `Readout`: stacked or inline,
  at three figure sizes: 14px in rows and tables, 24px in plates, 48–60px
  for a page's headline figure. The site header's parameters are the one
  exception.

## Surfaces

- Surfaces use `bg-bg` — they mask the grid rather than float above it.
- Grid lines continue through dividers at the same weight.
- No shadows. No border radius on grid-aligned components.

## Front page

`/` is a short lobby that says "this matters", for the players first: no
explaining the tournament, and no repeating the archive, which lives on the
other pages (navigation is the header's job).

- **One site state** (`deriveSiteState`) sets the fold and one slot under
  it; below that, every state has the same record and content of the day
  and the stats row. No other per-block timelines.

  | State        | Trophy (desktop)                     | Beside / on the trophy                                   | Slot                     |
  | ------------ | ------------------------------------ | -------------------------------------------------------- | ------------------------ |
  | Dormant      | right                                | "Gamernes Gamer" in big bold type (the h1), nothing else | empty, no filler         |
  | Live         | right                                | the live season block (later a live table)               | empty                    |
  | Upcoming     | centred                              | the countdown on the trophy, nothing else                | the lineup               |
  | Just crowned | right, or the engraving scene (wide) | the champion's picture and footer                        | what last season changed |

  On phones the trophy is centred. The dormant title sits on the floor in
  four cells starting one above its foot; the live block starts one
  cell below the foot, on the floor, so it shows on the first screen
  without covering the trophy; the champion follows the stage. Outside
  just crowned the fold names no champion (the header readout does).

- **The slot's top edge peeks above the fold.** Blocks under the hero snap to
  whole 40px cells so the hero's grid stays in register with the page.
- **The lineup** (upcoming) is the season page's own cards, games and
  power-ups `compact`, with a centred button to the season page between
  Spillere and Spill. Sections are not links; revealed game cards are.
- **What last season changed** shows only records beaten or improved, and
  career totals only when they change hands.
- Only the countdown gets display-size numerals; not too much red at once
  while just crowned; no scroll animations (the hero is the one motion
  moment).
- **Trophy hero** (`TrophyHero`): one scene, not a trophy on a texture
  (that reads as a sticker). The wall IS the page grid, in register to the
  pixel; the trophy and the champion's footer stand on a hairline at the
  fold. The perspective floor can never meet the flat grid, so it runs to
  the stage's edge and closes with a line, then one row without vertical
  lines and one row of spacing. Floor lines firm up to meet the closing
  line. Tried and dropped: the floor as a `--color-display` band; a
  content-width tick ruler; a circular light mask.
- **The light:** one red light in every state; intensity tells them apart,
  from dormant (dim, no dust) to just crowned (brightest). Upcoming breathes,
  live pulses, echoing the header logo; live alone adds aimed spotlight
  flashes from the floor (unaimed ones lit the whole canvas). Lines stay
  subtle under the light. The light fades out at the edges through a
  rounded-corner mask; on phones only at top and bottom, so it reaches the
  sides. No WebGL → a static poster; reduced motion → still frames.

## On the hero

What sits on the trophy hero (`GgIntro`, `LiveSideBlock`, `ChampionSideBlock`,
`SeasonCountdown`) is either bold type straight on the scene or an ordinary
bordered element. No scrims, halos, masks or faded edges: they were
tried and looked bad.

- **Type on the scene:** only large bold white display type (the dormant
  "Gamernes Gamer" h1, the countdown's numerals) and its `text-text` mono
  labels. Never `text-text-muted` directly on the scene: it fails AA against
  the lit fog.
- **In the scene:** the countdown stands on the trophy, on the hollow
  between the controller and the pedestal (20px above its centre), and the
  scene draws its numerals itself: lit solids in front of the trophy, with
  a red rim toward the light and a red glow thrown onto the trophy behind
  them (a floor reflection beside it was too subtle). The page still lays
  them out in HTML (`data-hero-numerals`); the HTML glyphs go transparent
  only while the scene draws them, so screen readers and the poster keep
  the text.
- **Bordered elements:** solid `bg-bg` with `border`, like the site's panels
  (live block, the champion's footer). Muted labels are fine
  inside them. Whole-block links take the accent on their border on hover.
- **Champion:** their picture stands straight on the scene, uncropped, with
  no panel behind it, on a solid footer (name, season, points); with no
  picture the footer stands alone. On desktop the footer's bottom sits on the
  trophy's foot line, so the two share a floor.
- **Static:** the scene does not follow the pointer. It keeps the light's
  on-load rise, its slow sideways drift and the dust.

## Site header

`SiteHeader` (server: data) / `SiteHeaderBar` (client), in the root layout.
Teenage Engineering instrument grammar on the VERKSTED tokens.

- **Keys, not tabs.** Each nav item is a key: a mono function number (`01`),
  the label, and a 6px square status LED. The LED replaces the underline: it is
  `border-border-accent` when off, solid accent on the current section, and
  blinks while that key's chooser is open. The rail is solid `bg-bg`, so the
  grid does not show through.
- **One display, one thing at a time.** The row under the keys is a recessed
  screen (`bg-display`). At rest it is the page's readout: label-over-value
  parameters in the normal mono type. A pixel texture was tried and was
  unreadable. Accent on the display follows the usual rule: rank-1 data only
  (a champion, a titles count).
- **Choosers vs. links.** A key with a set to choose from (Sesonger,
  Spillere) or a choice to make (VS) takes over the display; Rekorder, with
  nothing to choose, is a plain link.
  - **Sesonger / Spillere:** one key per season or player, then "Alle" (the
    index) in its own cell behind a full-height hairline.
  - **VS:** two selects with a swap-sides button between them (a two-way
    arrow icon, like a flight search's from/to; no animation), then GÅ. On /vs
    pages this picker is itself the readout. It is the site's ONE pair
    picker: there is no /vs index, and pages do not grow their own pickers.
- **The display glitches, it doesn't slide.** Every change (switching
  choosers, closing back to the readout) glitches in over what the display
  shows, like a signal switching: brief torn horizontal slices, hard stepped
  frames, never eased, kept deliberately small. Reduced motion: instant. (A
  soft eased reveal was tried first and was too smooth to notice.)
- **Pixel mark.** The logo is Jakob's 32 × 32 pixel drawing
  (`public/images/branding/logo-pixel.png`), drawn as SVG squares
  (`PixelLogo`), always 1:1. It is treated as a tiny screen: a faint bloom of
  its own colour (never a coloured glow), still at rest, a short
  signal-glitch burst on hover, and a pulse while upcoming / blink while
  live. Don't generate it: sampled and hand-traced pixel or dot-matrix
  versions of the trophy were unrecognisable.
- **Phones:** the display is a step smaller so a readout or the VS picker
  fits a 375px screen; key labels shrink only below `sm`.

## Interaction states

- Card hover: border turns accent. Every linked card and plate rests on a
  neutral border; a curse card's accent border is its mark, not a link state.
- Stacked plates (the season and player indexes) do not share hairlines:
  they sit 12px apart so each reads as its own plate. (Corner registration
  marks on top were tried and dropped.)
- Link: underlined at rest, accent on hover. Exception: names and seasons
  inside tables stay plain until hover, so a table reads as data, not links.
- Focus: 2px solid accent outline, 2px offset.
- Table rows: no hover state.
- No spinners on actions that navigate away (e.g. Google sign-in).
- Detail on demand: a number or word with more behind it is a native-popover
  trigger marked with a dotted underline. There is ONE popover on the site,
  the `Popover` primitive, and one list inside it, `RecordLines`; both are
  styled by `Popover.module.css`, so every popover opens, positions and reads
  alike (13px rows, a 12px mono heading). Never add a second popover
  stylesheet — give `Popover` a new `tone` if a trigger needs a new look.
  Prefer a popover to a `<details>` row when the detail is supplementary; keep
  `<details>` for folding away more of the same list (`UnrankedRows`).

## Admin

A timing sheet, not a KPI dashboard: label left, mono figure right, hairlines
between, no accent on figures. Dates as plain `YYYY-MM-DD`. The dashboard owns
the page's one heading; panels take a mono eyebrow. The bordered `Button` is
for forward actions; a destructive one is a muted mono text button that turns
accent on hover/focus, and accent elsewhere is reserved for stop signals
("Ingen tilgang").

## Anti-slop rules

**De-slop toward brand intent, never toward another generic.**

- No purple/indigo accent or gradient.
- No Inter-only, no Space Grotesk, no untouched Geist.
- No coloured glow shadows, no reflexive glassmorphism.
- No coloured left/top border stripe on cards.
- No `rounded-2xl shadow-lg` on everything.
- No fade-up-on-scroll on every section.
- No emoji as icons, no Sparkles icon.
- No arrow glyphs on links (→).
- Body text meets WCAG AA. Touch targets ≥ 44px. Focus states always visible.
