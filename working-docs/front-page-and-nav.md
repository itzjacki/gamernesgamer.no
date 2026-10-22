# Front page + site navigation

Status (2026-10-22): **the header is built; the front page's content and
structure are decided; a wireframe is live at `/`** for Jakob's review (see
"Next"). Earlier explorations and the full candidate list are in git history
(`ae9e801`, and this doc and `front-page-candidates.md` before 2026-10-22).

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

| State        | Trophy (desktop)                                 | Beside / on the trophy                                                                                                                   | State slot               |
| ------------ | ------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------- | ------------------------ |
| Dormant      | right                                            | left: what GG is (standing content, Jakob's copy)                                                                                        | empty (no filler)        |
| Live         | right                                            | left: a link to the live season page; later (Phase 5) a live table                                                                       | empty                    |
| Upcoming     | centred                                          | a countdown across the trophy (ideally in the scene, at least in front); under it the reveal counts, linking to the upcoming season page | what is on the line      |
| Just crowned | the engraving scene, full width; or trophy right | if not full width, left: the champion (their season card art + content about the win)                                                    | what last season changed |

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
   table). Outside just crowned, the champion is not named in the fold; the
   header readout already does that.
2. **The state slot.** Its top edge peeks about one grid cell above the fold.
   A one-row minimum when it has little to say.
   - _What is on the line_ (upcoming): active streaks held by players on the
     coming roster, records within reach, title counts that could tie. Needs a
     current-streak derivation and Jakob's rules for "within reach".
   - _What last season changed_ (just crowned): records broken or newly tied,
     movement on the all-time board, new category crowns. Diffs
     `deriveRecords` over all seasons but the last against all of them.
3. **Record of the day:** one record plate, the same for everyone that day,
   in its own frame with a date stamp and the door to `/records#<id>` beside
   it. The only rotating block; if it goes stale, widen its pool rather than
   add a block.
4. **Roll of honour:** season number + champion, newest first, set like an
   engraving, not like navigation (no thumbnails, dates, LEDs or key
   styling; no row for an upcoming season). The only place on `/` that says
   who has won the trophy.
5. **Archive totals:** one small mono row closing the roll (seasons, games,
   matches, power-ups fired).

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

1. **Jakob reviews the wireframe at `/`** (`?tilstand=` previews each state).
2. **Build the blocks**, in order: roll of honour + totals → record of the
   day → the countdown base → what changed and what is on the line together
   (they share the records work).
3. **The trophy hero** (the deferred work above), then the engraving scene.
