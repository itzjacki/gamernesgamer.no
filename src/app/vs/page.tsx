import type { Metadata } from 'next';
import { allPlayers } from '@/lib/players/roster';
import { getHeroPlayers, getPairKeys } from '@/lib/results/queries';
import CatalogueLine from '@/components/CatalogueLine';
import PairHero from '@/components/PairHero';

export const metadata: Metadata = { title: 'VS' };

export default function VsIndexPage() {
  const players = getHeroPlayers();
  const seasons = allPlayers().flatMap((p) => p.seasons.map(Number));
  const first = Math.min(...seasons);
  const last = Math.max(...seasons);

  return (
    <section className='flex flex-col gap-6 pt-8'>
      <CatalogueLine parts={['VS']} />
      <h1 className='sr-only'>Velg to spillere å sammenligne</h1>
      <PairHero
        players={players}
        pairs={getPairKeys()}
        scope={`S${first}–S${last} · ${players.length} spillere`}
      />
    </section>
  );
}
