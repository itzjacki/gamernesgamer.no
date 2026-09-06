# Design

## What this site should feel like

Gamernes Gamer is a monument to a friends' gaming tournament — a place for
reminiscing, rivalry, and celebration. The tone is **competitive and unique**,
**niche and specific**, never corporate. It should feel like something a real
person made for real people, not a product landing page or a gaming content
platform.

The site is dark mode — non-negotiable. No multiple themes.
The FIFA card concept is an existing core visual asset and should evolve, not
be replaced.

**None of the current design is written in stone.** The Phase 2 rebrand is
an open exploration. What follows describes the starting point and the constraints
that should govern any new direction.

---

## Current state (pre-rebrand)

As of Phase 1, the site uses:

- **Fonts:** Inter (body) + Quantico (display/headings) from Google Fonts
- **Palette:**
  - Background: `#1d1a1f` (near-black with a purple-grey cast)
  - Surface: `#2a252c`, `#334d51`, `#1c2a2c`
  - Accent red: `#db5461`
  - Accent teal: `#73c9bb`
  - Text: white
- **Components:** hand-rolled, no component library
- **Layout:** centered column, mobile-first

The Inter + Quantico pairing was inherited from the Astro version. It works but
is not locked in — see typography guidelines below.

---

## Phase 2 rebrand direction

**Process:** Two-stage exploration before any implementation.

1. **Visual identity session** — the UI/UX designer presents three genuinely divergent
   directions as mood boards / design vocabularies. No tokens, no code. Jakob reacts
   and selects one direction.
2. **Prototype phase** — the selected direction is prototyped using the `prototype` skill
   (toggleable UI variations on a single route) so Jakob can see it running before
   committing to full implementation.

**Non-negotiables (hard constraints, not up for exploration):**

- Dark mode only. No multiple themes.
- No retro gaming aesthetic.
- No "newspaper sports page" aesthetic.
- None of the overused styles named in the anti-slop rules below.

**On the anti-slop color rules:** Purple/indigo, violet accents, and similar defaults are not hard-banned — they are high-risk. If a direction genuinely commits to them with intention and avoids the tell-signs (stock gradient, default accent, no dominant color), they can work. But the bar is high and the burden of proof is on the designer. When in doubt, avoid.

**"Playing with light" (refractions, rays, glow) is one candidate direction, not a
constraint.** The designer should treat it as one option among genuinely different
alternatives. All three directions must be dark-mode native.

**Scope of the identity exploration:**

The exploration focuses on visual identity expressed through core components —
not page structure (The Hall, season pages, etc.). Specifically:

- Typography (display + body pairing)
- Base color palette (dominant color + accent)
- Links and interactive states
- Player cards (FIFA-style gamer cards — useful test surface, not primary deliverable)
- Content cards (game cards)

Page layout and structure work is separate and comes after direction is chosen.

**What to preserve:**

- The FIFA card as a core visual identity — evolve it, don't scrap it
- Dark background (the site has always lived in the dark)
- The competitive-but-friendly tone

**What the exploration must decide:**

- New color palette (dominant color + accent — see palette rules below)
- Typography evolution (see typography rules below)
- Surface language (borders vs shadows, radius, depth)

**Process note:** The three directions must be genuinely divergent from each other —
not three variations on the same aesthetic. If directions feel adjacent, push back
and demand more divergence. The value of three options is real choice, not confidence
inflation.

---

## Anti-slop rules (apply to all design work, including Phase 2)

These are sourced from documented AI design tells (Krebs' design-slop study,
~1,400 sites; funboy322/avoid-ai-design; human-craft/humanize-design). They
describe what to actively avoid when an AI agent or designer is proposing or
implementing a visual direction.

The prime directive: **de-slop toward brand intent, never toward another generic.**
Removing one cliché only to install a different one is a failed run.

### Color

- No purple/indigo → blue hero gradient. The single most-cited "we used AI" signal.
- No violet/purple as the default dark mode accent. Choosing nothing produces violet;
  that's the tell.
- No evenly-distributed pastel rainbow palette. Commit to one dominant color + a
  sharp accent. 60/30/10 rule.
- No gradient-filled headline text.
- No colored glow `box-shadow` on cards (vibrant shadow like `shadow-indigo-500/50`).
  Use shadow for elevation, not color theater.
- Flat confident color beats a timid gradient. If you use a gradient, keep it tonal
  within a single hue, or a deliberate duotone — never the stock indigo wash.

