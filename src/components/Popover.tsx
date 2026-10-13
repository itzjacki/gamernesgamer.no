import styles from './Popover.module.css';

/**
 * The site's detail-on-demand primitive: a trigger, and the panel it opens.
 * A native popover (`<button popovertarget>` + `[popover]`) — toggle,
 * light-dismiss and Escape with no JS, so it stays a Server Component.
 *
 * Every popover on the site goes through this, so they all open, position
 * and read alike: the points breakdown on a season page (GamePointsMatrix),
 * the games behind a category (GameListPopover), what is behind a record
 * (RecordPlate), a trophy's label (TrophyShelf) and the lists on /vs. The
 * panel's body is usually a `RecordLines` list.
 *
 * The trigger's colour, face and size come from `className` (utility classes)
 * or from where it sits; `tone` only chooses the underline affordance.
 */

interface Props {
  /** Unique on the page — the popover id and the CSS anchor name. */
  id: string;
  /** The trigger's content: a word, a figure, an icon. */
  children: React.ReactNode;
  /** The panel's mono heading; leave out for a bare list. */
  heading?: string;
  /** The panel's body. */
  panel: React.ReactNode;
  /**
   * The trigger's affordance: `word` (default) is a muted dotted underline
   * that earns the accent on hover; `accent` is for a figure already accent
   * at rest; `none` leaves the look entirely to `className` (a boxed icon).
   */
  tone?: 'word' | 'accent' | 'none';
  /** In a dense list: cap the enlarged touch target at the row's height. */
  dense?: boolean;
  /** For a trigger whose content does not name it (an icon, a bare number). */
  label?: string;
  className?: string;
}

export default function Popover({
  id,
  children,
  heading,
  panel,
  tone = 'word',
  dense = false,
  label,
  className = '',
}: Props) {
  // A unique dashed-ident anchor name per trigger, bridged to the CSS module
  // via an inline custom property on both the trigger and its panel.
  const anchorStyle = { '--anchor': `--${id}` } as React.CSSProperties;
  const look =
    tone === 'none'
      ? ''
      : `${styles.trigger} ${styles[tone]} ${dense ? styles.dense : ''}`;

  return (
    <>
      <button
        type='button'
        popoverTarget={id}
        className={`${styles.anchor} ${look} ${className}`}
        style={anchorStyle}
        aria-label={label}
      >
        {children}
      </button>
      <div id={id} popover='auto' className={styles.panel} style={anchorStyle}>
        {heading && <p className={styles.heading}>{heading}</p>}
        {panel}
      </div>
    </>
  );
}

/** A named group inside a panel: its label, then its rows. */
export function PopoverGroup({
  name,
  children,
}: {
  /** Shown over the group; leave out for a single unnamed list. */
  name?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      {name && <p className={styles.group}>{name}</p>}
      {children}
    </div>
  );
}
