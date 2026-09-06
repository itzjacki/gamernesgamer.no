import Image from 'next/image';
import type { PowerUp } from '@/types/power-up';

interface Props extends PowerUp {
  revealed: boolean;
}

export default function PowerUpCard({
  name,
  description,
  imagePath,
  isCurse,
  revealed,
}: Props) {
  return (
    <div
      className={`flex h-full flex-col gap-4 border p-4 pb-6 ${
        isCurse ? 'border-accent bg-bg' : 'border-border-accent bg-bg'
      }`}
    >
      <p className='text-text-muted font-mono text-xs tracking-widest uppercase'>
        {isCurse ? 'Curse' : 'Power-up'}
      </p>

      {revealed ? (
        <>
          <Image
            src={imagePath}
            alt=''
            width={240}
            height={240}
            className='w-full'
          />
          <h3 className='text-text text-center text-lg font-semibold'>
            {name}
          </h3>
          <p className='text-text-muted text-sm leading-relaxed'>
            {description}
          </p>
        </>
      ) : (
        <>
          <div
            aria-hidden='true'
            className='bg-surface text-text-muted grid h-40 w-full place-items-center font-mono text-6xl'
          >
            ?
          </div>
          <h3 className='text-text text-center text-lg font-semibold'>
            Mystisk {isCurse ? 'curse' : 'power-up'}
          </h3>
          <p className='text-text-muted text-sm leading-relaxed'>
            Denne {isCurse ? 'cursen' : 'power-upen'} avsløres snart!
          </p>
        </>
      )}
    </div>
  );
}
