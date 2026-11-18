import type { StageMatch } from '@/lib/results/view-models';
import type { RecordLine } from '@/components/RecordLines';
import { formatScore } from './format';

/** The figure each side shows: a bo1's own score, else the series wins. */
export function sideFigures(match: StageMatch): { a: string; b: string } {
  if (match.score) {
    return { a: formatScore(match.score.a), b: formatScore(match.score.b) };
  }
  return { a: String(match.winsA), b: String(match.winsB) };
}

export function settledByTiebreak(match: StageMatch): boolean {
  return match.score?.byTiebreak ?? false;
}

/** One line per game of a series with real per-game scores. */
export function gameLines(match: StageMatch, gameLabel: string): RecordLine[] {
  return (match.games ?? []).map((g) => ({
    key: String(g.gameNumber),
    label: `${gameLabel} ${g.gameNumber}`,
    value: `${formatScore(g.scoreA)}–${formatScore(g.scoreB)}`,
  }));
}
