import { notFound } from 'next/navigation';
import Link from 'next/link';
import { seasonData, isSeason } from '@/data/sesong';
import Heading from '@/components/Heading';
import SectionLabel from '@/components/SectionLabel';

interface Props {
  params: Promise<{ sesong: string; game: string }>;
}

export function generateStaticParams() {
  return Object.entries(seasonData).flatMap(([sesong, data]) =>
    data.games.map((game) => ({ sesong, game: game.slug })),
  );
}

export default async function GamePage({ params }: Props) {
  const { sesong, game: gameSlug } = await params;

  if (!isSeason(sesong)) {
    notFound();
  }

  const game = seasonData[sesong].games.find((g) => g.slug === gameSlug);
  if (!game) {
    notFound();
  }

  return (
    <section className='flex w-full flex-col gap-4 pt-8'>
      <Link
        href={`/sesong/${sesong}`}
        className='text-text-muted hover:text-accent focus-visible:outline-accent font-mono text-xs tracking-widest uppercase underline transition-colors duration-150 focus-visible:outline-2 focus-visible:outline-offset-2'
      >
        Tilbake til sesong {Number(sesong)}
      </Link>

      <Heading as='h1' aboveLine={`GG — Sesong ${Number(sesong)}`}>
        {game.title}
      </Heading>

      <div className='mt-2 flex gap-8'>
        <SectionLabel>Valgt av: {game.chosenBy}</SectionLabel>
        <SectionLabel>Varighet: {game.duration}</SectionLabel>
      </div>

      {game.videoEmbedUrl ? (
        <div className='mt-6 w-full max-w-2xl'>
          <iframe
            width='560'
            height='315'
            src={game.videoEmbedUrl}
            title={`${game.title} – video`}
            allow='accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share; fullscreen'
            allowFullScreen
            referrerPolicy='strict-origin-when-cross-origin'
            className='rounded-sm'
          />
        </div>
      ) : (
        <img
          className='mt-6 w-fit max-w-sm'
          src={game.thumbnailPath}
          alt={`Skjermdump fra ${game.title}`}
        />
      )}

      <div className='mt-8'>
        <Heading as='h2'>Beskrivelse &amp; regler</Heading>
      </div>

      {game.longDescription ? (
        <article
          className='prose prose-invert text-text-muted'
          dangerouslySetInnerHTML={{ __html: game.longDescription }}
        />
      ) : (
        <>
          <em className='text-text-muted block'>
            Vær litt mer tålmodig, utfyllende beskrivelse og regler kommer
            snart!
          </em>
          <p className='text-text-muted'>{game.shortDescription}</p>
        </>
      )}
    </section>
  );
}
