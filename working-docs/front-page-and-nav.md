# Front page + site navigation — refinement

Status: **round 2 done (2026-10-14).** Decided points are under "Already
decided"; round 2's feedback and what it produced are under "Round 2". The
page's content and structure are next, as a workshop (see the end of
"Round 2").
Prototypes are throwaway routes under `src/app/proto/` (see "How to view"),
built on the real data layer. Delete that folder (and the `three` dependency, if
the 3D direction is dropped) once the real front page lands. Started 2026-10-14
from a product (PO) pass and a design pass run in parallel, then prototyped.

## Already decided (Jakob, 2026-10-14)

- Nav links live in the **header**, so no page has to be reached via `/`.
- A **/vs index** exists, as **two dropdowns + a "go" button** (not a matrix).
  Partial vs links land on the same picker with one side pre-filled.
- `/` gets a **visually striking top fold**. "Latest season + champion" is one
  option, not a given. The 3D-trophy-with-effects idea is in scope to explore.
- Everything in the old TODO notes about the front page is open for challenge.

Round 2 (Jakob, 2026-10-14):

- **/vs routing:** `/vs` and `/vs/<a>` are ONE page (optional catch-all
  `vs/[[...a]]`), the picker with side A pre-filled from the path; no query
  params. `/vs/<a>/<b>` stays its own route with two mandatory slugs. Verified
  in Next 16: the two coexist, `/vs/a/b` resolves to the two-slug route, and an
  unknown or extra segment 404s (`src/app/proto/vs/`). The picker component
  itself will be reworked when built; the pattern stands.
- **Header: option B** (two tiers). Next: make it feel more Teenage
  Engineering than "simple grids".
- **Hero: the light-breaking trophy (Lysbrudd)** over three.js, but it must be
  brought into the design language. The engraving moment is wanted.
- **The physical trophy exists** and can be scanned (relevant if 3D returns).
- **Content and structure of the rest of the page:** to be workshopped. The
  round 1 prototype below the fold is a set of assumptions, not a proposal.

## What exists today (facts the work has to deal with)

- `/` redirects to `/sesong/04`.
- (Resolved 2026-10-14: the old `SeasonHeader`, which broke at S5, is
  replaced by the built `SiteHeader`.)
- `SeasonMeta.date` is a free-text string (`'13/12/2025 – 14/12/2025'`). A
  countdown, a live pill, "days as champion" and a "just crowned" window all
  need real `start`/`end` dates. That is a static-data change, not a DB change,
  and it is a **prerequisite** for any lifecycle-aware front page.
- The trophy asset is `public/images/branding/trophy.svg`: laurel wreath + controller
  (path 0; path 1 is a near-duplicate), a stepped plinth with a hole (path 2),
  and a plaque (path 3). The plaque window is a natural nameplate.

## Where PO and design agree

1. **The front page is four states of one page**, driven by the current
   season's status plus dates:
   - **Idle** (about 85% of the year)
   - **Countdown**
   - **Live** (2 days, but a large share of all visits)
   - **Just crowned** (1–3 weeks)

   A champion-only hero goes stale a month into the idle stretch.

2. **The trophy, not a person, is the timeless hero.** It never goes stale,
   it's what everyone plays for, and it doesn't wait on hero portraits that
   don't exist yet.
3. **Engrave the winners on the plinth plaque**, one plate per season, with
   empty plates waiting for future winners. Champion history in one glance.
4. **Live takes over the fold.** During the event nobody wants a rotating cup
   between them and the standings. The trophy shrinks to a corner.
5. **Just crowned is the champion's moment.** The new name is engraved on the
   plaque, then it decays back to the idle trophy.
6. **No hamburger.** There are only four destinations, and hiding them
   recreates the discoverability problem being fixed.
7. **/vs picker:**
   - native `<select>`s, a "go" button, a swap control;
   - each list disables the player chosen in the other;
   - it's a GET form, so it works without JS;
   - the same component appears on /vs, the front page and career pages, and a
     compact one-row version replaces the pair switcher on `/vs/[a]/[b]`.
