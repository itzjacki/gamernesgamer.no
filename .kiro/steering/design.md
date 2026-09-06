# Design

## Direction: VERKSTED

"Indie high performance." The restraint is the identity — everything purposeful by default, accent used sparingly.

**Reference points:** Teenage Engineering (instrument panel restraint), Braun/Dieter Rams (grid discipline, no decoration without function), motorsport timing sheets (monospace data, hairline rules, information density without noise). Inspiration: Teenage Engineering

## Tokens

All tokens in `src/styles/global.css` under `@theme`.

| Token                   | Value     | Role                        |
| ----------------------- | --------- | --------------------------- |
| `--color-bg`            | `#17181a` | Page background             |
| `--color-surface`       | `#1c1d1f` | Single-step surface lift    |
| `--color-accent`        | `#E8334A` | Pinkish-red. Single accent. |
| `--color-text`          | `#E6E1DB` | Body text                   |
| `--color-text-muted`    | `#706b66` | Metadata, labels            |
| `--color-border`        | `#222120` | Structural borders          |
| `--color-border-accent` | `#4a2028` | Red-tinted border           |

All solid hex — no transparency (overlapping borders double opacity with rgba).

**Accent at rest:** leaderboard rank 1, champion callouts, gamer card diagonal. Everything else earns accent on interaction.

### Typography

| Role           | Font          | Weight    |
| -------------- | ------------- | --------- |
| Display + body | Neue Montreal | 800 / 400 |
| Metadata       | Martian Mono  | 400       |

Neue Montreal self-hosted in `public/fonts/neue-montreal/`. Martian Mono from Google Fonts.

### Grid

- 40px cells, `rgba(232,216,216,0.04)`
- Centered: `background-position: calc(50% + 20px) calc(50% + 20px)`
- Container: `max-w-220` (880px = 22 × 40px), `lg:px-10` (40px per side at desktop)
- Content width: 800px = 20 × 40px
- Grid scrolls with page. Mobile: grid is texture only, normal responsive padding (`px-4 sm:px-6`). Grid alignment is a desktop feature.

## Surface language

- Surfaces use `bg-bg` — masking the grid, not floating above it
- Grid lines continue through dividers at the same weight
- No shadows. No border radius on grid-aligned components.

## Interaction states

- Card hover: border → `#E8334A`
- Link: underline at rest, accent on hover
- Focus: `outline: 2px solid #E8334A; outline-offset: 2px`
- Table rows: no hover state

## Deferred

- Gamer card redesign — the card is a prime candidate for visual centrepieces: dark chrome specular highlights that track the tilt, material surface treatments, and other high-impact moments. None of these are implemented yet. The current SVG shape limits what's possible — tackle this when adding features where it fits naturally.

## Anti-slop rules

**The prime directive: de-slop toward brand intent, never toward another generic.**

- No purple/indigo accent or gradient
- No Inter-only, no Space Grotesk, no Geist untouched
- No colored glow shadows, no glassmorphism by reflex
- No colored left/top border stripe on cards
- No rounded-2xl shadow-lg on everything
- No fade-up-on-scroll on every section
- No emoji as icons, no Sparkles icon next to anything
- No arrow glyphs on links (→) — AI tell
- No placeholder copy shipped as real. All copy Norwegian, written by a human.
- Body text WCAG AA. Touch targets ≥ 44px. Visible focus states always.
