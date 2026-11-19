import Image from 'next/image';
import type { ComposedGamePlacementRow } from '@/lib/results/compose';
import { signedDelta } from '@/lib/format';
import Popover from './Popover';

/**
 * Every power-up and curse that fired in a game, zero-delta ones included.
 * The sign carries direction, never colour.
 */

const LABELS = {
  powerUp: 'Power-up',
  curse: 'Curse',
};

interface Props {
  /** Namespaces popover ids. */
  id: string;
  /** In placement order; the uses are listed in the same order. */
  rows: ComposedGamePlacementRow[];
}

export default function PowerUpUseList({ id, rows }: Props) {
  const uses = rows.flatMap((row) =>
    row.powerUpUses.map((use) => ({ player: row.player, use })),
  );

  return (
    <ul className='border-border bg-bg border'>
      {uses.map(({ player, use }, i) => (
        <li
          key={`${player.seasonPlayerId}-${use.slug}-${i}`}
          className='border-border grid h-10 grid-cols-[2.5rem_1fr_auto_3rem] items-center gap-3 border-b pr-3 last:border-b-0 sm:grid-cols-[2.5rem_1fr_8rem_3rem]'
        >
          <Image
            src={use.imagePath}
            alt=''
            width={40}
            height={40}
            className='border-border h-10 w-10 border-r object-cover'
          />
          <span className='flex min-w-0 items-baseline gap-3'>
            <span className='relative truncate'>
              <Popover
                id={`${id}-${i}`}
                heading={use.name}
                panel={
                  <p className='text-text-muted text-sm leading-relaxed'>
                    {use.description}
                  </p>
                }
                className='text-text font-semibold'
              >
                {use.name}
              </Popover>
            </span>
            <span className='text-text-muted shrink-0 font-mono text-xs tracking-wide uppercase sm:tracking-widest'>
              {use.isCurse ? LABELS.curse : LABELS.powerUp}
            </span>
          </span>
          <span className='text-text truncate'>{player.name}</span>
          <span className='text-text text-right font-mono text-sm tabular-nums'>
            {signedDelta(use.pointsDelta)}
          </span>
        </li>
      ))}
    </ul>
  );
}
