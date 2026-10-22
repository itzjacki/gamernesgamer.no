# Front page + site navigation

Status (2026-10-23): **the header is built; the front page is built except
"what is on the line"** and is in review at `/` (see "Next"). Earlier
explorations and the full candidate list are in git history (`ae9e801`, and
this doc and `front-page-candidates.md` before 2026-10-22).

## Decisions

- **Navigation lives in the header**, so no page has to be reached via `/`.
- **No /vs index** (Jakob, 2026-10-17). The header's VS chooser is the one
  pair picker on the site; pairs are not solved two ways.
- **Season index at `/sesong`** (2026-10-17), reached from the Sesonger
  chooser's "Alle".
- **Monument first.** `/` is a short lobby that says "this matters"; the
  archive lives on the other pages. Enough that it is not boring, not so much
  that it is messy or repeats the rest of the site.
- **Audience:** the players first, spectators second. No explaining the
  tournament to newcomers.
- **Copy:** Jakob writes all of it later; blocks that need copy are fine.

## Header (built)

`SiteHeader` (server: data, the pixel logo) + `SiteHeaderBar` (client), in the
root layout. Full behaviour is in design.md ("Site header") and TODO.md (Site
navigation). In short: a rail of keys (logo, Sesonger, Spillere, VS,
Rekorder), each with a function number, label and status LED; under it a
display row that shows one thing at a time, the page's readout at rest, with
the choosers glitching in over it.

## Site states

The site is always in exactly one of four states. Each sets the fold (where
the trophy stands and what sits beside or on it) and one **state slot**
under the fold; the rest of the page is fixed. No other timelines or
per-block windows.

| State        | Trophy (desktop)                                 | Beside / on the trophy                                                                                                                  | State slot               |
| ------------ | ------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------- | ------------------------ |
| Dormant      | right                                            | left: "Gamernes Gamer" in big bold type, nothing else (the page's h1)                                                                   | empty (no filler)        |
| Live         | right                                            | left: a bordered block linking to the live season page; later (Phase 5) a live table                                                    | empty                    |
| Upcoming     | centred                                          | the countdown straight on the trophy (bold white numerals, no box); under it a bordered row of reveal counts linking to the season page | what is on the line      |
| Just crowned | the engraving scene, full width; or trophy right | if not full width, left: the champion's image with a solid footer (name, season, points, titles); one link to their career page         | what last season changed |

On phones the trophy is always centred and the side block follows it.

- **Upcoming** begins when the next season is registered (`status:
'upcoming'`) and ends just crowned early.
- **Live** follows the season's `status: 'live'`.
- **Just crowned** runs 42 days (6 weeks) from the latest finished season's
  `end`; later configurable in the admin panel. The engraving of the new
  champion's name belongs to it; its details are tabled.
- **Dormant** is everything else.

Derived by `deriveSiteState` in `src/lib/site-state.ts`.

## The page, top to bottom

1. **The fold:** the trophy hero with its side block or countdown (see the
   table). UI on the hero follows design.md, "On the hero" (no faded edges;
   bold type straight on the scene, or ordinary bordered elements). Outside
   just crowned the champion is not named in the fold; the header readout
   does that.
2. **The state slot.** Its top edge peeks above the fold.
   - _What is on the line_ (upcoming): active streaks held by players on the
     coming roster, records within reach, title counts that could tie. Needs a
     current-streak derivation and Jakob's rules for "within reach".
   - _What last season changed_ (just crowned): only records the season beat
     (the figure got better, not just changed hands) or improved; career
     totals only when they change hands. Diffs `deriveRecords` over all
     seasons but the last against all of them.
3. **The same in every state**, at the bottom, each row its own section:
   - **Record of the day | Content of the day.** One record plate, the same
     for everyone that day, with the door to `/records#<id>`; the only
     rotating record. Content of the day is a placeholder for a rotating
     piece of tournament content (an image or clip with a caption).
   - **Players | Seasons.** Small versions of the two index lists: a small
     picture and the name (players) or season number + champion (seasons),
     one link per row, and a link to the index. No other stats.
   - **Stats row:** seasons, games, matches, power-ups fired, on one line
     (2×2 on phones).

Design notes:

- Only the countdown gets display-size numerals.
- Not too much red at once in the just-crowned state.
- No scroll animations; the hero is the page's one motion moment.
- Blocks under the hero snap to whole 40px cells so the hero's grid stays in
  register with the page.

## Trophy hero (prototype)

Code: `src/app/proto/_components/TrophyHero.tsx` (one fragment shader, raw
WebGL, no library), previewed at `/proto/trofe` (noindex, unlinked) with a
small panel for the state and the dust; the `/` wireframe uses it too. Not
production code yet; **the work on it is deferred** until the page's blocks
are built.

What it is:

- **Backlit trophy in fog:** a light hidden behind the trophy breaks through
  its cut-outs into a fog (god rays marched toward the light over the
  silhouette from `public/images/branding/trophy.svg`). The trophy is a dark
  surface with a rim where the light grazes it.
- **Grid room:** the page grid itself is the back wall, lit where the beams
  reach it. At the trophy's foot (snapped to a grid row) it folds into a
  floor that runs toward the viewer in perspective; light pools on the floor
  around the foot, and the floor hands back to the flat page grid at the
  stage's bottom edge. The vanishing point drifts with the pointer. Rebuilt
  2026-10-22 from a description, since the original was never committed:
  Jakob to judge it.
- **Dust (optional):** pixel-sized motes drift up and show only where they
  cross a beam. On or off is to be decided by eye.
- **Edges:** the light fades out toward the canvas edges, so it never ends in
  a seam against the page.

Deferred work:

- **The countdown in the scene** (upcoming): the trophy is centred for it;
  ideally the numerals live in the scene in some visually interesting way,
  at least in front of the trophy.
- **The states:** the prototype has white at rest, dimmed while counting
  down, red when crowned. Jakob leans toward red all the time, with intensity
  (light, other particles) telling the four states apart.
- **Layout:** the trophy stands at 66% of the width on desktop (`align:
'right'`) or centred (`align: 'centre'`, upcoming); its size on phones (it
  nearly fills a 375px screen).
- **Performance:** the shader marches 72 samples per pixel; cap DPR and/or
  render at lower resolution on phones.
- **Reduced motion and fallback:** a static poster for reduced motion and
  for browsers without WebGL.
- **Silhouette source:** whether a scan of the real trophy (Jakob can scan
  it) should give a more exact silhouette.
- **The engraving scene** for just crowned.

Lessons that still apply:

- **One scene, not a picture on a pattern.** Effects that put the trophy in
  front of a texture read as stickers; the grid has to be part of the space.
- **No hard edges in motion:** soft masks, eased timing, faint light.
- **Dot matrix is a strong accent but a poor body texture.**

## Next

1. **Jakob reviews `/`** in all four states (`?tilstand=` previews each).
2. **What is on the line:** Jakob's "within reach" rules (proposal in
   TODO.md, "Where we left off"), then build it.
3. **Content of the day:** decide what it rotates and its source.
4. **Open design points:** the champion photo crop; accent text contrast
   (site-wide).
5. **Copy** for every bracketed placeholder (Jakob).
6. **Remove the wireframe switcher** and `?tilstand=`.
7. **The trophy hero** (the deferred work above), then the engraving scene.
