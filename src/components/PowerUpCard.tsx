import Image from 'next/image';
import type { PowerUp } from '@/types/power-up';
import SheetSerial from './SheetSerial';

interface Props extends PowerUp {
  revealed: boolean;
  /** Zero-padded season slug, e.g. "04", for the serial. */
  season: string;
  /** 1-based place among the season's power-ups, or among its curses. */
  number: number;
  /** Smaller type and no description, for the front page. */
  compact?: boolean;
}

export default function PowerUpCard({
  name,
  description,
  imagePath,
  isCurse,
  revealed,
  season,
  number,
  compact = false,
}: Props) {
  const kind = isCurse ? 'Curse' : 'Power-up';
  const heading = `text-text text-center font-semibold ${compact ? 'text-sm' : 'text-lg'}`;

  return (
    <div
      className={`flex h-full flex-col border ${compact ? 'gap-2 p-3' : 'gap-4 p-4 pb-6'} ${
        isCurse ? 'border-accent bg-bg' : 'border-border bg-bg'
      }`}
    >
      <SheetSerial
        parts={[`GG-${season}`, kind, String(number).padStart(2, '0')]}
      />

      {revealed ? (
        <>
          <Image
            src={imagePath}
            alt=''
            width={240}
            height={240}
            className='w-full'
          />
          <h3 className={heading}>{name}</h3>
          {!compact && (
            <p className='text-text-muted text-sm leading-relaxed'>
              {description}
            </p>
          )}
        </>
      ) : (
        <>
          <div
            aria-hidden='true'
            className={`bg-surface text-text-muted grid w-full place-items-center font-mono ${compact ? 'aspect-square text-4xl' : 'h-40 text-6xl'}`}
          >
            ?
          </div>
          <h3 className={heading}>
            {kind} #{number}
          </h3>
          {!compact && (
            <p className='text-text-muted text-sm leading-relaxed'>
              Denne {isCurse ? 'cursen' : 'power-upen'} avsløres snart!
            </p>
          )}
        </>
      )}
    </div>
  );
}
