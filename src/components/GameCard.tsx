import LightningIcon from './LightningIcon';

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
      <a
        className='border-darkblueish hover:bg-grayish-light flex h-full max-w-[18rem] flex-col items-center gap-2 rounded-2xl border-2 p-4 transition-all'
        href={slug}
      >
        <img src={thumbnailPath} alt={title} className='rounded-3xl' />
        <h3 className='font-quantico text-center text-xl'>{title}</h3>
        <div className='font-quantico text-reddish flex gap-4'>
          <p>{chosenBy}</p>
          <LightningIcon color='blueish' />
          <p>{duration}</p>
        </div>
        <p className='text-center'>{shortDescription}</p>
      </a>
    );
  }

  return (
    <div className='border-darkblueish flex max-w-[18rem] flex-col items-center gap-2 rounded-2xl border-2 p-4'>
      <div className='bg-darkblueish font-quantico grid h-40 w-64 place-items-center rounded-3xl text-9xl'>
        ?
      </div>
      <h3 className='font-quantico text-xl'>Mystisk spill</h3>
      <div className='font-quantico text-reddish flex gap-4'>
        <p>-</p>
        <LightningIcon color='blueish' />
        <p>-</p>
      </div>
      <p className='text-center'>
        Når spillene har blitt avslørt kommer de til å vises her!
      </p>
    </div>
  );
}
