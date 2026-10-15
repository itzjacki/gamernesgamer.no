# Front page + site navigation

Status (2026-10-15): **the header is built; the hero direction is chosen;
the page's content and structure are next** (a workshop, see below).

This doc is the consolidated record of the refinement rounds of 2026-10-14/15
(a PO pass and a design pass, then five rounds of prototypes with Jakob). The
prototypes themselves were deleted in the cleanup; every one of them is in
git at commit `ae9e801` ("add prototyping for front page and headert") if a
detail is ever needed. What survives in `src/app/proto/` is only the chosen
hero (see "Hero").

## Decisions

- **Navigation lives in the header**, so no page has to be reached via `/`.
- **Header: the "Tangenter" two-tier header**, built as `SiteHeader` (see
  "Header").
- **The /vs index:** two dropdowns + a "go" button (not a matrix). Pre-fill by
  path, not query: `vs/[[...a]]` serves both `/vs` and `/vs/<a>` (side A
  pre-filled), and `vs/[a]/[b]` stays a separate route with two mandatory
  slugs. Verified in Next 16: the two coexist, `/vs/a/b` resolves to the
  two-slug route, and an unknown or extra segment 404s. Not built yet; the
  header's VS chooser covers quick picks meanwhile. The picker component will
  be reworked when built.
- **Hero: the trophy, as "Lysbrudd" (Lag + Støv)**, a backlit trophy with light
  breaking through it into a fog, the grid as physical layers (see "Hero").
  Chosen over 3D (three.js) and over every other 2D style tried.
- **The engraving of a new champion's name** is wanted, but as its own "just
  finished" scene, probably in a completely different trophy style. It did
  not work inside the hero (TODO.md).
- **The rest of the page is open:** everything below the fold in the round 1
  prototype was a set of assumptions. The PO's candidate inventory for the
  workshop is in `working-docs/front-page-candidates.md`.

## Header (built)

`SiteHeader` (server: data, the pixel logo) + `SiteHeaderBar` (client), in the
root layout. Full behaviour is in TODO.md (Site navigation) and design.md
("Site header"). In short:

- **Rail of keys:** logo, Sesonger, Spillere, VS, Rekorder. Each key shows a
  function number, its label and a status LED.
- **Display row:** shows one thing at a time. At rest it is the page's
  readout (label over value). Sesonger, Spillere and VS are choosers that
  glitch in over it.
- **Glitch-in transition:** every change glitches in over what the display
  shows, like a signal switching: a chooser over the readout, the next chooser
  over the first, the readout back over a chooser on close. The old frame
  stays until the new one is done.
- **Logo:** Jakob's 32 × 32 pixel PNG
  (`public/images/branding/logo-pixel.png`), decoded on the server
  (`src/lib/pixel-logo.ts`) and drawn as crisp, recolourable SVG squares
  (`PixelLogo`), always 1:1 at 32px (2× read as too heavy), with a faint
  bloom and a glitch burst on hover. Idle scanlines were too weak and an idle
  glitch flicker was unwanted: the mark is still at rest.

What the header rounds taught:

- **Teenage Engineering grammar beats "simple grids":** keys with function
  numbers and LEDs, a recessed display, label-over-value readouts. Of three
  takes (keys + display, step sequencer, time ruler), the keys won.
- **A display that shows one thing at a time works.** Keys with nothing to
  navigate to, or a choice to make, take over the display. Keys with a
  destination stay links.
- **Text on the display must be plain.** A dot-matrix pixel texture over the
  readout was unreadable and clashed with the rest of the type.
- **The logo can't be generated.** Sampling `logo.svg` into dots and
  hand-drawing a 21 × 20 version were both unrecognisable. A purpose-drawn
  pixel logo was needed.
