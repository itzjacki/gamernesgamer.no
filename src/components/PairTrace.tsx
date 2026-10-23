import type { PairGame, PairSeason, PairSide } from '@/lib/results/view-models';
import Popover from './Popover';

/**
 * A game win is deliberately not told apart from any other game finished
 * ahead. The grid would read as two bare runs of digits to a screen reader,
 * so it is hidden and each season carries a visually hidden list instead.
 */

interface Props {
  seasons: PairSeason[];
  names: { a: string; b: string };
  detailHeading: (season: PairSeason) => string;
  /** For the tally's popover. */
  detail: (season: PairSeason) => React.ReactNode;
}

const label =
  'text-text-muted truncate font-mono text-xs tracking-wide uppercase sm:tracking-widest';

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
