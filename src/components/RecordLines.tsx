import Link from 'next/link';

/**
 * The list inside a record's popover: what is behind the number. One row per
 * game (title linking to the game page, season, value) or per season (season,
 * value). RecordPlate uses it for its default "games behind the figure" list,
 * and /records builds the other details (matches, points, power-ups, pairs)
 * from the same rows so every popover reads alike.
 */

export interface RecordLine {
  key: string;
  /** The game the row is about; leave out for a row about a whole season. */
  game?: { seasonSlug: string; gameSlug: string; gameTitle: string };
  seasonNumber: number;
  /** The row's figure, set in the mono face on the right. */
  value?: React.ReactNode;
  /** Rank-1 data (a game win): the value takes the accent. */
  accent?: boolean;
  /** A sentence instead of a figure, set in the text face after the season. */
  text?: string;
}

const row =
  'border-border grid items-baseline gap-4 border-t py-2 text-sm first:border-t-0';
const link =
  'hover:text-accent focus-visible:outline-accent underline underline-offset-2 transition-colors duration-150 focus-visible:outline-2 focus-visible:outline-offset-2';

export default function RecordLines({ lines }: { lines: RecordLine[] }) {
  return (
    <ul className='flex flex-col'>
      {lines.map((line) => {
        const columns = line.game
          ? 'grid-cols-[1fr_auto_auto]'
          : line.text
            ? 'grid-cols-[auto_1fr]'
            : 'grid-cols-[1fr_auto]';
        return (
          <li key={line.key} className={`${columns} ${row}`}>
            {line.game && (
              <Link
                href={`/sesong/${line.game.seasonSlug}/${line.game.gameSlug}`}
                className={link}
              >
                {line.game.gameTitle}
              </Link>
            )}
            <span className='text-text-muted font-mono tabular-nums'>
              <span className='sr-only'>sesong </span>
              <span aria-hidden='true'>S</span>
              {line.seasonNumber}
            </span>
            {line.text ? (
              <span>{line.text}</span>
            ) : (
              <span
                className={`font-mono tabular-nums ${
                  line.accent ? 'text-accent font-bold' : ''
                }`}
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
