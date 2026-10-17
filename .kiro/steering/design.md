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
hex. All colours are solid — no transparency, because overlapping translucent
borders double up.

| Token                   | Role                           |
| ----------------------- | ------------------------------ |
| `--color-bg`            | Page background                |
| `--color-surface`       | Single-step surface lift       |
| `--color-display`       | The header's recessed display  |
| `--color-accent`        | Pinkish-red. The single accent |
| `--color-text`          | Body text                      |
| `--color-text-muted`    | Metadata, labels               |
| `--color-border`        | Structural borders             |
| `--color-border-accent` | Red-tinted border              |

**Accent at rest:** leaderboard rank 1, champion callouts, record-holder
figures on /records, the gamer-card diagonal. Everything else earns accent on
interaction. Rank-1 data may take it freely; it doesn't need rationing to one
mark per page.

On a two-player page (/vs) "ahead of the other" is not rank-1 data: never
accent the leader of a stat, or a one-sided pairing paints one side red. The
relation is shown by position (a needle on a gauge) or by weight (the
placement that finished ahead in plain text colour, the other muted).

Rule of thumb for any page: every screenful should carry some accent. Where
there is no rank-1 datum to spend it on, put it on the instrument rather than
on a person — on /vs that is the masthead diagonal and every gauge needle,
alongside the real rank-1 data (season wins, moment figures, game wins in the
popovers).

**Type:** Neue Montreal (self-hosted) for display (800) and body (400); Martian
Mono (400) for metadata.

## Grid

- 40px cells, `rgba(232,216,216,0.04)`, centred with
  `background-position: calc(50% + 20px) calc(50% + 20px)`.
- Container `max-w-220` (880px = 22 cells) with `lg:px-10`, giving an 800px
  content width (20 cells).
- The grid scrolls with the page. Alignment is a desktop feature: on mobile the
  grid is texture only, with normal padding (`px-4 sm:px-6`).

## Surfaces

- Surfaces use `bg-bg` — they mask the grid rather than float above it.
- Grid lines continue through dividers at the same weight.
- No shadows. No border radius on grid-aligned components.

## Site header ("Tangenter")

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
- **The display glitches, it doesn't slide.** Every change glitches in over
  what the display shows, like a signal switching:
  - **The frames:** for ~220ms the new frame arrives in torn horizontal
    slices, each nudged 1–3px sideways, with the old frame showing through the
    gaps and a faint 1px translucent white tear jumping between rows. Hard
    stepped frames, never eased, and kept deliberately small.
  - **Switching and closing:** switching choosers glitches the new one in over
    the old, and closing glitches the readout back.
  - **Reduced motion:** instant.
  - **History:** a soft eased reveal was tried first and was too smooth to
    notice.
- **Pixel mark.** The logo is Jakob's 32 × 32 pixel drawing
  (`public/images/branding/logo-pixel.png`), drawn as SVG squares in
  `currentColor` (`PixelLogo`), always 1:1 (32px) at every breakpoint. It is
  treated as a tiny screen:
  - **Bloom:** a faint bloom of the mark's own colour (an SVG blur under the
    sharp pixels, never a coloured glow).
  - **Rest:** still, with no idle flicker.
  - **Hover:** a 260ms signal-glitch burst (thin row bands jolting 1–2px).
    The turn to accent is delayed ~110ms with a 60ms fade so it lands on the
    burst's crux.
  - **Tournament state:** it can carry it (a pulse while upcoming, a blink
    while live).
  - **Don't generate it:** sampled and hand-traced pixel or dot-matrix
    versions of the trophy were unrecognisable.
- **Sizes.** The rail is 56px on phones and 64px from `sm` (640px) up. Key
  labels are large (12px, widest tracking) from `sm` up and shrink only below
  it. The display goes the other way: its values, keys, selects and padding
  are a step smaller on phones (12px values, 24px keys, 112px selects), so a
  readout or the VS picker fits a 375px screen, and full size from `sm` up.

## Interaction states

- Card hover: border turns accent.
- Stacked plates (the season and player indexes) do not share hairlines:
  they sit 12px apart so each reads as its own plate. (Corner registration
  marks on top were tried and dropped.)
- Link: underlined at rest, accent on hover.
- Focus: 2px solid accent outline, 2px offset.
- Table rows: no hover state.
- Detail on demand: a number or word with more behind it is a native-popover
  trigger marked with a dotted underline. There is ONE popover on the site,
  the `Popover` primitive, and one list inside it, `RecordLines`; both are
  styled by `Popover.module.css`, so every popover opens, positions and reads
  alike (13px rows, a 12px mono heading). Never add a second popover
  stylesheet — give `Popover` a new `tone` if a trigger needs a new look.
  Prefer a popover to a `<details>` row when the detail is supplementary; keep
  `<details>` for folding away more of the same list (`UnrankedRows`).

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
