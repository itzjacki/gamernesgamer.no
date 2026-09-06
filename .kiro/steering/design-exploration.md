# Design Exploration — Phase 2 Notes

Decisions and observations from the visual identity exploration session.
This is a working document — updated as the refinement progresses.

---

## Status

Direction chosen: **VERKSTED**. All tokens locked. Moving to full component set build.

Prototype lives at `/prototype`.

---

## VERKSTED

### Concept

"Indie high performance." The design vocabulary of a precise, hand-built object —
not a corporate product, not a consultancy. Think Teenage Engineering as a _reference
point for sensibility_, not a template to copy. The restraint is the identity:
everything is clean and purposeful by default, accent color used sparingly.

### Locked tokens

**Palette:**

- Background: `#17181a` (cold graphite)
- Surface: `#1c1d1f` (single-step lift — functional grouping only, no shadow)
- Accent: `#E8334A` (pinkish-red, red-first pink-second — distinctive vs F1 crimson)
- Text: `#E6E1DB` (bone/paper warmth from yellow channel, not competing with accent)
- Text muted: `#706b66` (solid — no transparency, avoids double-border darkening)
- Border: `#222120` (solid near-black with faint warm cast)
- Border accent: `#4a2028` (solid dark red-tinted — clearly red without being full accent)

**Typography:**

- Display + body: Neue Montreal (Extrabold 800 headings, Regular 400 body)
  Files in `public/fonts/neue-montreal/`
- Metadata labels: Martian Mono (section callouts, stat tags, table headers only)

**Grid:**

- `rgba(232,216,216,0.04)`, 40px cells
- Centered: `background-position: calc(50% + 20px) calc(50% + 20px)`
- Container: 880px (22 × 40px), padding 41px per side
- Content edges land on grid lines with 1px clearance

**Surface language:**

- Surfaces use exact background color `#17181a` — they mask the grid beneath
- Grid lines continue through table row dividers at the same weight
- Content and grid feel like one system
- No shadows. Crisp borders, 3px radius.

**Border system:**

- Default border weight matches grid line weight — structural borders and dividers
  are the same visual weight as the grid
- Standalone card hover: border shifts to full accent `#E8334A`
- Table rows: no hover state (read-only, narrow, nothing to track across)
- Buttons and deliberately prominent components may differ from grid weight

**Accent at rest:**

- Accent is permitted at rest, used sparingly and with intention
- Confirmed at-rest uses: leaderboard rank 1, champion callouts, card diagonal
- Everything else earns accent through interaction

**Interaction states:**

- Standalone card hover: border → accent
- Link: underline at rest, color → accent on hover
- Focus ring: `outline: 2px solid #E8334A; outline-offset: 2px`
- Disabled / error states: deferred (admin-only concern)

**Mobile grid:**

- Step max-width down in 40px increments as viewport narrows
- Toggle the 20px offset at each breakpoint to keep content edges on grid lines
- Below the smallest useful grid width, grid becomes texture only — drop alignment

**Spacing:**

- Tailwind's built-in spacing scale used as-is — no additional vertical rhythm system

### Signature material moment (deferred)

Dark chrome treatment on gamer cards: near-black surface with a broad specular
highlight tracking the tilt. Requires a card redesign (current SVG shape fights it).
Scoped to a later implementation stage.

### What was rejected and why

- **Orange accent** — too close to Teenage Engineering. Strongest "TE clone" signal.
- **`#E5375A` accent** — too pink, too close to Bulder bank.
- **Two-color system (red + teal)** — tested, felt chaotic. Single accent is more disciplined.
- **Brushed aluminium / anodized card treatment** — fights the irregular SVG card shape.
- **Transparent surfaces** — grid showing through content created visual noise.
- **Fainter grid** — loses character. Full weight with surfaces masking it is the balance.
- **Vertical rhythm enforcement** — browser can't precompute height like width. Not maintainable.
- **Table row hover states** — read-only data, narrow table, no tracking need. Removed.
- **Row background wash on hover** — unnecessary given no hover states on table rows.

---

## Cross-direction notes (archive)

PRISME and KRITT were explored and discarded. Their prototype files remain in
`src/app/prototype/` but are not imported. Can be deleted at any time.

### Interaction budget

The tilt effect (existing) is the primary interaction. Additional interactions:

- Dark chrome specular on gamer cards (VERKSTED — tied to card redesign, deferred)
- No reflexive scroll animations
- Motion budget is deliberate

---

## Process

1. ✅ Designer presented 5 directions (VERKSTED, NATTKAMP, RØRLYS, PRISME, KRITT)
2. ✅ NATTKAMP and RØRLYS discarded
3. ✅ Prototype built at `/prototype`
4. ✅ VERKSTED refinement — palette, grid, surface language locked
5. ✅ PRISME discarded
6. ✅ KRITT discarded
7. ✅ Typography locked — Neue Montreal + Martian Mono
8. ✅ Final direction selected: **VERKSTED**
9. ✅ System review — all tokens and interaction rules finalised
10. ✅ Full implementation — all pages and components updated
11. ⬜ Section heading hierarchy — mono labels too quiet as section headings, needs a deliberate solution
