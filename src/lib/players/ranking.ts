import type { CareerBoardRow } from '@/lib/results/view-models';

/**
 * The player index's ranking (also the career page's catalogue line): board rows ordered by average season placement, best
 * first. The board arrives in its own order (placement-points, then titles,
 * then average game placement) and the sort is stable, so equal averages keep
 * the /records order — the two pages never disagree. Rows equal on the average
 * and on the board share a rank.
 */
export function rankByAveragePlacement(board: CareerBoardRow[]) {
  const rows = board
    .map((row) => {
      const played = row.placements.filter((p): p is number => p !== null);
      return {
        row,
        seasons: played.length,
        average: played.reduce((sum, p) => sum + p, 0) / played.length,
      };
    })
    .filter(({ seasons }) => seasons > 0)
    .sort((a, b) => a.average - b.average);

  const ranks: number[] = [];
  rows.forEach((current, index) => {
    const previous = rows[index - 1];
    const tied =
      previous !== undefined &&
      previous.average === current.average &&
      previous.row.rank === current.row.rank;
    ranks.push(tied ? ranks[index - 1] : index + 1);
  });

  // The latest season anyone has won — its winner is the reigning champion.
  // (`placements` is aligned across rows, one slot per season, ascending.)
  const latestDecided = Math.max(
    ...board.map((row) => row.placements.lastIndexOf(1)),
  );

  return rows.map(({ row, average }, index) => ({
    slug: row.player.slug,
    career: {
      rank: ranks[index],
      championships: row.championships,
      averagePlacement: average,
      reigningChampion:
        latestDecided >= 0 && row.placements[latestDecided] === 1,
    },
  }));
}
