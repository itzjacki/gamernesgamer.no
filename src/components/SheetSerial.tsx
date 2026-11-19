/** A spec sheet's serial, e.g. `GG-05 / SPILL / 03`. */

interface Props {
  parts: string[];
}

export default function SheetSerial({ parts }: Props) {
  return (
    <span className='text-text-muted font-mono text-[10px] tracking-wide uppercase sm:tracking-widest'>
      {parts.join(' / ')}
    </span>
  );
}
