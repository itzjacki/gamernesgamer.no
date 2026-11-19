import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import {
  getCareerView,
  getAllPlayerSlugs,
  getPairSummaries,
  getRecordsView,
} from '@/lib/results/queries';
import { rankByAveragePlacement } from '@/lib/players/ranking';
import PlayerHero from '@/components/PlayerHero';
import TrophyShelf from '@/components/TrophyShelf';
import CareerLedger from '@/components/CareerLedger';
import SeasonRecord from '@/components/SeasonRecord';
import CardGallery from '@/components/CardGallery';
import TagRecord from '@/components/TagRecord';
import SectionLabel from '@/components/SectionLabel';
import PairSummaryList from '@/components/PairSummaryList';

interface Props {
  params: Promise<{ spiller: string }>;
}

export function generateStaticParams() {
  return getAllPlayerSlugs().map((spiller) => ({ spiller }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { spiller } = await params;
  const career = await getCareerView(spiller);
  return career ? { title: career.hero.name } : {};
}

export default async function PlayerCareerPage({ params }: Props) {
  const { spiller } = await params;

  const career = await getCareerView(spiller);
  if (!career) {
    notFound();
  }
  const rivals = await getPairSummaries(spiller);
  const rank = rankByAveragePlacement((await getRecordsView()).board).find(
    (r) => r.slug === spiller,
  )?.career.rank;

  const {
    hero,
    ledger,
    seasons,
    trophies,
    cards,
    tagStats,
    tagStatsWithoutOwnPicks,
  } = career;

  return (
    <>
      <section className='flex flex-col gap-6 pt-8'>
        {/* Catalogue line (design.md, Notation): the player's mark on the
            index, whose name part is the way back. */}
        <p className='text-text-muted font-mono text-xs tracking-wide uppercase sm:tracking-widest'>
          GG /{' '}
          <Link
            href='/spillere'
            className='hover:text-text-accent focus-visible:outline-accent relative underline underline-offset-2 transition-colors duration-150 after:absolute after:inset-x-0 after:-inset-y-3 focus-visible:outline-2 focus-visible:outline-offset-2'
          >
            Spillere
          </Link>
          {rank !== undefined && <> / {String(rank).padStart(2, '0')}</>}
        </p>
        <PlayerHero hero={hero} />
        {trophies.length > 0 && <TrophyShelf trophies={trophies} />}
      </section>

      <section id='ledger' className='flex flex-col gap-6'>
        <CareerLedger ledger={ledger} tagStats={tagStats} />
      </section>

      <section id='season-record' className='flex flex-col gap-6'>
        <SectionLabel as='h2'>Resultater</SectionLabel>
        <SeasonRecord seasons={seasons} />
      </section>

      <section id='tag-record' className='flex flex-col gap-8'>
        <TagRecord
          stats={tagStats}
          statsWithoutOwnPicks={tagStatsWithoutOwnPicks}
        />
      </section>

      {rivals.length > 0 && (
        <section id='head-to-head' className='flex flex-col gap-6'>
          <SectionLabel as='h2'>Innbyrdes statistikk</SectionLabel>
          <PairSummaryList
            player={{ slug: career.slug, name: hero.name }}
            summaries={rivals}
            labels={{
              opponent: 'Motstander',
              games: 'I spill',
              matches: 'I matcher',
            }}
          />
        </section>
      )}

      <section id='cards' className='flex flex-col gap-8'>
        <CardGallery cards={cards} playerName={hero.name} label='Samlekort' />
      </section>
    </>
  );
}
