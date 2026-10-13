import type { PairGame, PairSeason, PairSide } from '@/lib/results/view-models';
import Popover from './Popover';

/**
 * Game by game: every game the two shared, in play order, one block per
 * season. Each game is a column with side `a`'s final placement above a
 * hairline and side `b`'s below it. The placement that finished ahead is set
 * strong, the other is muted, so the run of play reads at a glance — who was
 * ahead, for how long, and by how much — without a legend. When the two placed
 * level both stay muted.
 *
 * "Strong" is the plain text colour, not the accent: on a two-player page
 * being ahead of the other is not rank-1 data, and a game win is deliberately
 * not told apart from any other game finished ahead.
 *
 * The grid is laid out for the eye — a column per game, a row per player —
 * which a screen reader would read as two bare runs of digits. So the grid is
 * hidden from assistive tech and each season carries the same information as
 * a visually hidden list instead: one item per game, naming the game and both
 * placements. Each block ends in the season's tally, which also opens that
 * list as a popover for everyone.
 */

interface Props {
  seasons: PairSeason[];
  /** The two names: the row labels, and the tally's screen-reader text. */
  names: { a: string; b: string };
  /** The popover heading for one season's games. */
  detailHeading: (season: PairSeason) => string;
  /** The list of one season's games, for the tally's popover. */
  detail: (season: PairSeason) => React.ReactNode;
}

const label =
  'text-text-muted truncate font-mono text-xs tracking-wide uppercase sm:tracking-widest';

/** One player's placements across a season's games. */
function Placements({
  name,
  side,
  games,
  columns,
}: {
  name: string;
  side: PairSide;
  games: PairGame[];
  columns: React.CSSProperties;
}) {
  const other: PairSide = side === 'a' ? 'b' : 'a';
  return (
    <span className='grid h-7 items-center' style={columns}>
      <span className={label}>{name}</span>
      {games.map((game) => (
        <span
          key={game.gameSlug}
          className={`text-center font-mono text-sm tabular-nums ${
            game[side] < game[other]
              ? 'text-text font-medium'
              : 'text-text-muted'
          }`}
        >
          {game[side]}
        </span>
      ))}
    </span>
  );
}

export default function PairTrace({
  seasons,
  names,
  detailHeading,
  detail,
}: Props) {
  // Every block shares one column width (the longest season's), so a game sits
  // in the same column whichever season it is in and short seasons end early.
  const slots = Math.max(...seasons.map((s) => s.tally.games.length), 1);
  const columns = {
    gridTemplateColumns: `clamp(4rem, 12vw, 5.5rem) repeat(${slots}, minmax(0, 1fr))`,
  };

  return (
    <ul className='border-border bg-bg border'>
      {seasons.map((season) => (
        <li
          key={season.season.seasonSlug}
          className='border-border grid grid-cols-[1.5rem_1fr_auto] items-center gap-2 border-b px-4 py-3 last:border-b-0 sm:gap-4 sm:px-8'
        >
          <span className='text-text-muted font-mono text-xs tabular-nums'>
            <span className='sr-only'>Sesong </span>
            <span aria-hidden='true'>S</span>
            {season.season.seasonNumber}
          </span>

          <span aria-hidden='true' className='flex min-w-0 flex-col'>
            <Placements
              name={names.a}
              side='a'
              games={season.tally.games}
              columns={columns}
            />
            <span className='bg-border h-px' />
            <Placements
              name={names.b}
              side='b'
              games={season.tally.games}
              columns={columns}
            />
          </span>
          <ul className='sr-only'>
            {season.tally.games.map((game) => (
              <li key={game.gameSlug}>
                {game.gameTitle}: {names.a} plass {game.a}, {names.b} plass{' '}
                {game.b}
              </li>
            ))}
          </ul>

          <Popover
            id={`trace-${season.season.seasonSlug}`}
            heading={detailHeading(season)}
            panel={detail(season)}
            className='text-text font-mono text-sm tabular-nums'
          >
            <span className='sr-only'>{names.a} </span>
            {season.tally.a}–<span className='sr-only'>{names.b} </span>
            {season.tally.b}
          </Popover>
        </li>
      ))}
    </ul>
  );
}
