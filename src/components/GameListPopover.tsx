import type { TagGameResult } from '@/lib/results/view-models';
import Popover, { PopoverGroup } from './Popover';
import RecordLines from './RecordLines';

/**
 * A word that opens the list of games behind it: a `Popover` whose panel lists
 * each game's title (linking to the game page), season and placement. Game
 * wins take the accent.
 *
 * Shared by the two category tables: TagRecord (one player's categories) and
 * TagCrowns (best player per category), so a category name behaves the same
 * in both. The panel can hold several groups — TagCrowns uses one per tied
 * holder, each under that player's name.
 *
 * /vs uses the same panel for a PAIR's lists: each row then carries two
 * figures ("2–4") — the two players' placements in a game, or the series score
 * of a match between them. Those rows never take the accent: on a two-player
 * page nothing colours one side over the other (and in a series score a "1"
 * is not a win at all).
 */

interface Group {
  /** Shown over the group's games; omit for a single unnamed list. */
  name?: string;
  /**
   * `opponentPlacement` makes it a pair's row (/vs): it reads "2–4", this
   * player's figure and the other's, with no accent on either.
   */
  results: (TagGameResult & { opponentPlacement?: number })[];
}

interface Props {
  /** Unique on the page — the popover id and the CSS anchor name. */
  id: string;
  /** The trigger text. */
  label: string;
  /** The panel's heading; defaults to the label. */
  heading?: string;
  groups: Group[];
  /**
   * For a pair's rows: the two players' names, read out before each figure
   * in place of "plass" (which would be wrong for a series score).
   */
  sides?: { a: string; b: string };
  /** Utility classes for the trigger (e.g. `uppercase` inside a mono label). */
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
