import Link from 'next/link';
import Image from 'next/image';

interface Props {
  title: string;
  slug: string;
  thumbnailPath: string;
  chosenBy: string;
  duration: string;
  shortDescription: string;
  revealed: boolean;
}

export default function GameCard({
  title,
  slug,
  thumbnailPath,
  chosenBy,
  duration,
  shortDescription,
  revealed,
}: Props) {
  if (revealed) {
    return (
      <Link
        className='border-border-accent bg-bg hover:border-accent focus-visible:outline-accent flex h-full flex-col gap-3 border p-4 transition-colors duration-150 focus-visible:outline-2 focus-visible:outline-offset-2'
        href={slug}
      >
        <Image
          src={thumbnailPath}
          alt={title}
          width={480}
          height={270}
          className='w-full'
        />
        <h3 className='text-text text-lg font-bold'>{title}</h3>
        <p className='text-text-muted font-mono text-xs tracking-widest uppercase'>
          {chosenBy} · {duration}
        </p>
        <p className='text-text-muted text-sm'>{shortDescription}</p>
      </Link>
    );
  }

  return (
    <div className='border-border bg-bg flex flex-col gap-3 border p-4'>
      <div
        aria-hidden='true'
        className='bg-surface text-text-muted grid h-40 w-full place-items-center font-mono text-6xl'
      >
        ?
      </div>
      <h3 className='text-text text-lg font-bold'>Mystisk spill</h3>
      <p className='text-text-muted font-mono text-xs tracking-widest uppercase'>
        – · –
      </p>
      <p className='text-text-muted text-sm'>
        Når spillene har blitt avslørt kommer de til å vises her!
      </p>
    </div>
  );
}
