interface Props {
  statName: string;
  statValue: number | '?';
  statMin?: number;
  statMax?: number;
}

export default function Statbar({
  statName,
  statValue,
  statMin = 50,
  statMax = 99,
}: Props) {
  function getBarWidth() {
    if (statValue === '?') return 0;
    return Math.min(
      100,
      Math.max(
        0,
        Math.round(((statValue - statMin) / (statMax - statMin)) * 100),
      ),
    );
  }

  return (
    <div className='grid h-fit grid-cols-2 text-xs'>
      <p>{statName}</p>
      <p className='text-right'>{statValue}</p>
      <div className='bg-border relative col-span-2 h-1 w-full'>
        <div
          className='bg-accent absolute top-0 left-0 h-full'
          style={{ width: `${getBarWidth()}%` }}
        />
      </div>
    </div>
  );
}
