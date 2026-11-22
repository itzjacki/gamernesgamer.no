-- =============================================================================
-- Day-one media: the GG YouTube channel and the S2 game intros, as of S4.
--
-- Insert-if-missing, never delete: media is owned by /admin once it exists,
-- so this file only adds videos whose youtube_id isn't there yet. Re-running
-- it restores an item deleted in /admin. Titles are the YouTube titles.
-- =============================================================================

begin;

with items (kind, youtube_id, title, season_number, game_slug, players) as (
  values
    ('aftermovie'::public.media_kind, 'eTkT066jRpQ', 'Gamernes Gamer Season 1 - Aftermovie', 1, null, '{}'::text[]),
    ('aftermovie', '3BN1IVT0164', 'Gamernes Gamer Sesong 2 - Aftermovie', 2, null, '{}'),

    ('welcome', 'B4tFEPMPpYg', 'Gamernes Gamer Sesong 3 | Velkommen til GG3', 3, null, '{}'),
    ('welcome', 'jboUuS9vmfE', 'Gamernes Gamer Sesong 4 | Velkommen til GG4', 4, null, '{}'),

    ('player_intro', 'qMWdaaAAZiA', 'Gamernes Gamer Sesong 2 | THE MAESTRO | Intro', 2, null, '{tobias}'),
    ('player_intro', 'hKkaDfKouLU', 'Gamernes Gamer Sesong 2 | ALL IN | Intro', 2, null, '{jorgen}'),
    ('player_intro', '50RVbzX1ops', 'Gamernes Gamer Sesong 2 | THE PROFESSOR | Intro', 2, null, '{jakob}'),
    ('player_intro', '4ItCgWnjaEw', 'Gamernes Gamer Sesong 2 | IRON WILL | Intro', 2, null, '{william}'),
    ('player_intro', 'ckck4M1l1vk', 'Gamernes Gamer Sesong 3 | THE MAESTRO | Intro', 3, null, '{tobias}'),
    ('player_intro', 'nBgL5B-5xYE', 'Gamernes Gamer Sesong 3 | ALL IN | Intro', 3, null, '{jorgen}'),
    ('player_intro', 'S9_U8QIQECg', 'Gamernes Gamer Sesong 3 | THE PROFESSOR | Intro', 3, null, '{jakob}'),
    ('player_intro', 'd2ClNC4qfts', 'Gamernes Gamer Sesong 3 | IRON WILL | Intro', 3, null, '{william}'),
    ('player_intro', 'Zc0ao6iOqFA', 'Gamernes Gamer Sesong 4 | THE MAESTRO | INTRO', 4, null, '{tobias}'),
    ('player_intro', '4IexxahDsbA', 'Gamernes Gamer Sesong 4 | ALL IN | Intro', 4, null, '{jorgen}'),
    ('player_intro', 'c-h6sfIAbI0', 'Gamernes Gamer Sesong 4 | THE PROFESSOR | Intro', 4, null, '{jakob}'),
    ('player_intro', 'YFXPDEOpVOg', 'Gamernes Gamer Sesong 4 | IRON WILL | Intro', 4, null, '{william}'),

    ('game_intro', 'p-JmssuWe08', 'Gamernes Gamer 2 - Spillintro - Hearthstone', 2, 'hearthstone', '{}'),
    ('game_intro', '8RGefKTBFV4', 'Curve fever intro', 2, 'curve-fever', '{}'),
    ('game_intro', 'TdZfbh7AdCM', 'Gamernes Gamer 2 - Spillintro - The Sims 4', 2, 'the-sims-4', '{}'),
    ('game_intro', 'jJWT3VvxmLo', 'Gamernes Gamer 2 - spillintro - Warcraft 3', 2, 'warcraft-3', '{}'),
    ('game_intro', 'h7wfklQCyRo', 'Gamernes Gamer 2 - Spillintro - Poker', 2, 'poker', '{}'),
    ('game_intro', 'V3l56tS_yms', 'Wreckfest til GG', 2, 'wreckfest', '{}'),
    ('game_intro', 'WSD3k5_TgH4', 'Gamernes Gamer 2 - Spillintro - Total War: Empire', 2, 'total-war-empire', '{}'),
    ('game_intro', 'UaC0OBF018I', 'Gamernes Gamer 2 - Spillintro - League of Legends (Mundo Dodgeball)', 2, 'league-of-legends-02', '{}'),

    ('ad', 'K6sSeOQgjtk', 'Ford Lastebil GG Utgaven', null, null, '{}')
),
numbered as (
  select items.*, row_number() over () as ordinality from items
),
inserted as (
  insert into public.media_item (kind, youtube_id, title, season_number, game_slug, created_at)
  -- Spread created_at so the daily rotation follows this list's order.
  select kind, youtube_id, title, season_number, game_slug,
         now() + ordinality * interval '1 second'
  from numbered
  on conflict (youtube_id) where youtube_id is not null do nothing
  returning id, youtube_id
)
insert into public.media_item_player (media_item_id, player_slug)
select inserted.id, slug
from inserted
join items using (youtube_id)
cross join unnest(items.players) as slug;

commit;
