import type { Metadata } from 'next';
import { seasonData, type Season } from '@/data/sesong';
import { findSeasonImage, getSeasonView } from '@/lib/results/queries';
import { formatSeasonDates } from '@/lib/season-dates';
import Heading from '@/components/Heading';
import SeasonRoster from '@/components/SeasonRoster';
import type { SeasonEntry } from '@/components/SeasonRoster';

// TODO(copy): page title and heading lines.
export const metadata: Metadata = {
  title: 'Sesonger',
};

async function toEntry(slug: Season): Promise<SeasonEntry> {
  const { meta, games, gamers } = seasonData[slug];
  const number = Number(slug);

  // Only a decided season has a champion; the season page reads the same view.
  const view = meta.status === 'upcoming' ? null : await getSeasonView(number);
  const winner = view?.standings.find((row) => row.isChampion);
  const card = winner && gamers.find((g) => g.name === winner.player.name);
  const photo = findSeasonImage(slug);

  return {
    slug,
    number,
    date: formatSeasonDates(meta),
    status: meta.status,
    games: games.length,
    players: gamers.length,
    champion: winner
      ? { name: winner.player.name, points: winner.totalPoints }
      : undefined,
    image: photo
      ? { path: photo, landscape: true }
      : card
        ? { path: card.imagePath, landscape: false }
        : undefined,
  };
}

export default async function SeasonsIndexPage() {
  // Newest first.
  const slugs = (Object.keys(seasonData) as Season[]).sort().reverse();
  const entries = await Promise.all(slugs.map(toEntry));

  return (
    <>
      <section className='flex flex-col gap-4 pt-8'>
        <Heading as='h1' aboveLine='GG - Alle sesonger' belowLine='Sesonger'>
          Sesonger
        </Heading>
      </section>

      <section id='sesonger' className='flex flex-col gap-8'>
        <SeasonRoster entries={entries} />
      </section>
    </>
  );
}
