import type { PowerUp } from '@/types/power-up';
import LightningIcon from './LightningIcon';

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
      className={`flex h-full min-h-96 w-64 flex-col gap-4 rounded-2xl p-4 pb-6 ${isCurse ? 'bg-reddish' : 'bg-darkblueish'}`}
    >
      {revealed ? (
        <>
          <img src={imagePath} alt='' className='min-h-32 rounded-2xl' />
          <div className='flex items-center justify-center gap-4'>
            <LightningIcon color='reddish' />
            <h3 className='font-quantico text-center text-xl'>{name}</h3>
            <LightningIcon color='reddish' />
          </div>
          <p>{description}</p>
        </>
      ) : (
        <>
          <p className='bg-darkblueish-dark font-quantico text-darkblueish rounded-xl text-center text-9xl'>
            ?
          </p>
          <div className='flex items-center justify-center gap-4'>
            <LightningIcon color={isCurse ? 'blueish' : 'reddish'} />
            <h3 className='font-quantico text-center text-xl'>
              Mystisk {isCurse ? 'Curse' : 'Powerup'}
            </h3>
            <LightningIcon color={isCurse ? 'blueish' : 'reddish'} />
          </div>
          <p>Denne {isCurse ? 'cursen' : 'powerupen'} avsløres snart!</p>
        </>
      )}
    </div>
  );
}
