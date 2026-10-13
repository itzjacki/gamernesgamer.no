import Popover from './Popover';
import RecordLines from './RecordLines';

/**
 * GamePointsMatrix — the per-game points "box score" for a finished season.
 *
 * A motorsport timing sheet: one row per game (in play order), one column per
 * player, plus a leading game-label column and a bottom "Totalt" row carrying
 * each player's season total. Reuses the VERKSTED table language established by
 * StandingsTable (Martian Mono numerics, `border-border` hairlines between
 * rows, no row hover, no radius, no shadow, a solid `bg-bg` surface masking the
 * blueprint grid).
 *
 * Axes are flipped relative to the obvious layout (games as ROWS, players as
 * COLUMNS) on purpose: a season has more games (~up to 10) than players (~4–5),
 * so games-as-rows keeps the long axis vertical and the table narrow enough to
 * avoid horizontal scroll on mobile.
 *
 * Power-up / curse treatment (per design review): each cell shows the player's
 * TOTAL points for that game as a plain, clean number — never inflated. When a
 * power-up or curse applied (incl. zero-net uses), the number becomes a native
 * popover trigger (`<button popovertarget>` + `[popover]` — no JS, no
 * `'use client'`; the browser handles toggle, light-dismiss, Escape) marked
 * with a dotted underline. The popover breaks the total down: a "Grunnpoeng"
 * line (base ladder points) plus one line per power-up with its signed delta.
 * The sign (`+` / `−`, real U+2212) carries direction — NOT colour: the accent
 * (#E8334A) stays reserved for the rank-1 player.
 */

/** One power-up/curse applied to a player in a game, with its display name. */
export interface MatrixPowerUpUse {
  name: string;
  isCurse: boolean;
  pointsDelta: number;
}

/** One player's result in one game. */
export interface MatrixCell {
  /** season_player.id — stable key / column identity. */
  seasonPlayerId: string;
  /** Base ladder points from placement (the "Grunnpoeng" line). */
  ladderPoints: number;
  /** ladderPoints + Σ power-up deltas — the points this game awarded (shown). */
  points: number;
  /** Power-ups/curses applied here (incl. zero-delta). Empty = plain cell. */
  powerUpUses: MatrixPowerUpUse[];
}

/** One game row: its label + a cell per player, in `players` column order. */
export interface MatrixGameRow {
  /** game.ordinal — play order; also the row key + part of popover ids. */
  ordinal: number;
  /** Display label for the game (its title). */
  label: string;
  /** Per-player cells, same order as `players`. */
  cells: MatrixCell[];
}

/** A player column header. */
export interface MatrixPlayer {
  seasonPlayerId: string;
  /** Display name. */
  name: string;
  /** Season total points — shown in the "Totalt" row. */
  totalPoints: number;
  /** True for the rank-1 player — the one sanctioned accent spend. */
  isChampion: boolean;
}

interface Props {
  /** Season number — namespaces popover ids across the page. */
  seasonNumber: number;
  players: MatrixPlayer[];
  games: MatrixGameRow[];
}

/** Format a signed delta with a real minus (U+2212), zero shown as "0". */
function signedDelta(n: number): string {
  if (n > 0) return `+${n}`;
  if (n < 0) return `\u2212${Math.abs(n)}`;
  return '0';
}

/** A plain, non-interactive points cell (no power-up applied). */
function PlainCell({ points }: { points: number }) {
  return (
    <td className='text-text px-3 py-3 text-center font-mono text-sm tabular-nums'>
      {points}
    </td>
  );
}

/**
 * An interactive points cell: the total is a native-popover trigger that opens
 * a breakdown panel. Server-rendered static HTML — no client JS.
 */
function PopoverCell({
  cell,
  popoverId,
}: {
  cell: MatrixCell;
  popoverId: string;
}) {
  return (
    <td className='relative px-3 py-3 text-center font-mono text-sm tabular-nums'>
      <Popover
        id={popoverId}
        label={`${cell.points} poeng, vis poengfordeling`}
        className='text-text'
        panel={
          <RecordLines
            lines={[
              {
                key: 'ladder',
                label: 'Poeng fra spillet',
                value: cell.ladderPoints,
              },
              ...cell.powerUpUses.map((use, i) => ({
                key: `${use.name}-${i}`,
                label: use.name,
                value: signedDelta(use.pointsDelta),
              })),
            ]}
          />
        }
      >
        {cell.points}
      </Popover>
    </td>
  );
}

export default function GamePointsMatrix({
  seasonNumber,
  players,
  games,
}: Props) {
  if (players.length === 0 || games.length === 0) return null;

  return (
    <div>
      <div className='w-full overflow-x-auto'>
        <table className='border-border bg-bg w-full border-collapse border text-left'>
          <thead>
            <tr className='border-border text-text-muted border-b font-mono text-xs tracking-widest uppercase'>
              <th className='px-4 py-3 font-normal'>SPILL</th>
              {players.map((p) => (
                <th
                  key={p.seasonPlayerId}
                  className={`px-3 py-3 text-center font-normal ${
                    p.isChampion ? 'text-accent' : ''
                  }`}
                >
                  {p.name}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {games.map((game) => (
              <tr
                key={game.ordinal}
                className='border-border border-b last:border-b-0'
              >
                <td className='text-text px-4 py-3 font-semibold'>
                  {game.label}
                </td>
                {game.cells.map((cell) =>
                  cell.powerUpUses.length > 0 ? (
                    <PopoverCell
                      key={cell.seasonPlayerId}
                      cell={cell}
                      popoverId={`pu-s${seasonNumber}-g${game.ordinal}-p${cell.seasonPlayerId}`}
                    />
                  ) : (
                    <PlainCell key={cell.seasonPlayerId} points={cell.points} />
                  ),
                )}
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className='border-border border-t-2'>
              <td className='text-text-muted px-4 py-3 font-mono text-xs tracking-widest uppercase'>
                Sum
              </td>
              {players.map((p) => (
                <td
                  key={p.seasonPlayerId}
                  className={`px-3 py-3 text-center font-mono text-sm font-bold tabular-nums ${
                    p.isChampion ? 'text-accent' : 'text-text'
                  }`}
                >
                  {p.totalPoints}
                </td>
              ))}
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}
