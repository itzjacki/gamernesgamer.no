import type { Metadata } from 'next';
import { allPlayers } from '@/lib/players/roster';
import { findHeroImage, getRecordsView } from '@/lib/results/queries';
import { rankByAveragePlacement } from '@/lib/players/ranking';
import Heading from '@/components/Heading';
import PlayerRoster from '@/components/PlayerRoster';
import type { RosterEntry } from '@/components/PlayerRoster';

export const metadata: Metadata = {
  title: 'Spillere',
};

export default async function PlayersIndexPage() {
  const players = allPlayers();
  const { board } = await getRecordsView();

  const ranking = rankByAveragePlacement(board);
  const careerBySlug = new Map(ranking.map((r) => [r.slug, r.career]));
  const order = new Map(ranking.map((r, index) => [r.slug, index]));

  // Ranked players in ranking order; anyone without a finished season keeps
  // the roster's own order (allPlayers) underneath them.
  const entries: RosterEntry[] = players
    .map((p) => ({
      slug: p.slug,
      name: p.name,
      nickname: p.latest.nickname,
      imagePath: findHeroImage(p.slug),
      career: careerBySlug.get(p.slug),
    }))
    .sort(
      (a, b) =>
        (order.get(a.slug) ?? ranking.length) -
        (order.get(b.slug) ?? ranking.length),
    );

  return (
    <>
      <section className='flex flex-col gap-4 pt-8'>
        <Heading as='h1' serial={[`${entries.length} spillere`]}>
          Spillere
        </Heading>
      </section>

      <section id='roster' className='flex flex-col gap-8'>
        <PlayerRoster entries={entries} />
      </section>
    </>
  );
}
