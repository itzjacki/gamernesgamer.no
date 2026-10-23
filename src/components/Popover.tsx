import styles from './Popover.module.css';

/**
 * The site's one popover; native `[popover]`, so no client JS. The trigger's
 * colour, face and size come from `className` or its context; `tone` only
 * chooses the underline affordance.
 */

interface Props {
  /** Unique on the page — the popover id and the CSS anchor name. */
  id: string;
  children: React.ReactNode;
  heading?: string;
  panel: React.ReactNode;
  /**
   * `word`: muted dotted underline, accent on hover; `accent`: for a figure
   * already accent at rest; `none`: the look is left to `className`.
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
  // Bridges the anchor name to the CSS module, on both trigger and panel.
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

export function PopoverGroup({
  name,
  children,
}: {
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