8. **Restraint in effects.** Bloom only on specular highlights, subtle grain.
   No chromatic aberration, no scanlines, no constant particles. The only
   particles on the site are a one-off spark burst at "just crowned".

## Where they differ (needs Jakob)

| Topic                      | PO                                                                                                            | Design                                                                                                                                       |
| -------------------------- | ------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| Header                     | One row: GG · Sesong ▾ (dropdown listing champions) · Spillere · Rekorder · VS, plus a LIVE pill at the right | **B:** constant tier 1 (site nav) plus a contextual tier 2 row: season readout on season pages, pair picker on /vs, tournament status on `/` |
| Mini all-time board on `/` | Yes: top 4 as a door to /records ("who leads all-time" is the most-asked question)                            | No: doors only, keep the board on /records                                                                                                   |
| "Alive" layer              | One record plate per day, seeded by date so everyone sees the same one (chat-shareable)                       | 2–3 plates auto-picked (records broken last season, else headline ones)                                                                      |
| 3D depth                   | Faux-3D is likely 80% of the effect at 10% of the cost                                                        | Real three.js extrusion now; a modelled GLB or photogrammetry can drop in later                                                              |
| Partial-vs URL             | `/vs/[a]`                                                                                                     | `/vs?a=` or `/vs/[a]`, either                                                                                                                |

## Prototypes: what they showed

All of these live at `/proto` (index) in the dev server. The front page
(`/proto/forside`) carries a panel that switches lifecycle state, hero variant
(3D / CSS / Lysbrudd), metal and effects, so the three heroes below are compared
in place.

1. **3D trophy** is clearly the strongest.
   - **Geometry:** extruding `trophy.svg` with three.js works directly, with
     deeper bevels so it doesn't look cookie-cutter.
   - **Lighting:** a custom "studio" environment of softboxes, plus a white key
     light and an accent rim light. With that it reads as real gold, not dull
     bronze.
   - **Plaque:** engraved with the real winners: `01 TOBIAS · 02 TOBIAS ·
03 JAKOB · 04 JAKOB`.
   - **Panel:** demos every lifecycle state, metal and effect toggle:
     - Countdown: graphite trophy with a pulsing rim light.
     - Live: the fold becomes the standings.
     - Just crowned: the camera moves in to the plaque, a laser engraves the
       new name, sparks fire, then the camera pulls back.
   - **Below the fold**, the same page sketches the rest (season
     rows doubling as a trophy cabinet, a record plate, a diagonal portrait
     strip, the VS picker).
   - **Mobile:** checked at 375px.
2. **CSS faux-3D** reads as a gold badge or coin, not
   an object. It's fine as the poster, reduced-motion fallback, or small
   placements (the season rows), but not as the hero. **This answers the PO's
   80/20 hunch: the 3D is worth it for the fold.**
3. **Lysbrudd** is a backlit silhouette with light
   shafts through the controller cut-outs, brightening the grid. It is moody,
   very VERKSTED and nearly free in bundle size, but less of a gut punch than
   gold. It could become a layer _behind_ the 3D trophy later.
4. **Header (`/proto/header`)** shows A, B and C built at desktop and
   phone sizes:
   - **B** is the only option that keeps all nav visible on a phone _and_ gives
     the front page's status/countdown/live a home.
   - **C**'s "seasons with champions" sheet is lovely, but hides the seasons.
5. **VS picker (`/proto/vs`)** demos the empty, pre-filled (`?a=jakob`)
   and complete states, plus the compact row in the tier-2 header. Submitting
   goes to the real `/vs/[a]/[b]` page; without JS the GET form redirects
   there.

## Recommendation (for discussion)

- **Fold:** the 3D trophy (H1) with lifecycle states. Engraved plaque, one-time
  signal light → glint intro that settles (no endless loop), pointer tilt.
  Live takeover. Just-crowned engraving moment.
