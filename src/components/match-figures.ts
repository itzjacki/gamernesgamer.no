import type { StageMatch } from '@/lib/results/view-models';
import { formatScore } from '@/lib/format';
import type { RecordLine } from './RecordLines';

/** The figure each side shows: a bo1's own score, else the series wins. */
export function sideFigures(match: StageMatch): { a: string; b: string } {
  if (match.score) {
    return { a: formatScore(match.score.a), b: formatScore(match.score.b) };
  }
  return { a: String(match.winsA), b: String(match.winsB) };
}

/** One line per game of a series with real per-game scores. */
export function gameLines(match: StageMatch, gameLabel: string): RecordLine[] {
  return (match.games ?? []).map((g) => ({
    key: String(g.gameNumber),
    label: `${gameLabel} ${g.gameNumber}`,
    value: `${formatScore(g.scoreA)}–${formatScore(g.scoreB)}`,
  }));
}
