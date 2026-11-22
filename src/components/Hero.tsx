import SectionLabel from './SectionLabel';

/**
 * The person hero shared by the season page's champion and the career page.
 * The accent hairline is drawn for every hero: with nothing to compare
 * against, it is identity, not a ranking signal.
 */

interface Props {
  eyebrow?: React.ReactNode;
  name: string;
  /** h1 where the name is the page's title (the career page). */
  nameAs?: 'h1' | 'p';
  nickname: string;
  /** A last mono line under the nickname. */
  extra?: React.ReactNode;
  /** The right-hand cell: the picture, already toned. None, no cell. */
  picture?: React.ReactNode;
}

export default function Hero({
  eyebrow,
  name,
  nameAs: Name = 'p',
  nickname,
  extra,
  picture,
}: Props) {
  return (
    <section className='border-border bg-bg relative grid grid-cols-1 border sm:grid-cols-[1fr_auto]'>
      <div className='bg-accent absolute inset-x-0 top-0 h-px' aria-hidden />

      <div className='flex flex-col justify-center gap-3 p-6 sm:p-10'>
        {eyebrow && <SectionLabel>{eyebrow}</SectionLabel>}
        <Name className='text-text text-5xl font-extrabold tracking-tight uppercase sm:text-6xl lg:text-7xl'>
          {name}
        </Name>
        <p className='text-text-muted font-mono text-xs tracking-wide uppercase sm:tracking-widest'>
          {nickname}
        </p>
        {extra && (
          <p className='text-text-muted mt-2 font-mono text-xs tracking-wide uppercase sm:tracking-widest'>
            {extra}
          </p>
        )}
      </div>

      {picture && (
        <div className='border-border flex items-end justify-center border-t sm:border-t-0 sm:border-l'>
          {picture}
        </div>
      )}
    </section>
  );
}
