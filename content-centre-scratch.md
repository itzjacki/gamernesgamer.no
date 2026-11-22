# Content centre — scratch (temporary, delete when shaped)

This is a workshop file. When it settles, the decisions move to `TODO.md` and
steering, and this file goes. Reviewed by the PO, architect, frontend dev and
designer (2026-11-22). Their findings are worked in below. Open calls for
Jakob are at the bottom.

## Decided (Jakob)

- Videos live on YouTube. Images ship in the repo with a deploy. There are no
  uploads and no asset pipeline.
- The mapping lives in the DB and is edited in /admin. Save = live: no drafts
  and no reveal gating, since intros are added after the tournament.
- Items carry optional links (season, game, players), and each page shows what
  links to it. Ads, documentaries, photos and memes aren't tied to a season.
- There's a central index at **`/innhold`**.
- YouTube iframes load on click, with a thumbnail first.
- "Dagens content" rotates daily over every item.
- Every item stores a title (prefilled from YouTube for videos).
- Photos and memes are supported from day one. The Jet Lag trailer is out of
  scope.
- This replaces `videoEmbedUrl` on `Game` and `SeasonMeta`.

## Day-one inventory

| Kind         | Items                                  | Links                  |
| ------------ | -------------------------------------- | ---------------------- |
| player_intro | S2, S3, S4 × 4                         | season + 1 player      |
| welcome      | S3, S4                                 | season                 |
| aftermovie   | S1, S2                                 | season                 |
| game_intro   | S2 × 8 (personal channels)             | season + game          |
| ad           | 1 video + a few images                 | none                   |
| _later_ documentary, clip (Shorts), photo, meme | —       | anything               |

## Schema

**Link by natural keys, not UUIDs (architect, critical).** `seed.sql` deletes
seasons 1–4 and the four players and re-inserts them with new UUIDs, and the
seed-a-season skill re-runs it on prod for every new season. With UUID FKs the
media rows would be cascaded away or unlinked, and since the admin form is the
only way in, they couldn't be restored. `season.number` and `player.slug` are
unique, so FKs on those, made `deferrable initially deferred`, survive the
seed's delete-and-reinsert inside its single transaction.

```sql
create type media_kind as enum (
  'player_intro', 'welcome', 'aftermovie', 'game_intro',
  'ad', 'documentary', 'clip', 'photo', 'meme'
);                                     -- no 'other': a new kind is a migration

create table media_item (
  id            uuid primary key default gen_random_uuid(),
  kind          media_kind not null,
  youtube_id    text,
  image_file    text,                  -- filename only; folder lives in code
  vertical      boolean not null default false,   -- Shorts / portrait images
  title         text not null,
  alt           text,                  -- Jakob writes it; never prefilled
  season_number int references season(number)
                  on update cascade deferrable initially deferred,
  game_slug     text,                  -- checked against static games.ts
  created_at    timestamptz not null default now(),

  check (num_nonnulls(youtube_id, image_file) = 1),
  check (youtube_id ~ '^[A-Za-z0-9_-]{11}$'),
  check (image_file ~ '^[a-z0-9][a-z0-9._-]*\.(png|jpe?g|webp|gif)$'),
  check (length(btrim(title)) > 0),
  check (game_slug is null or season_number is not null),
  check (kind not in ('photo', 'meme') or (image_file is not null and alt is not null)),
  check (kind <> 'game_intro' or game_slug is not null),
  check (kind not in ('player_intro', 'welcome', 'aftermovie') or season_number is not null)
);
-- partial unique indexes on youtube_id and image_file (no double entry)

create table media_item_player (
  media_item_id uuid not null references media_item(id) on delete cascade,
  player_slug   text not null references player(slug)
                  on update cascade deferrable initially deferred,
  primary key (media_item_id, player_slug)
);
-- index on player_slug
```

- **`player_slug`** is the roster slug, so there's no join by name.
- **No FK to `game`.** It's a seed-written anchor with UUIDs, so the read
  layer validates `game_slug` against static data instead.
- **Rules the checks can't express** (a `player_intro` has exactly one player)
  are enforced in the save action. The read layer tolerates violations.
- **One save is atomic.** A single RPC (`security invoker`,
  `search_path = ''`) writes the item and its players together, so a
  half-saved item can never go live.
- **RLS** copies the existing pattern on both tables: `*_select_public` for
  anon and authenticated, and `*_write_admin` using `(select is_admin())`.
- **The enum** is closed like `stage_kind`. `ADD VALUE` can't run in the same
  transaction that uses the new value.
- **Seed caveat for TODO.md:** once admin-authored data exists, the seed can't
  own prod. Phase 5's results entry hits the same wall.

## Read layer: `src/lib/media/` (not `results/`)

Media is one small cross-cutting table without `confirmed` gating, so it gets
its own module with the same layering:

- `fetch.ts` reads every row once.
- `select.ts` is pure: `forSeason`, `forGame`, `forPlayer`, `forPair`,
  `ofTheDay`, and intro ordering by the static roster order.
