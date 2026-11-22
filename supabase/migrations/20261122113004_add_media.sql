-- Media: YouTube videos and repo-shipped images, mapped to what they are about.
--
-- Links use natural keys (season.number, player.slug), not uuids: seed.sql
-- deletes and re-inserts seasons and players with fresh uuids on every run,
-- and media rows are entered by hand in /admin, so a uuid FK would cascade
-- them away or orphan them. The FKs are DEFERRABLE INITIALLY DEFERRED so the
-- seed's delete-then-reinsert inside one transaction passes at commit.
--
-- game_slug has no FK: the DB's game rows are seed-written anchors keyed by
-- uuid. The read layer validates it against the static season data.

create type public.media_kind as enum (
  'player_intro',
  'welcome',
  'aftermovie',
  'game_intro',
  'ad',
  'documentary',
  'clip',
  'photo',
  'meme'
);

create table public.media_item (
  id            uuid        primary key default gen_random_uuid(),
  kind          public.media_kind not null,
  youtube_id    text,
  -- Filename only: the folder (public/images/media/) lives in code.
  image_file    text,
  vertical      boolean     not null default false,
  title         text        not null,
  alt           text,
  season_number integer     references public.season (number)
                              on update cascade
                              deferrable initially deferred,
  game_slug     text,
  created_at    timestamptz not null default now(),

  constraint media_item_one_source
    check (num_nonnulls(youtube_id, image_file) = 1),
  constraint media_item_youtube_id_format
    check (youtube_id ~ '^[A-Za-z0-9_-]{11}$'),
  constraint media_item_image_file_format
    check (image_file ~ '^[a-z0-9][a-z0-9._-]*\.(png|jpe?g|webp|gif)$'),
  constraint media_item_title_present
    check (length(btrim(title)) > 0),
  constraint media_item_game_needs_season
    check (game_slug is null or season_number is not null),
  constraint media_item_image_kinds
    check (kind not in ('photo', 'meme') or (image_file is not null and alt is not null)),
  constraint media_item_game_intro_has_game
    check (kind <> 'game_intro' or game_slug is not null),
  constraint media_item_season_kinds_have_season
    check (kind not in ('player_intro', 'welcome', 'aftermovie', 'game_intro') or season_number is not null)
);

comment on table public.media_item is 'A YouTube video or a repo image (public/images/media/), with optional links to a season, game and players. Entered by hand in /admin.';

create unique index media_item_youtube_id_key on public.media_item (youtube_id) where youtube_id is not null;
create unique index media_item_image_file_key on public.media_item (image_file) where image_file is not null;
create index media_item_season_number_idx on public.media_item (season_number);

create table public.media_item_player (
  media_item_id uuid not null references public.media_item (id) on delete cascade,
  player_slug   text not null references public.player (slug)
                  on update cascade
                  deferrable initially deferred,
  primary key (media_item_id, player_slug)
);

create index media_item_player_player_slug_idx on public.media_item_player (player_slug);

-- RLS: public read, admin write (the pattern every table uses).
alter table public.media_item enable row level security;
alter table public.media_item_player enable row level security;

create policy media_item_select_public on public.media_item for select to anon, authenticated using ( true );
create policy media_item_write_admin   on public.media_item for all    to authenticated using ( (select public.is_admin()) ) with check ( (select public.is_admin()) );

create policy media_item_player_select_public on public.media_item_player for select to anon, authenticated using ( true );
create policy media_item_player_write_admin   on public.media_item_player for all    to authenticated using ( (select public.is_admin()) ) with check ( (select public.is_admin()) );

-- media_save: insert (p_id null) or update one item and replace its players in
-- one transaction, so a half-saved item never goes live. SECURITY INVOKER:
-- RLS does the authorization. Returns the item id.
create function public.media_save(
  p_kind          public.media_kind,
  p_vertical      boolean,
  p_title         text,
  p_player_slugs  text[],
  p_id            uuid    default null,
  p_youtube_id    text    default null,
  p_image_file    text    default null,
  p_alt           text    default null,
  p_season_number integer default null,
  p_game_slug     text    default null
)
  returns uuid
  language plpgsql
  security invoker
  set search_path = ''
as $$
declare
  v_id uuid;
begin
  if p_kind = 'player_intro' and coalesce(cardinality(p_player_slugs), 0) <> 1 then
    raise exception 'A player intro links exactly one player'
      using errcode = 'P0001';
  end if;

  if p_id is null then
    insert into public.media_item (
      kind, youtube_id, image_file, vertical, title, alt, season_number, game_slug
    ) values (
      p_kind, p_youtube_id, p_image_file, p_vertical, p_title, p_alt, p_season_number, p_game_slug
    )
    returning id into v_id;
  else
    update public.media_item set
      kind          = p_kind,
      youtube_id    = p_youtube_id,
      image_file    = p_image_file,
      vertical      = p_vertical,
      title         = p_title,
      alt           = p_alt,
      season_number = p_season_number,
      game_slug     = p_game_slug
    where id = p_id
    returning id into v_id;

    if v_id is null then
      raise exception 'No media item %', p_id using errcode = 'P0002';
    end if;

    delete from public.media_item_player where media_item_id = v_id;
  end if;

  insert into public.media_item_player (media_item_id, player_slug)
  select v_id, slug from unnest(coalesce(p_player_slugs, '{}')) as slug;

  return v_id;
end;
$$;

revoke execute on function public.media_save(public.media_kind, boolean, text, text[], uuid, text, text, text, integer, text) from public;
revoke execute on function public.media_save(public.media_kind, boolean, text, text[], uuid, text, text, text, integer, text) from anon;
grant execute on function public.media_save(public.media_kind, boolean, text, text[], uuid, text, text, text, integer, text) to authenticated;
