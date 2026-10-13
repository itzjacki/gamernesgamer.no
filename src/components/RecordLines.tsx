import Link from 'next/link';
import styles from './Popover.module.css';

/**
 * The list inside a popover: what is behind a number or a word. One row per
 * game (title linking to the game page, season, value), per season (season,
 * value) or per plain label (label, value). Every popover list on the site is
 * built from these rows — the games behind a category, a record, a pair's
 * tally, a points breakdown — so they all read alike. Styled by the shared
 * popover stylesheet.
 */

export interface RecordLine {
  key: string;
  /** The game the row is about; its title links to the game page. */
  game?: { seasonSlug: string; gameSlug: string; gameTitle: string };
  /** A plain subject instead of a game (a power-up, "points from the game"). */
  label?: string;
  /** The season the row is from or about; leave out for a label row. */
  seasonNumber?: number;
  /** The row's figure, set in the mono face on the right. */
  value?: React.ReactNode;
  /** Rank-1 data (a game win): the value takes the accent. */
  accent?: boolean;
  /** A sentence instead of a figure, set in the text face after the season. */
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
