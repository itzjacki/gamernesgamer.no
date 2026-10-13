import type { Metadata } from 'next';
import { allPlayers } from '@/lib/players/roster';
import { findHeroImage, getRecordsView } from '@/lib/results/queries';
import type { CareerBoardRow } from '@/lib/results/view-models';
import Heading from '@/components/Heading';
import PlayerRoster from '@/components/PlayerRoster';
import type { RosterEntry } from '@/components/PlayerRoster';

export const metadata: Metadata = {
  title: 'Spillere',
};

/**
 * The sheet's ranking: board rows ordered by average season placement, best
 * first. The board arrives in its own order (placement-points, then titles,
 * then average game placement) and the sort is stable, so equal averages keep
 * the /records order — the two pages never disagree. Rows equal on the average
 * and on the board share a rank.
 */
function rankByAveragePlacement(board: CareerBoardRow[]) {
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

export default async function PlayersIndexPage() {
  const players = allPlayers();
  const { board } = await getRecordsView();

  const ranking = rankByAveragePlacement(board);
  const careerBySlug = new Map(ranking.map((r) => [r.slug, r.career]));
  const order = new Map(ranking.map((r, index) => [r.slug, index]));

  // Ranked players in ranking order; anyone without a finished season keeps
  // the roster's own order (allPlayers) underneath them.
  const entries: RosterEntry[] = players
    .map((p) => ({
      slug: p.slug,
      name: p.name,
      nickname: p.latest.nickname,
      imagePath: findHeroImage(p.slug) ?? p.latest.imagePath,
      career: careerBySlug.get(p.slug),
    }))
    .sort(
      (a, b) =>
        (order.get(a.slug) ?? ranking.length) -
        (order.get(b.slug) ?? ranking.length),
    );

  return (
    <>
      <section className='flex flex-col gap-4 pt-8'>
        <Heading as='h1' aboveLine='GG - Alle sesonger' belowLine='Spillere'>
          Spillere
        </Heading>
      </section>

      <section id='roster' className='flex flex-col gap-8'>
        <PlayerRoster entries={entries} />
      </section>
    </>
  );
}