- **Header:** **B**, with the PO's LIVE / countdown pill folded into tier 2 on
  `/`. Revisit C's champion sheet for tier 2 on season pages once there are
  more than about 8 seasons.
- **Below the fold:**
  1. Season rows (newest first, champion in accent, small trophy per row, the
     upcoming season as an unlit row).
  2. One daily record plate (PO's seeded-by-day idea).
  3. Portrait strip as a door to /spillere.
  4. VS picker inline.

  The mini all-time board is Jakob's call (see questions).

- **Technical shape:**
  - `app/page.tsx` stays a Server Component (champion, state, data).
  - A `'use client'` `TrophyStage` server-renders a **poster image** at the
    first-frame pose, then lazy-imports the three.js scene only when the
    browser is idle, the stage is on screen, WebGL2 is available, and neither
    reduced motion nor Save-Data is set.
  - The h1 (champion name) is the LCP element, so 3D never touches LCP.
  - Vanilla three in one effect, not R3F.
  - Render on demand: stop the loop once settled.
  - Cap DPR at about 1.75.
  - three.js adds about 160 KB gzipped, on the front page only.

## Prerequisites before building

1. Structured season dates (`start`, `end`) on `SeasonMeta`, keeping the display
   string, so the page can work out its lifecycle state.
2. Decide the "just crowned" window length.
3. The header has to change anyway (it breaks at S5), so it can ship first and
   independently of the front page.

## Open questions for Jakob, ranked

1. **Is the trophy the hero (object) or the champion (person) in the idle
   state?** The prototypes argue for the object.
2. **Gold as the hero's dominant colour?** It's off-palette, but the prototype
   shows what it looks like. Alternatives: steel, or graphite lit only by the
   red rim (switchable in the prototype's panel).
3. **Header B, A or C?**
4. **Should `/` follow the tournament lifecycle?** If yes, how long is "just
   crowned": 2 weeks, or until S5 is announced?
5. **Mini all-time board on `/`, yes or no?**
6. **Motion budget:** animate on load and on pointer, then settle (recommended),
   or a continuously living hero?
7. **Is the just-crowned engraving + spark burst earned, or too much?**
8. **three.js dependency** (about 160 KB gzipped, lazy, front page only), OK?
   It is installed now (`three` + `@types/three`) for the prototype.
9. **VS:** is `/vs/[a]` OK for partial picks, should never-met pairs be
   disabled, and should all pairs be listed under the picker?
10. **Daily record plate:** reuse the existing plate labels (no new copy), or
    new human-written lines?

All copy in the prototypes is bracketed placeholder text and needs
Jakob-written copy before anything ships.

## Round 2: what the feedback produced

### Header: three Teenage Engineering takes on option B (built: Tangenter)

**Outcome (2026-10-14):** Jakob picked Tangenter, and it is BUILT as the real
site header (`SiteHeader`; see TODO.md and design.md "Site header"). Sesonger
and VS are choosers that take over the display; Spillere and Rekorder are
links. The logo is drawn as a dot matrix from
`public/images/branding/logo.svg`; the dot matrix was judged too much for the
hero. The header lab was removed from the prototype; the notes below are the
record of what was compared.

Each one was shown at desktop and phone width, on real data, with switches
for the page context and the tournament state.

1. **Tangenter (keybed).** Nav items are keys: a function number, the label,
   and a small status LED instead of an underline. Tier 2 is a recessed
   dot-matrix display of label-over-value parameters (the OP-1/EP-133 screen
   grammar); on season pages it carries numbered season keys.
2. **Sekvenser (step sequencer).** Tier 2 is a transport: a stop / armed /
   play glyph for the tournament state, then 16 sequencer steps, one per
   season. Played seasons are lit, the selected one is accent, the next one is
   the playhead (outlined while armed, blinking while live).
3. **Tidslinje (tape).** Tier 2 is a time ruler: every season at its real date,
   the gaps measured in months (7, 5, 21), and a NÅ playhead. The next season
   appears on the tape when it is announced.

Shared TE touches: a model code at the end of the rail (`GG–S04`, placeholder)
and tiny index numbers on the nav. The motifs mix freely, for example keys from
1 with the display from 1 or the tape from 3.

### Hero: Lysbrudd brought into the design language (`/proto/forside`)

Diagnosis: the first pass was off-brand because of how the light was drawn, not
the idea. It used soft volumetric glow and gradients (design.md bans glow) and a
black blob with film grain (cinematic rather than instrument). The rework keeps
the idea and changes the drawing. In the hero panel, **Lysstil** switches
between:

- **Rutenett:** light exists only on the 40px grid lines, in three solid steps.
- **Punktmatrise:** light as square dots on an 8px pitch, dot size stepped by
  intensity. It pairs with the header's dot-matrix display.
- **Projeksjon:** light as discrete 1px projection lines, like construction
  lines in a technical drawing.
- **Dis (runde 1):** the first pass, kept for comparison.

In every new style the trophy is a bg-coloured surface that masks the grid,
with a 1px outline, which is what every VERKSTED surface does. There are no
gradients, glow or grain.

**The engraving, merged in.** The winners' names are laser-cut _through_ the
plaque, and the plaque is a light box, so the light pours through the letters.
The newest name (the reigning champion, rank-1 data) is lit in accent; the
others in text colour. In the crowned state:

1. The trophy scales up around the plaque and drifts clear of the copy, while
   the grid stays put (the 2D counterpart of the 3D camera dolly).
2. A laser dot cuts the new name letter by letter, and light comes through each
   letter as it is cut.
3. The trophy returns to rest.

Open points for the hero:

- Jakob (2026-10-14): Punktmatrise is too much here and arrives too
  suddenly; the dot matrix moved to the header logo instead. (Superseded by
  round 3, below.)

- Which style (or a mix: e.g. Punktmatrise at rest, Rutenett while counting
  down)?
- In the crowned state the strongest light steps go accent. Is that too much
  accent, or earned for the one moment it happens?
- At rest the plaque names are small. Fine as a detail you discover, or should
  they read without the zoom?
- The trophy is drawn from `trophy.svg`. A scan of the real trophy could give
  a more exact silhouette and plaque layout for this 2D treatment too.

### Content and structure: assumptions to workshop

The below-the-fold prototype bundles these assumptions; each is open:

1. That the page is lifecycle-driven at all (idle / countdown / live /
   crowned), and that live takes over the fold.
2. That the hero pairs the trophy with the **champion** as the headline, and
   with a readout of points / margin / titles / days as champion.
3. That seasons appear as a list (newest first) on the front page at all.
4. That there is a "record of the day", and that it is a record plate.
5. That players appear as a portrait strip.
6. That the VS picker belongs on the front page.
7. The order of sections, and that there are four.
8. What is _missing_: e.g. the all-time board (PO wanted a top-4), "what
   changed last season", upcoming-season info, media, links out to the group
   chat.

Suggested format: start from the question "what is `/` for, for a 5–10 person
audience, between tournaments?", inventory every candidate block (the eight
above plus new ones), then sort them into must / maybe / no and order the
musts. Prototype only after that.

## Round 3 (Jakob, 2026-10-14) and what it produced

Feedback:

- **Engraving:** the engraved names don't work inside the Lysbrudd hero, so
  they were removed. The engraving moves to its own "just finished" scene
  (TODO.md), probably in a completely different trophy style.
- **Cut-outs:** the round 2 styles all read as a trophy cut-out in front of a
  pattern. The fog works because it is one cohesive scene. So dots and lines
  must _draw the trophy too_, not sit behind it.
- **Fog:** keep exploring, but integrate it with the design language, e.g.
  make it a physical component of the grid.
- **Projeksjon:** dropped.
- **3D as dots:** a 3D model underneath, displayed as a point matrix, is
  worth trying.

What `/proto/forside` now has:

- **Lysbrudd** (the light shader) computes the scene once as light: fog, rim,
  a faint body and an all-round edge. It then renders that light through ONE
  mechanism, so the trophy is made of the same marks as the light:
  - **Gitter:** the fog behind the grid, which is now a physical grille. Each
    40px cell is a pane lit from behind, falling off toward its edges, and the
    grid bars block the light. This is the "fog as part of the grid" attempt.
  - **Konturer:** the light quantised into 7 flat bands with 1px contour lines
    between them. It reads like a topographic map of the light; the lines are
    a little jagged where the light sampling is noisy.
  - **Punkter:** everything as a square halftone, 5px pitch aligned to the
    grid (8 dots per cell), sampled once per cell.
  - **Linjer:** everything as a horizontal line screen (engraving), 5px pitch.
  - **Dis (runde 1):** kept for comparison.
  - All styles fade out toward the canvas edges, so the light never ends in a
    seam.
- **3D → halftone.** The three.js trophy (extruded SVG, lit, rotating, with
  pointer tilt) has a new **Visning** switch: Skyggelagt (as before),
  **Punkter** or **Linjer**. The rendered frame is converted per 5px cell into
  dots or engraving lines. The marks keep the frame's hue, so the gold reads
  as gold dots and the red rim light as red ones. The 3D trophy then exists
  only as dots or lines, with real shading, highlights and motion. A scan of
  the real trophy would drop straight into this.
- **Candidate list:** the PO's candidate list for the content workshop is in
  `working-docs/front-page-candidates.md`.

## The physical trophy (answered 2026-10-14: it exists)

Jakob has the real trophy and can scan it, so a scan replaces the SVG
extrusion as the 3D model. The scene is already built for it:

- **Drop-in path:** export the scan as `public/models/trophy.glb`. When the
  file exists, `/proto/forside` loads it instead of extruding `trophy.svg`
  (the panel says which model is in use). It is scaled to the same size and
  lit by the same studio environment, rim light and glint.
- **Scanning:** a phone photogrammetry app (Polycam, Scaniverse, Reality
  Scan, or Apple Object Capture on iOS). Reflective metal is the hard case:
  - Diffuse, even light: overcast daylight or a light tent, with no hard
    specular highlights. They get baked into the texture.
  - If the gold mirrors too much, a removable matte scanning spray (or dry
    shampoo / talc in a pinch) gives the app texture to track. The real gold
    material is then re-applied in three.js rather than taken from the scan.
  - Turntable or walk-around at two or three heights, then a pass from above.
- **Export:** GLB, decimated to roughly 50–150k triangles, textures 2K. Keep it
  under about 5 MB. Draco/meshopt compression comes later in the real build.
- **Material choice:** either keep the scan's baked texture (authentic,
  scratches and all) or replace it with the tuned metal material and use the
  scan for shape only. The prototype keeps the scan's own materials; the metal
  switch only affects the extrusion. Decide once the scan is in and both can be
  compared.
- **Plaque:** with a scan, the engraved plates are a separate plate laid on
  the front of the base. Its position (`PLATE_Y`, `PLATE_W` in
  `src/app/proto/_components/trophyScene.ts`) needs calibrating to the real
  object, or to a real nameplate if the trophy has one.

## How to view

```bash
npm run dev
```

Then open `http://localhost:3000/proto`. (`.claude/launch.json` has this as the
`next-dev` config for the Claude browser pane.) The routes are `noindex` and
not linked from the site; they hide the site header and use header option B.

Data notes:

- The prototype reads the real results layer: champions, standings, game
  counts, the record plate and the portraits are live data.
- Countdown, live progress (`Spill 6/9`) and the crowned figures are demo
  values. The crowned demo engraves a player who has never won.
- The test hook `window.__advance(seconds)` steps the 3D animation
  deterministically, for screenshots.
