import Link from 'next/link';
import styles from './GameListPopover.module.css';
import type { TagGameResult } from '@/lib/results/view-models';

/**
 * A word that opens the list of games behind it: a native-popover trigger
 * (`<button popovertarget>` + `[popover]` — no JS, stays a Server Component)
 * marked with a dotted underline, and a panel listing each game's title
 * (linking to the game page), season and placement. Game wins take the accent.
 *
 * Shared by the two category tables: TagRecord (one player's categories) and
 * TagCrowns (best player per category), so a category name behaves the same
 * in both. The panel can hold several groups — TagCrowns uses one per tied
 * holder, each under that player's name.
 */

interface Group {
  /** Shown over the group's games; omit for a single unnamed list. */
  name?: string;
  results: TagGameResult[];
}

interface Props {
  /** Unique on the page — the popover id and the CSS anchor name. */
  id: string;
  /** The trigger text. */
  label: string;
  /** The panel's heading; defaults to the label. */
  heading?: string;
  groups: Group[];
}

export default function GameListPopover({
  id,
  label,
  heading = label,
  groups,
}: Props) {
  // A unique dashed-ident anchor name per trigger, bridged to the CSS module
  // via an inline custom property on both the trigger and its popover.
  const anchorStyle = { '--anchor': `--${id}` } as React.CSSProperties;

  return (
    <>
      <button
        type='button'
        popoverTarget={id}
        className={styles.trigger}
        style={anchorStyle}
      >
        {label}
      </button>
      <div
        id={id}
        popover='auto'
        className={styles.popover}
        style={anchorStyle}
      >
        <p className={styles.heading}>{heading}</p>
        {groups.map((group, index) => (
          <div key={group.name ?? index}>
            {group.name && <p className={styles.group}>{group.name}</p>}
            <ul className={styles.lines}>
              {group.results.map((r) => (
                <li
                  key={`${r.seasonSlug}-${r.gameSlug}`}
                  className={styles.line}
                >
                  <Link
                    href={`/sesong/${r.seasonSlug}/${r.gameSlug}`}
                    className={styles.game}
                  >
                    {r.gameTitle}
                  </Link>
                  <span className={styles.season}>
                    <span className='sr-only'>sesong </span>
                    <span aria-hidden='true'>S</span>
                    {r.seasonNumber}
                  </span>
                  <span
                    className={`${styles.placement} ${r.placement === 1 ? styles.win : ''}`}
                  >
                    <span className='sr-only'>plass </span>
                    {r.placement}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </>
  );
}
