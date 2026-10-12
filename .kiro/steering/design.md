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
| `--color-accent`        | Pinkish-red. The single accent |
| `--color-text`          | Body text                      |
| `--color-text-muted`    | Metadata, labels               |
| `--color-border`        | Structural borders             |
| `--color-border-accent` | Red-tinted border              |

**Accent at rest:** leaderboard rank 1, champion callouts, the gamer-card
diagonal. Everything else earns accent on interaction.

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

## Interaction states

- Card hover: border turns accent.
- Link: underlined at rest, accent on hover.
- Focus: 2px solid accent outline, 2px offset.
- Table rows: no hover state.

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
