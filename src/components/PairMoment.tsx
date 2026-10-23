import Link from 'next/link';
import Popover from './Popover';

/**
 * Plates come in mirrored pairs and BOTH are always there: a player with no
 * such moment gets a muted dash, not a hole in the wall.
 */

interface Props {
  /** Unique on the page. */
  id: string;
  label: string;
  player: { slug: string; name: string };
  moment?: {
    /** E.g. "S2" or "S1–S2". */
    scope: string;
    figure: string;
    unit: string;
    detail: React.ReactNode;
  };
}

const eyebrow =
  'text-text-muted font-mono text-xs tracking-wide uppercase sm:tracking-widest';

export default function PairMoment({ id, label, player, moment }: Props) {
  return (
    <li className='bg-bg'>
      <article className='flex h-full flex-col gap-4 p-4 pb-0 sm:px-8 sm:pt-5'>
        <header className='flex items-baseline justify-between gap-4'>
          <h3 className={eyebrow}>{label}</h3>
          {moment && (
            <span className={`shrink-0 ${eyebrow}`}>{moment.scope}</span>
          )}
        </header>

        <p className='text-text text-xl'>
          <Link
            href={`/spillere/${player.slug}`}
            className='hover:text-accent focus-visible:outline-accent underline-offset-2 transition-colors duration-150 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2'
          >
            {player.name}
          </Link>
        </p>

        <div className='mt-auto flex flex-col'>
          <div className='flex items-baseline gap-2 pb-4'>
            {moment ? (
              <>
                <Popover
                  id={`moment-${id}`}
                  heading={`${label} · ${player.name}`}
                  panel={moment.detail}
                  tone='accent'
                  className='text-accent shrink-0 font-mono text-3xl leading-none tabular-nums'
                >
                  {moment.figure}
                </Popover>
                <span className='text-text-muted font-mono text-xs'>
                  {moment.unit}
                </span>
              </>
            ) : (
              <span className='text-text-muted font-mono text-3xl leading-none'>
                <span aria-hidden='true'>–</span>
                <span className='sr-only'>Ingen</span>
              </span>
            )}
          </div>
          <div
            aria-hidden='true'
            className='border-border -mx-4 h-8 border-t sm:-mx-8'
          />
        </div>
      </article>
    </li>
  );
}