- `queries.ts` drops items whose season, game or player doesn't resolve in
  static data, or whose image file isn't in the manifest.
- Components get view-models, never rows. tech.md's line "public pages read
  only through results/queries" gets updated.

**Image manifest.** A `prebuild` and `predev` script writes a TS module listing
`public/images/media/`. Both the admin picker and the read layer import it, so
neither needs `fs` at runtime. A file removed from the repo disappears from
public pages in the same deploy, and /admin lists the item as orphaned. (A
`force-static` API route was rejected: code conventions forbid API routes
except for OG.)

**Latent risk to verify (architect).** `queries.ts`, `ChampionSideBlock` and
the season page call `existsSync(public/…)`. Today that runs at build time.
On-demand revalidation re-renders the pages inside Vercel functions, where
`public/` may not be bundled, so hero and champion art could silently fall back
after the first media save. Check on a preview deploy, or move those lookups
onto a build-time manifest too.

## /admin

- **Every new server action checks `rpc('is_admin')` first.** The layout gate
  doesn't cover actions, which are public POST endpoints. The save is
  RLS-backed, but the oEmbed fetch would otherwise be an open proxy.
- **`parseYoutubeId()`** is one pure function built on `new URL`. It handles
  `watch?v=` (dropping `t`, `list` and `si`), `youtu.be/`, `/shorts/`,
  `/embed/` and `/live/`, the `m.`, `music.` and nocookie hosts, and a bare ID.
  It runs on the client for feedback and again on the server. A `/shorts/` URL
  prefills `vertical`.
- **The oEmbed fetch** is built only from the parsed ID. It prefills the title
  while the field is untouched. Each failure shows inline: 401 means embedding
  is disabled, 404 means private or deleted, 400 means a bad ID. None of them
  blocks the save.
- **The image picker** is a `<select>` over the manifest, not a visual browser.
- **The player picker** lists the chosen season's roster, or every player when
  no season is set. The game picker lists the chosen season's games.
- **The form uses controlled state.** React 19 resets uncontrolled fields after
  a form action, which would wipe a failed save. Reuse `useTransition`,
  `{error}` with `role='alert'`, `Panel`, `Button`, and `RemoveAdminButton`'s
  confirm pattern for delete. Extract the input and select class set on this
  second use.
- **The list view** has edit and delete, an "on the front page today" marker,
  and per-video oEmbed status. That flags dead videos: the 8 game intros sit
  on personal channels and may rot, so ask Tobias and Jakob to re-upload them
  to the GG channel.
- **Revalidation:** one shared helper calls `revalidatePath('/', 'layout')`.
  It's correct by construction (old and new links, both /vs orders), cheap on
  a site this size, and Phase 5 reuses it.

## Pages

There's no section and no "nothing here yet" frame where there are no items.
The only exception is Dagens.

- **Season page:** one media section after the power-ups (where `VideoEmbed`
  sits now; 672px is off the 40px grid). The aftermovie and welcome go full
  content width, then the player intros in `sm:grid-cols-2 gap-10`, then
  clips. Defer intros as play buttons on the lineup cards to Cards part 2.
