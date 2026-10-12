import type {
  CareerBoardRow,
  RecordSeason,
  RecordsPlayerInput,
} from '../../view-models';

/**
 * Season placement-points: 1st = 4 … 4th = 1 (the decided cross-season scale —
 * placement is the one axis every season shares, raw points are not
 * comparable). Participation always scores, so anything below 4th still
 * earns 1.
 */
export const placementPoints = (placement: number) =>
  Math.max(1, 5 - placement);

/**
 * PURE. The all-time career board: one row per player, ordered by the sum of
 * season placement-points. Ties on the sum fall through to more championships,
 * then the better average game placement; rows equal on all three share a rank.
 */
export function deriveCareerBoard(
  players: RecordsPlayerInput[],
  seasons: RecordSeason[],
): CareerBoardRow[] {
  const rows = players.map(({ player, seasons: played, games }) => ({
    player,
    placementPoints: played.reduce(
      (sum, s) => sum + placementPoints(s.placement),
      0,
    ),
    placements: seasons.map(
      (season) =>
        played.find((s) => s.seasonNumber === season.seasonNumber)?.placement ??
        null,
    ),
    championships: played.filter((s) => s.isChampion).length,
    gameWins: games.filter((g) => g.placement === 1).length,
    averageGamePlacement:
      games.length > 0
        ? games.reduce((sum, g) => sum + g.placement, 0) / games.length
        : 0,
  }));

  type Row = (typeof rows)[number];
  const compare = (a: Row, b: Row) =>
    b.placementPoints - a.placementPoints ||
    b.championships - a.championships ||
    a.averageGamePlacement - b.averageGamePlacement;

  const sorted = [...rows].sort(
    (a, b) => compare(a, b) || a.player.name.localeCompare(b.player.name),
  );

  const board: CareerBoardRow[] = [];
  sorted.forEach((row, index) => {
    const previous = board[index - 1];
    const tied =
      previous !== undefined && compare(sorted[index - 1], row) === 0;
    board.push({ ...row, rank: tied ? previous.rank : index + 1 });
  });
  return board;
}
