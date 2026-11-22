import type { Metadata } from 'next';
import { allPlayers } from '@/lib/players/roster';
import { getAllMedia } from '@/lib/media/queries';
import { MEDIA_LABELS } from '@/lib/media/labels';
import Heading from '@/components/Heading';
import MediaBrowser from '@/components/MediaBrowser';

export const metadata: Metadata = {
  title: MEDIA_LABELS.pageTitle,
};

export default async function MediaIndexPage() {
  const items = await getAllMedia();
  const seasons = [
    ...new Set(items.flatMap((i) => (i.season === null ? [] : [i.season]))),
  ].sort((a, b) => b - a);
  const linked = new Set(items.flatMap((i) => i.playerSlugs));
  const players = allPlayers()
    .filter((p) => linked.has(p.slug))
    .map((p) => ({ slug: p.slug, name: p.name }));

  return (
    <>
      <section className='flex flex-col gap-4 pt-8'>
        <Heading as='h1'>{MEDIA_LABELS.pageTitle}</Heading>
      </section>

      <MediaBrowser items={items} seasons={seasons} players={players} />
    </>
  );
}