- **Game page:** the game intro takes the existing `media` slot beside the
  standings, with `game.thumbnailPath` as the poster (calmer than YouTube's).
  Clips get their own section after the description, never in that slot.
- **Career page:** the player's intros across seasons, directly after
  Samlekort, mirroring `CardGallery` (`sm:grid-cols-2 gap-10`, one per season,
  ascending). Seasons without an intro show nothing. Other items linked to the
  player go below in the same section. The PO calls this row the plan's
  strongest emotional moment.
- **/vs:** items linked to both players, as the last section. Normally empty,
  so normally absent.
- **Dagens content:** see "Item anatomy" for the frame. The footer links to
  `/innhold#m-<id>`. The rotation is the day index modulo the item count over
  `(created_at, id)` with `todayInNorway()`, as `RecordOfTheDay` does. Adding or
  deleting an item shifts it, which is accepted. With zero items, keep the
  current placeholder frame (`RecordOfTheDay` returns `null`, which would
  leave the row half-empty).
- **/innhold:** every tile carries `id="m-<id>"` and `scroll-mt-8`.
  `grid-cols-1 sm:grid-cols-2 gap-10`. For grouping and filters, see
  "Settled after review".

## Item anatomy (`MediaTile`, modelled on `GameCard`)

- **Frame:** `border border-border bg-bg flex flex-col`. The media area is
  `aspect-video bg-surface overflow-hidden`. The footer is the Dagens row:
  `h-12 border-t border-border px-5`, holding the season code (`S4`, or a
  placeholder for none) in mono muted `text-xs`, then the title in
  `text-text text-sm truncate`.
- **Hover and focus:** the border turns `border-accent`, nothing else.
- **Play affordance:** the whole media area is a `<button>` labelled
  "[TODO(copy): spill av] {title}". A solid `bg-bg size-10` key with `border-t
  border-r` sits in the bottom-left on the grid, holding a 10px SVG triangle.
  On hover or focus the triangle turns `text-accent`. Focus ring:
  `outline-accent`.
- **On click:** mount the iframe in the same box from
  `youtube-nocookie.com/embed/ID?autoplay=1&playsinline=1&rel=0`, keeping the
  current `allow` list. Move focus to the iframe, since the button unmounts.
  iOS may need a second tap. The component is a small `'use client'` island
  with the thumbnail passed in as children.
- **Thumbnails:** `hqdefault.jpg` (always exists, 4:3 with letterbox bars) with
  `object-cover` in 16:9, which crops exactly the bars. A missing `maxres`
  returns a 120×90 placeholder that `onError` won't catch, so don't use it.
  Plain `<img loading="lazy">` in a fixed-aspect box, full colour. Video tiles
  get `alt=''`, since the button carries the label. Repo images use
  `next/image` (see "Settled after review").
- **Aspect ratios** key on `vertical`. Landscape is `aspect-video`. Shorts get
  their own `aspect-[9/16]` row (`grid-cols-2 sm:grid-cols-4`). Memes and
  vertical images use `object-contain` on `bg-surface` and are never cropped.
  Before fixing the vertical frame, test a real Short's thumbnail, which may
  be cropped or pillarboxed.
- **Dagens frame:** about 400×272 and not 16:9. It fills with `h-full w-full`:
  `object-cover` for landscape video, `object-contain` pillarboxed for vertical
  items and images. The slot's height never changes, and `min-h-60` stays on
  phones.
- **Banned by design.md:** a round, glowing or blurred play button; scrims or
  gradients carrying a title over the image; translucent duration badges;
  hover zoom or fade-ins; coloured kind badges; YouTube's red logo. Titles and
  labels go below the image, never on it.
- **No durations** in v1: neither oEmbed nor the schema has them.
- **No CSP** exists today. If one is added, it needs
  `frame-src www.youtube-nocookie.com` and `img-src i.ytimg.com`. Thumbnails
  still contact Google before any click; that's minor.

## Copy (Jakob writes; ships as `TODO(copy)`)

Kind names and /innhold headings, the media section headings, the play label,
the label for a missing season code, image `alt` text (it's the meme's words,
so it must never be generated), and the titles of image items.

## Ship order

There's no fallback code: the legacy data is only 9 videos.

1. Additive migration (tables, RLS, RPC). Regenerate types and run the
   advisors.
2. `parseYoutubeId`, the manifest script, and `src/lib/media/`.
3. /admin: list, form, oEmbed, revalidation helper.
4. Enter the 9 legacy videos and the day-one inventory in prod.
5. One deploy: the `MediaTile` player, all the pages, Dagens, /innhold. It
   also removes `videoEmbedUrl` (types, the S2 data, the S3/S4
   `undefined` lines, both season-page branches, the game page) and
   `VideoEmbed`.
6. Verify the `existsSync` risk on a preview deploy before step 5 ships.
7. Docs: the AGENTS.md data-split rule, the "Data split" bullet in
   `.kiro/agents/architect.md`, structure.md (`lib/media/`,
   `public/images/media/`; it also wrongly says roster exports `playerSlug()`),
   tech.md (read path, test scope, seed caveat), and TODO.md.

## Settled after review (Jakob)

- **Moments:** no `start_seconds`. The aim is separate clips. Timestamped
  moments are parked in TODO.md under "In case".
- **Dagens mix:** a plain rotation. Mostly intros is honest while the content
  is mostly intros.
- **Thumbnails stay full colour.** Greyscale makes them uninviting to click.
  There's no portrait tone on media.
- **Image viewer:** a very simple pop-up, built from native HTML. It's one
  `<dialog>` opened with `showModal()`, and a `<form method="dialog">` with a
  close button. Escape and focus return come free. Solid `bg-bg` backdrop, the
  image, the alt text as caption, and nothing else: no zoom, no prev/next, no
  animation. Image tiles are `<button>`s that open it.
- **Repo images use `next/image`**, in tiles and in the viewer. The filenames
  are dynamic, so it needs `width`/`height` or `fill`. The manifest script
  records each file's dimensions (Next already ships `sharp`). Tiles use
  `fill` + `sizes` in their fixed-aspect box, and the viewer uses the
  recorded size with `max-h-[90svh] object-contain`. YouTube thumbnails stay
  plain `<img>` (no `remotePatterns` needed).
- **/innhold:** a filterable list. The default view is headline pieces
  (aftermovies, documentaries) first, then season by season, newest first,
  then a band for unseasoned items (ads, photos, memes). Filters (kind,
  season, player) run client-side over the full list: the volume is small,
  and `searchParams` would make the page dynamic.
- **Image-check risk:** accepted. If it bites, that step becomes more manual.

- **Tests:** only for `parseYoutubeId` (many URL forms, cheap, a silent break
  otherwise). The selectors, rotation and DB checks aren't tested. tech.md's
  test scope widens by that one function.

No open calls. Ready for the green light.
