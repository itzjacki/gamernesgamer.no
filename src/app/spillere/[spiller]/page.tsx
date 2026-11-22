import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import CatalogueLine from '@/components/CatalogueLine';
import SerialLink from '@/components/SerialLink';
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
import MediaSection from '@/components/MediaSection';
import { getAllMedia } from '@/lib/media/queries';
import { byKind, forPlayer } from '@/lib/media/select';

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

  // The intros first, oldest season first: the player across the years.
  const playerMedia = forPlayer(await getAllMedia(), spiller);
  const intros = playerMedia
    .filter((item) => item.kind === 'player_intro')
    .sort((a, b) => (a.season ?? 0) - (b.season ?? 0));
  const media = [
    ...intros,
    ...byKind(playerMedia.filter((item) => item.kind !== 'player_intro')),
  ];

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
        {/* The hero carries the name, so the line stands alone: the
            player's mark on the index. */}
        <CatalogueLine
          parts={[
            <SerialLink key='index' href='/spillere'>
              Spillere
            </SerialLink>,
            ...(rank !== undefined ? [String(rank).padStart(2, '0')] : []),
          ]}
        />
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

      {/* Beside the cards: both are the player's identity per season. */}
      <MediaSection items={media} />
    </>
  );
}
