# Design audit

Working doc for the Phase 4 design audit (TODO.md). Delete it once every
finding is fixed, ruled into `design.md`, or moved to `TODO.md`.

**Passes:** 1. code consistency inventory (done) · 2. page-by-page walkthrough,
desktop and phone (done) · 3. cross-page patterns (done) · 4. direction check
(Jakob decides).

Severity: **broken** (breaks a design.md rule or a11y) · **drift** (same role,
different values) · **opportunity**. Effort: **fix** (mechanical, no decision)
· **decide** (needs Jakob).

Admin (`src/app/admin/**`) is out of scope: it has its own timing-sheet rules.

## Settled

Pass 1: weights, legacy tokens and table-link focus fixed. D1 (only the
header and front-page hero keep grid rows), D2 (section headings are mono
labels), D3 (header micro text 8px, phone key labels 10px), D4 (labels
tighten on phones), D5 (table names plain until hover) are in design.md and
applied. Pass 2: P1–P5, P6 (bands may be louder: accepted, noted in
design.md), P7 (catalogue lines above titles) and P8–P11 applied; P12 and P14 accepted as they are.

## Open

- **P8 labels** (copy): `Sluttstilling`, `Poengutvikling`, `Poeng per spill`
  on the season page are placeholders (`TODO(copy)`).
- **`SeasonPointsChart`'s line colour (decide, small):** `#706b66` is not a
  token (`--color-text-muted` is `#8a847e`).
- **P13 — gamer cards** are the brief for Cards part 1 (rounded corners,
  saturated red shapes, colour photos against the rest of VERKSTED).

---

## Pass 2 — page walkthrough (done)

Every public page at 1280px and 375px, plus automated checks (overflow, tap
targets, text size, heading order, alt text). Findings P1–P14 are settled or
listed under Open. Rules that came out of it (design.md, Notation): season naming, placements as "1." next to points, names in tables mixed-case
semibold.

---

## Pass 3 — cross-page patterns (done)

The same idea built more than once, compared in the code. X1–X8 applied:
shared table classes with 40px rows, the `Readout` primitive (three figure
sizes), one `Hero` for champion and career, shared portrait tones, the row
height rule, the career page's catalogue line, and neutral card borders at
rest. The rules are in design.md (Tables, rows and readouts; Portraits;
Interaction states).
