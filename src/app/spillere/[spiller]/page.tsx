import { notFound } from 'next/navigation';
import Link from 'next/link';
import { getCareerView, getAllPlayerSlugs } from '@/lib/results/queries';
import PlayerHero from '@/components/PlayerHero';
import TrophyShelf from '@/components/TrophyShelf';
import CareerLedger from '@/components/CareerLedger';
import SeasonRecord from '@/components/SeasonRecord';
import CardGallery from '@/components/CardGallery';

interface Props {
  params: Promise<{ spiller: string }>;
}

export function generateStaticParams() {
  return getAllPlayerSlugs().map((spiller) => ({ spiller }));
}

export default async function PlayerCareerPage({ params }: Props) {
  const { spiller } = await params;

  const career = await getCareerView(spiller);
  if (!career) {
    notFound();
  }

  const { hero, ledger, seasons, trophies, cards } = career;

  return (
    <>
      <section className='flex flex-col gap-6 pt-8'>
        <Link
          href='/spillere'
          className='text-text-muted hover:text-accent focus-visible:outline-accent font-mono text-xs tracking-widest uppercase underline transition-colors duration-150 focus-visible:outline-2 focus-visible:outline-offset-2'
        >
          &larr; Spillere
        </Link>
        <PlayerHero hero={hero} />
        {trophies.length > 0 && <TrophyShelf trophies={trophies} />}
      </section>

      <section id='ledger' className='flex flex-col gap-6'>
        <CareerLedger ledger={ledger} />
      </section>

      <section id='season-record' className='flex flex-col gap-8'>
        <SeasonRecord seasons={seasons} label='Resultater' />
      </section>

      <section id='cards' className='flex flex-col gap-8'>
        <CardGallery cards={cards} playerName={hero.name} label='Samlekort' />
      </section>
    </>
  );
}
