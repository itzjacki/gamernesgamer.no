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

## Tokens

Values live in `src/styles/global.css` under `@theme`. Use the tokens, never raw
hex (one exception: the season trophies' real gold, silver and bronze). All
colours are solid — no transparency, because overlapping translucent
borders double up.

| Token                   | Role                           |
| ----------------------- | ------------------------------ |
| `--color-bg`            | Page background                |
| `--color-surface`       | Single-step surface lift       |
| `--color-display`       | The header's recessed display  |
| `--color-accent`        | Pinkish-red. The single accent |
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
tried on /vs and dropped.) No portraits on the /records boards and plates:
one player holding several plates would repeat the same face, and identity is
the roster's and the hero's job.

## Career page

The ledger is an instrument panel with large mono figures. A plain
label-left/value-right `StatList` was tried and read flat next to the trophy
shelf and cards.

**Type:** Neue Montreal (self-hosted) for display (800) and body (400); Martian
Mono (400) for metadata.

**Type floor:** no text below 10px. Labels are `SectionLabel` (mono, xs,
widest tracking, muted), placed above a block's frame with `gap-6`, never
inside it; on a page whose blocks are its sections, render it `as='h2'`.

## Grid

- 40px cells, `rgba(232,216,216,0.04)`, centred horizontally and anchored to
  the top: `background-position: calc(50% + 20px) 8px`, so the header's
  bottom edge (168px on desktop) is a grid line and every page has the same
  rows whatever its height. Vertical sizes and gaps below the header come in
  whole cells (40px; the front page stacks its blocks 120px apart).
- Container `max-w-220` (880px = 22 cells) with `lg:px-10`, giving an 800px
  content width (20 cells).
- The grid scrolls with the page. Alignment is a desktop feature: on mobile the
  grid is texture only, with normal padding (`px-4 sm:px-6`).

## Surfaces

- Surfaces use `bg-bg` — they mask the grid rather than float above it.
- Grid lines continue through dividers at the same weight.
- No shadows. No border radius on grid-aligned components.

## On the hero

What sits on the trophy hero (`GgIntro`, `LiveSideBlock`, `ChampionSideBlock`,
`SeasonCountdown`, `SeasonReveals`) is either bold type straight on the scene or
an ordinary bordered element. No scrims, halos, masks or faded edges: they were
tried and looked bad.

- **Type on the scene:** only large bold white display type (the dormant
  "Gamernes Gamer" h1, the countdown's numerals) and its `text-text` mono
  labels. Never `text-text-muted` directly on the scene: it fails AA against
  the lit fog.
- **Bordered elements:** solid `bg-bg` with `border`, like the site's panels
  (live block, reveals row, the champion's footer). Muted labels are fine
  inside them. Whole-block links take the accent on their border on hover.
- **Champion:** their picture is the block, unframed and unmasked, with a
  solid footer (name, season, points, titles); with no picture the footer
  stands alone.
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
  - **Sesonger:** season keys, then "Alle" (the index) in its own cell behind
    a full-height hairline.
  - **Spillere:** player keys, then "Alle" in the same way.
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

- Card hover: border turns accent.
- Stacked plates (the season and player indexes) do not share hairlines:
  they sit 12px apart so each reads as its own plate. (Corner registration
  marks on top were tried and dropped.)
- Link: underlined at rest, accent on hover.
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

## Deferred

Gamer-card redesign: the card is the prime candidate for a visual centrepiece
(chrome specular highlights tracking the tilt, material surfaces). Not started —
the current SVG shape limits it. Tackle it when a feature calls for it.