### Typography

- No Inter as the only typeface. It is the #1 AI default. Either pair it deliberately
  with a display face, or replace it.
- No Space Grotesk as the "I tried" upgrade — it became the second-order default.
  Anthropic calls it out by name as overused in AI output.
- No Geist shipped untouched from a Next.js starter (not currently used, keep it that way).
- No single weight/size ramp with no personality.
- No serif-italic accent word dropped into a sans headline as a cheap editorial gesture
  ("The _ultimate_ tournament") — a recognised Claude signature, avoid it.
- Do choose a typeface with a point of view: a display face for headings + a clean body
  face. Pair them. Typography is the cheapest, highest-impact way to stop looking generated.
- Quantico (current display font) is a real choice with personality. Keep it or
  consciously replace it — don't drift into something blander.

### Layout

- No centered eyebrow + 64px headline + subhead + two CTAs as the reflexive hero.
  Break the symmetry. Asymmetric, editorial, left-aligned, or type-driven.
- No three-up identical feature cards. Let content dictate column count and density.
- No bento grid unless content genuinely requires varied tile sizes.
- No uniform `container mx-auto px-4` everywhere. Vary container width by section role.
  Some things go full-bleed, some stay narrow.

### Components & surfaces

- No colored left/top border stripe on cards. "Almost as reliable a tell as an em-dash."
- No glassmorphism/`backdrop-blur` by reflex. Use it only where real layering exists.
- No soft `rounded-2xl shadow-lg` on everything. Vary radius and elevation by role;
  reserve strong shadows for things that genuinely float.
- No default component library tokens shipped unthemed. If we ever introduce a library,
  restyle every token before shipping.
- Pick a deliberate surface language and apply it with restraint: crisp borders _or_
  shadows, not both on everything.

### Motion

- No fade-up-on-scroll on every section. Pick one or two high-impact moments.
  One well-orchestrated entrance beats scattered reflexive reveals.
- No animated gradient blobs drifting in the background.
- Spend the motion budget deliberately: shared easing, shared duration scale,
  one clear entrance language.
- The GamerCard tilt effect is an existing intentional interaction — preserve and
  evolve it, don't reflexively add more micro-interactions everywhere.

### Icons & imagery

- No emoji as system icons (🚀 💡 ✨). Reserve emoji for genuinely casual human
  contexts, not as iconography.
- No default Lucide icon set shipped untouched (currently not used — keep it that way).
- No `Sparkles` icon next to anything. The most worn AI icon pairing of 2024–26.
- No stock 3D glossy blob illustrations or abstract gradient orbs as filler art.
- Real photography of real people is an asset — lean into it (the gamer card portraits
  are a strength of the existing design).

### Copy

- No vague aspirational filler. "The ultimate gaming experience" says nothing.
  The copy should be specific, Norwegian, and written as if by someone who was there.
- No arrow glyphs stapled to link text (→). A real directional affordance uses an
  icon component; a raw arrow character is a Claude signature, avoid it.
- No placeholder content shipped as if real.

### Accessibility (non-negotiable, not just anti-slop)

- Body text must pass WCAG AA contrast on dark backgrounds. This is the most common
  functional defect in AI-generated dark themes.
- Touch targets ≥ 44px.
- Visible focus states — never removed.
- Real labels on form inputs, not placeholder-only.

---

## How to use these rules with an AI agent

When asking an AI to propose or implement design work:

1. **Give it a real reference, not a vibe word.** "Playing with light" is a starting
   point for conversation, not a prompt. Supply a URL, a screenshot, a print reference,
   an era, a specific product — something concrete to anchor to.
2. **Name what it must not do.** Explicit negative constraints override statistical
   defaults more reliably than positive ones alone. The rules above are the blocklist.
3. **Ask for multiple radically different directions**, not one answer. Convergence
   is the failure mode; multiple options force genuine divergence.
4. **Critique by tell, not by vibe.** If a proposal looks off, use the taxonomy above
   to name what's wrong specifically. "It looks AI" is not actionable. "It defaulted
   to indigo and Space Grotesk" is.
5. **Anchor to the brand's existing assets first.** The gamer card portraits, Quantico,
   the reddish/blueish palette — these are real decisions already made. Start from them,
   don't ignore them.
6. **One dominant color.** Any proposed palette that spreads color evenly across five
   accents has not committed. Push back until there's a clear dominant.