- **The animation took three tries.**
  - A hard 1px line with stepped bands read as crude.
  - A refined soft reveal (after CRT/LCD refresh references: a blurred,
    low-alpha band and an eased mask edge) was too smooth to notice.
  - The answer is a short **glitch**: torn, jolted slices with the old frame
    showing through and a faint white tear line, in hard stepped frames. Subtle
    glitch technique (thin bands, small offsets, stepped timing) from
    [alvarotrigo](https://alvarotrigo.com/fullPage/css-glitch-effect/),
    [muffinman](https://muffinman.io/blog/css-image-glitch/) and
    [Codrops](https://tympanus.net/codrops/?p=33498).

## Hero: Lysbrudd (Lag + Støv)

Code: `src/app/proto/_components/Lysbrudd.tsx` (one fragment shader, raw
WebGL, no library), previewed at **`/proto/lysbrudd`** (noindex, unlinked)
with a small panel for the lifecycle state and the dust. Kept as the starting
point for refinement; not production code yet.

What it is:

- **The scene:** a light hidden behind the trophy breaks through its cut-outs
  into a fog (god rays marched toward the light over the trophy's silhouette,
  rasterised from `public/images/branding/trophy.svg`). The trophy is a dark
  surface with a rim where the light grazes it.
- **Lag (layers):** the site grid is a physical part of the scene, as stacked
  sheets of glass:
  - a fine sheet far behind, lit where the beams reach it;
  - the page grid itself in the middle, in register with the rest of the page;
  - a coarse sheet in front, its bars dark against the fog.

  The sheets drift apart with the pointer (parallax).

- **Støv (dust):** pixel-sized motes drift up through the scene and show only
  where they cross a beam, so the light reads as a volume.
- **Lifecycle:** at rest a warm white light rises into place on load and then
  drifts slowly. During the countdown it is dimmed. When a champion is
  crowned it turns accent-red.
- **Edges:** the light fades out toward the canvas edges, so it never ends in
  a seam against the page.

Open for refinement:

- **Copy and layout around it:** the champion name, the readout, and where
  the trophy sits relative to the copy.
- **Mobile layout and performance:** the shader marches 72 samples per pixel;
  cap DPR and/or render at lower resolution on phones.
- **Reduced motion and fallback:** a static poster for reduced motion and
  for browsers without WebGL.
- **Lifecycle visuals:** how the countdown, live and crowned states should
  really look.
- **Silhouette source:** whether a scan of the real trophy (it exists; Jakob
  can scan it) should give a more exact silhouette.

## What we tried, and what we learned

| Direction                                                                                   | Verdict                                                                                                                      |
| ------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| **3D trophy (three.js),** the SVG extruded, studio-lit gold, pointer tilt                   | Striking, real gold with a studio environment. Not chosen for the hero.                                                      |
| 3D: engraved winner plaque, camera dolly + laser engraving + sparks on "crowned"            | The engraving moment is wanted, but in its own "just finished" scene.                                                        |
| 3D rendered **only as a raster** on the grid: halftone dots, engraving lines, LED (4 steps) | Interesting ("3D as a grid"). A candidate style for the "just finished" scene.                                               |
| **CSS faux-3D** (stacked SVG layers)                                                        | Reads as a gold coin, not an object. Fine only as a fallback.                                                                |
| **Lysbrudd "Dis",** smooth fog + rim                                                        | The best-feeling first pass, because it is one cohesive scene. Off-brand as it was (glow, grain).                            |
| Round 2: light on the grid lines / dot matrix / projection lines, trophy as a cut-out       | All read as "a trophy cut-out in front of a pattern". **Lesson:** the mechanism must draw the trophy too.                    |
| Round 3: grille panes, contour bands, halftone dots, engraving lines (whole scene)          | All significantly worse than Dis. **Lesson:** keep the fog; integrate the grid physically instead of re-rendering the scene. |
| Round 4: **Rom** (the grid folds into a perspective floor), **Lag** (stacked grid sheets)   | Both "super cool"; **Lag chosen**. Støv (dust) kept.                                                                         |
| Laser-cut names glowing through the plaque in 2D                                            | Did not work in the hero; removed.                                                                                           |

General lessons:

- **One scene, not a picture on a pattern.** Effects that put the trophy in
  front of a texture read as stickers.
- **Integrate the grid physically** (as sheets, a room, or panes) rather than
  replacing the light with a texture.
- **No hard edges in motion:** soft masks, eased timing, faint light.
- **Dot matrix is a strong accent but a poor body texture.** It works for the
  logo; it fails on running text and as the hero.

## Next

1. **Workshop the page's content and structure** with the PO's candidate
   list (`working-docs/front-page-candidates.md`: 33 candidates, the forced
   decisions X1–X11 and example sorts).
2. **Refine Lysbrudd** into a production hero component (see "Open for
   refinement" above).
3. **Build the /vs index** (`vs/[[...a]]`).
4. **Structured season dates** (`start`/`end` on `SeasonMeta`): a prerequisite
   for a lifecycle-aware `/`, the logo states, a countdown, "days as champion"
   and the "just finished" scene.
5. **The "just finished" scene** (TODO.md).
