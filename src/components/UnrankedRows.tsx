import { MIN_RANKED_GAMES } from '@/lib/tag-ranking';

/**
 * A <details> can't wrap table rows, so the children are a second table; the
 * caller keeps its columns aligned with the first (fixed layout + the same
 * <colgroup>).
 */

interface Props {
  count: number;
  className?: string;
  children: React.ReactNode;
}

export const unrankedCaption = `Under ${MIN_RANKED_GAMES} spill · ikke rangert`;

export default function UnrankedRows({
  count,
  className = '',
  children,
}: Props) {
  return (
    <details className={`group ${className}`.trim()}>
      <summary className='text-text-muted hover:text-accent focus-visible:outline-accent flex min-h-11 cursor-pointer list-none items-center justify-between gap-4 px-3 font-mono text-xs tracking-widest uppercase transition-colors duration-150 focus-visible:outline-2 focus-visible:outline-offset-2 sm:px-4 [&::-webkit-details-marker]:hidden'>
        <span className='group-open:hidden'>Vis flere ({count})</span>
        <span className='hidden group-open:inline'>Vis færre</span>
        <svg
          aria-hidden='true'
          viewBox='0 0 12 12'
          className='size-3 transition-transform duration-150 group-open:rotate-180'
          fill='none'
          stroke='currentColor'
          strokeWidth='1.5'
        >
          <path d='M2 4l4 4 4-4' />
        </svg>
      </summary>
      {children}
    </details>
  );
}
