import Link from 'next/link';
import Image from 'next/image';
import SheetSerial from './SheetSerial';

interface Props {
  title: string;
  slug: string;
  thumbnailPath: string;
  chosenBy: string;
  duration: string;
  shortDescription: string;
  revealed: boolean;
  /** Zero-padded season slug, e.g. "04", for the serial. */
  season: string;
  /** The game's 1-based place in its season, for the serial. */
  number: number;
  /** Smaller type and no description, for the front page. */
  compact?: boolean;
}

export default function GameCard({
  title,
  slug,
  thumbnailPath,
  chosenBy,
  duration,
  shortDescription,
  revealed,
  season,
  number,
  compact = false,
}: Props) {
  const serial = (
    <SheetSerial
      parts={[`GG-${season}`, 'Spill', String(number).padStart(2, '0')]}
    />
  );
  const frame = `bg-bg flex h-full flex-col border ${compact ? 'gap-2 p-3' : 'gap-3 p-4'}`;
  const heading = `text-text font-extrabold ${compact ? 'text-sm' : 'text-lg'}`;
  const meta = `text-text-muted font-mono uppercase ${compact ? 'text-[10px] tracking-wider' : 'text-xs tracking-widest'}`;

  if (revealed) {
    return (
      <Link
        className={`${frame} border-border-accent hover:border-accent focus-visible:outline-accent transition-colors duration-150 focus-visible:outline-2 focus-visible:outline-offset-2`}
        href={slug}
      >
        {serial}
        <Image
          src={thumbnailPath}
          alt={title}
          width={480}
          height={270}
          className='w-full'
        />
        <h3 className={heading}>{title}</h3>
        <p className={meta}>
          {chosenBy} · {duration}
        </p>
        {!compact && (
          <p className='text-text-muted text-sm'>{shortDescription}</p>
        )}
      </Link>
    );
  }

  return (
    <div className={`${frame} border-border`}>
      {serial}
      <div
        aria-hidden='true'
        className={`bg-surface text-text-muted grid w-full place-items-center font-mono ${compact ? 'aspect-video text-4xl' : 'h-40 text-6xl'}`}
      >
        ?
      </div>
      <h3 className={heading}>Spill #{number}</h3>
      <p className={meta}>– · –</p>
      {!compact && (
        <p className='text-text-muted text-sm'>
          Når spillene har blitt avslørt kommer de til å vises her!
        </p>
      )}
    </div>
  );
}
