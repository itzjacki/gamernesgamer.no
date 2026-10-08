import type { Metadata } from 'next';
import { allPlayers } from '@/lib/players/roster';
import Heading from '@/components/Heading';
import PlayerRoster from '@/components/PlayerRoster';
import type { RosterEntry } from '@/components/PlayerRoster';

export const metadata: Metadata = {
  title: 'Spillere',
};

export default function PlayersIndexPage() {
  const players = allPlayers();

  const entries: RosterEntry[] = players.map((p) => ({
    slug: p.slug,
    name: p.name,
    nickname: p.latest.nickname,
    imagePath: p.latest.imagePath,
  }));

  return (
    <>
      <section className='flex flex-col gap-4 pt-8'>
        <Heading as='h1' aboveLine='GG - Alle sesonger' belowLine='Spillere'>
          Spillere
        </Heading>
      </section>

      <section id='roster' className='flex flex-col gap-8'>
        <PlayerRoster entries={entries} />
      </section>
    </>
  );
}
