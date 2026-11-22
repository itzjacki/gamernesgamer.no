import type { Metadata } from 'next';
import Link from 'next/link';
import { seasonData, type Season } from '@/data/sesong';
import { allPlayers } from '@/lib/players/roster';
import { fetchMediaRows } from '@/lib/media/fetch';
import { getAllMedia, getMediaOfTheDay } from '@/lib/media/queries';
import { imageManifest } from '@/lib/media/image-manifest';
import { youtubeStatus } from '@/lib/media/oembed';
import Panel from '@/components/Panel';
import MediaForm, { type FormOptions, type MediaFormValues } from './MediaForm';
import MediaList, { type MediaListRow } from './MediaList';

export const metadata: Metadata = {
  title: 'Content – Adminpanel',
};

interface Props {
  searchParams: Promise<{ rediger?: string }>;
}

function formOptions(): FormOptions {
  const players = allPlayers();
  const slugByName = new Map(players.map((p) => [p.name, p.slug]));
  return {
    seasons: (Object.keys(seasonData) as Season[]).map((slug) => ({
      number: Number(slug),
      games: seasonData[slug].games.map((g) => ({
        slug: g.slug,
        title: g.title,
      })),
      playerSlugs: seasonData[slug].gamers.map(
        (g) => slugByName.get(g.name) ?? '',
      ),
    })),
    players: players.map((p) => ({ slug: p.slug, name: p.name })),
    images: Object.keys(imageManifest),
  };
}

/**
 * Lists every row, including ones the public pages drop (an unknown game or
 * player, an image file no longer in the repo), so they can be fixed here.
 */
export default async function AdminMediaPage({ searchParams }: Props) {
  const { rediger } = await searchParams;
  const [rows, resolved, today] = await Promise.all([
    fetchMediaRows(),
    getAllMedia(),
    getMediaOfTheDay(),
  ]);

  const statuses = await Promise.all(
    rows.map((row) =>
      row.youtube_id ? youtubeStatus(row.youtube_id) : Promise.resolve(null),
    ),
  );
  const resolvedIds = new Set(resolved.map((item) => item.id));
  const playerNames = new Map(allPlayers().map((p) => [p.slug, p.name]));

  const list: MediaListRow[] = rows.map((row, index) => ({
    id: row.id,
    kind: row.kind,
    title: row.title,
    season: row.season_number,
    gameSlug: row.game_slug,
    players: row.media_item_player.map(
      (p) => playerNames.get(p.player_slug) ?? p.player_slug,
    ),
    source: row.youtube_id ?? row.image_file ?? '',
    youtubeStatus: statuses[index]?.status ?? null,
    hidden: !resolvedIds.has(row.id),
    isToday: row.id === today?.id,
  }));

  const editing = rows.find((row) => row.id === rediger) ?? null;
  const initial: MediaFormValues | null = editing && {
    id: editing.id,
    kind: editing.kind,
    source: editing.youtube_id ? 'youtube' : 'image',
    youtube: editing.youtube_id ?? '',
    imageFile: editing.image_file ?? '',
    vertical: editing.vertical,
    title: editing.title,
    alt: editing.alt ?? '',
    season: editing.season_number,
    gameSlug: editing.game_slug,
    playerSlugs: editing.media_item_player.map((p) => p.player_slug),
  };

  return (
    <section className='flex flex-col gap-8'>
      <div className='flex flex-col gap-2'>
        <Link
          href='/admin'
          className='text-text-muted hover:text-text font-mono text-xs tracking-wide uppercase transition-colors duration-150'
        >
          Adminpanel
        </Link>
        <h1 className='text-text text-3xl font-extrabold'>Content</h1>
      </div>

      <Panel label={initial ? 'Rediger content' : 'Legg til content'}>
        <MediaForm
          key={initial?.id ?? 'new'}
          initial={initial}
          options={formOptions()}
        />
      </Panel>

      <Panel label={`Alt content (${rows.length})`}>
        <MediaList rows={list} />
      </Panel>
    </section>
  );
}
