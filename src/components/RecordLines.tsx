import Link from 'next/link';
import styles from './Popover.module.css';

/**
 * The one list inside a popover. Every popover list on the site is built from
 * these rows, so they all read alike.
 */

export interface RecordLine {
  key: string;
  game?: { seasonSlug: string; gameSlug: string; gameTitle: string };
  /** A plain subject instead of a game (a power-up, "points from the game"). */
  label?: string;
  /** Leave out for a label row. */
  seasonNumber?: number;
  value?: React.ReactNode;
  /** Rank-1 data (a game win): the value takes the accent. */
  accent?: boolean;
  /** A sentence instead of a figure. */
  text?: string;
}

export default function RecordLines({ lines }: { lines: RecordLine[] }) {
  return (
    <ul className={styles.lines}>
      {lines.map((line) => {
        const hasSubject = line.game !== undefined || line.label !== undefined;
        const hasSeason = line.seasonNumber !== undefined;
        const columns =
          hasSubject && hasSeason
            ? 'grid-cols-[1fr_auto_auto]'
            : line.text
              ? 'grid-cols-[auto_1fr]'
              : 'grid-cols-[1fr_auto]';
        return (
          <li key={line.key} className={`${columns} ${styles.line}`}>
            {line.game ? (
              <Link
                href={`/sesong/${line.game.seasonSlug}/${line.game.gameSlug}`}
                className={styles.title}
              >
                {line.game.gameTitle}
              </Link>
            ) : (
              line.label !== undefined && (
                <span className={styles.title}>{line.label}</span>
              )
            )}
            {hasSeason && (
              <span className={styles.meta}>
                <span className='sr-only'>sesong </span>
                <span aria-hidden='true'>S</span>
                {line.seasonNumber}
              </span>
            )}
            {line.text ? (
              <span>{line.text}</span>
            ) : (
              <span
                className={`${styles.value} ${line.accent ? styles.win : ''}`}
              >
                {line.value}
              </span>
            )}
          </li>
        );
      })}
    </ul>
  );
}
