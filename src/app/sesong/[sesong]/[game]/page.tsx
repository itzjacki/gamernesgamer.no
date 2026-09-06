import { notFound } from 'next/navigation';
import { seasonData, isSeason } from '@/data/sesong';
import LightningIcon from '@/components/LightningIcon';

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
    <section className='flex w-full max-w-prose flex-col gap-2'>
      <a href={`/sesong/${sesong}`} className='group block'>
        <span
          className='text-blueish group-hover:text-reddish pr-2 text-xl transition-colors duration-200'
          aria-hidden='true'
        >
          ←
        </span>
        <span>Gå tilbake</span>
      </a>

      <h1 className='font-quantico mb-8 self-start text-4xl sm:text-6xl'>
        {game.title}
      </h1>

      {game.videoEmbedUrl ? (
        <div className='mb-8'>
          <iframe
            width='560'
            height='315'
            src={game.videoEmbedUrl}
            title={`${game.title} – video`}
            allow='accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share; fullscreen'
            allowFullScreen
            referrerPolicy='strict-origin-when-cross-origin'
          />
        </div>
      ) : (
        <img
          className='mb-12 w-fit rounded-2xl drop-shadow-[1rem_1rem_0px_var(--color-darkblueish)]'
          src={game.thumbnailPath}
          alt={`Skjermdump fra ${game.title}`}
        />
      )}

      <div className='flex items-center gap-2'>
        <LightningIcon color='reddish' />
        <p className='font-quantico text-xl'>Valgt av: {game.chosenBy}</p>
      </div>
      <div className='flex items-center gap-2'>
        <LightningIcon color='blueish' />
        <p className='font-quantico text-xl'>Varighet: {game.duration}</p>
      </div>

      <h2 className='font-quantico mt-8 mb-4 self-start text-2xl sm:text-4xl'>
        Beskrivelse &amp; regler
      </h2>

      {game.longDescription ? (
        <article dangerouslySetInnerHTML={{ __html: game.longDescription }} />
      ) : (
        <>
          <em className='mb-4 block'>
            Vær litt mer tålmodig, utfyllende beskrivelse og regler kommer
            snart!
          </em>
          <p>{game.shortDescription}</p>
        </>
      )}
    </section>
  );
}
