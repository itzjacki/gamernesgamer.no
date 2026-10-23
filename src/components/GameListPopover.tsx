import type { TagGameResult } from '@/lib/results/view-models';
import Popover, { PopoverGroup } from './Popover';
import RecordLines from './RecordLines';

interface Group {
  name?: string;
  /**
   * `opponentPlacement` makes it a pair's row (/vs), "2–4", which never takes
   * the accent: in a series score a "1" is not a win at all.
   */
  results: (TagGameResult & { opponentPlacement?: number })[];
}

interface Props {
  /** Unique on the page. */
  id: string;
  label: string;
  heading?: string;
  groups: Group[];
  /**
   * For a pair's rows: read out before each figure in place of "plass"
   * (which would be wrong for a series score).
   */
  sides?: { a: string; b: string };
  className?: string;
}

export default function GameListPopover({
  id,
  label,
  heading = label,
  groups,
  sides,
  className,
}: Props) {
  return (
    <Popover
      id={id}
      heading={heading}
      className={className}
      panel={groups.map((group, index) => (
        <PopoverGroup key={group.name ?? index} name={group.name}>
          <RecordLines
            // The index is part of the key: a pair can meet more than once in
            // one game (group stage, then the final).
            lines={group.results.map((r, i) => ({
              key: `${r.seasonSlug}-${r.gameSlug}-${i}`,
              game: r,
              seasonNumber: r.seasonNumber,
              accent: r.opponentPlacement === undefined && r.placement === 1,
              value:
                r.opponentPlacement === undefined ? (
                  <>
                    <span className='sr-only'>plass </span>
                    {r.placement}
                  </>
                ) : (
                  <>
                    <span className='sr-only'>
                      {sides ? `${sides.a} ` : 'plass '}
                    </span>
                    {r.placement}–
                    <span className='sr-only'>
                      {sides ? `${sides.b} ` : 'mot plass '}
                    </span>
                    {r.opponentPlacement}
                  </>
                ),
            }))}
          />
        </PopoverGroup>
      ))}
    >
      {label}
    </Popover>
  );
}
