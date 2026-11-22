import 'server-only';

import { cache } from 'react';
import { seasonData, type Season } from '@/data/sesong';
import { allPlayers } from '../players/roster';
import { todayInNorway } from '../site-state';
import { seasonSlug } from '../results/derive';
import { fetchMediaRows, type MediaRow } from './fetch';
import { imageManifest } from './image-manifest';
import { ofTheDay } from './select';
import type { MediaItemView, MediaSource } from './view-models';

/**
 * The media read API pages call. Joins DB rows to the static data and drops
 * any item whose season, game, player or image file doesn't resolve, so a
 * renamed game or a deleted image never renders broken.
 */

export const IMAGE_DIR = '/images/media';

function resolve(
  row: MediaRow,
  knownPlayers: Set<string>,
): MediaItemView | null {
  const season =
    row.season_number === null
      ? null
      : (seasonData[seasonSlug(row.season_number) as Season] ?? undefined);
  if (season === undefined) return null;

  let gameTitle: string | null = null;
  if (row.game_slug) {
    const game = season?.games.find((g) => g.slug === row.game_slug);
    if (!game) return null;
    gameTitle = game.title;
  }

  const playerSlugs = row.media_item_player.map((p) => p.player_slug);
  if (playerSlugs.some((slug) => !knownPlayers.has(slug))) return null;

  let source: MediaSource;
  if (row.youtube_id) {
    source = {
      type: 'youtube',
      youtubeId: row.youtube_id,
    };
  } else if (row.image_file && imageManifest[row.image_file]) {
    source = {
      type: 'image',
      src: `${IMAGE_DIR}/${row.image_file}`,
      ...imageManifest[row.image_file],
    };
  } else {
    return null;
  }

  return {
    id: row.id,
    kind: row.kind,
    title: row.title,
    alt: row.alt ?? row.title,
    source,
    vertical: row.vertical,
    season: row.season_number,
    gameSlug: row.game_slug,
    gameTitle,
    playerSlugs,
    createdAt: row.created_at,
  };
}

/**
 * Player intros follow the season's roster order, not entry order: a season's
 * intros keep the slot of its first-entered intro and are ordered within it.
 */
function orderIntrosByRoster(
  items: MediaItemView[],
  nameBySlug: Map<string, string>,
): MediaItemView[] {
  const firstIntroIndex = new Map<number, number>();
  const keyed = items.map((item, index) => {
    if (item.kind !== 'player_intro' || item.season === null) {
      return { item, key: [index, 0] };
    }
    if (!firstIntroIndex.has(item.season)) {
      firstIntroIndex.set(item.season, index);
    }
    const gamers = seasonData[seasonSlug(item.season) as Season].gamers;
    const name = nameBySlug.get(item.playerSlugs[0] ?? '');
    const rosterIndex = gamers.findIndex((g) => g.name === name);
    return {
      item,
      key: [
        firstIntroIndex.get(item.season)!,
        rosterIndex === -1 ? gamers.length : rosterIndex,
      ],
    };
  });

  return keyed
    .sort((a, b) => a.key[0] - b.key[0] || a.key[1] - b.key[1])
    .map(({ item }) => item);
}

/** Every resolvable item, in rotation order (created_at, id). */
export const getAllMedia = cache(async (): Promise<MediaItemView[]> => {
  const rows = await fetchMediaRows();
  const roster = allPlayers();
  const knownPlayers = new Set(roster.map((p) => p.slug));
  const items = rows
    .map((row) => resolve(row, knownPlayers))
    .filter((item): item is MediaItemView => item !== null);

  return orderIntrosByRoster(
    items,
    new Map(roster.map((p) => [p.slug, p.name])),
  );
});

/** One item per Norwegian calendar day, the same for everyone. */
export async function getMediaOfTheDay(): Promise<MediaItemView | null> {
  const items = await getAllMedia();
  // A calendar date parses to UTC midnight, so this is a whole day count.
  const dayNumber = Date.parse(todayInNorway()) / 86_400_000;
  return ofTheDay(items, dayNumber);
}
