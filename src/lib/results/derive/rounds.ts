import type { RoundResultRow, RoundRow, StageRow } from '../raw';
import type { PlayerRef, RoundCell, RoundsStageView } from '../view-models';
import { requireRef } from './players';

/**
 * PURE. Rank points for one round, aligned with `scores`: N − the number of
 * players strictly better, so a tie shares the higher points (4, 3, 3, 1). The
 * seeded Ratz Instagib totals depend on exactly this rule.
 */
export function rankPoints(scores: number[]): number[] {
  return scores.map(
    (score) => scores.length - scores.filter((other) => other > score).length,
  );
}

export function roundsStage(
  stage: StageRow,
  rounds: RoundRow[],
  roundResults: RoundResultRow[],
  refs: Map<string, PlayerRef>,
  /** Final game placement by season_player.id: the order of level totals. */
  placementBySp: Map<string, number>,
): RoundsStageView {
  const aggregation = stage.aggregation ?? 'sum';
  const stageRounds = rounds
    .filter((r) => r.stage_id === stage.id)
    .sort((a, b) => a.ordinal - b.ordinal);
  const roundIds = new Set(stageRounds.map((r) => r.id));
  const results = roundResults.filter((rr) => roundIds.has(rr.round_id));

  const spIds = [...new Set(results.map((rr) => rr.season_player_id))];

  const cellsByRound = stageRounds.map((round) => {
    const inRound = results.filter((rr) => rr.round_id === round.id);
    const points = rankPoints(inRound.map((rr) => rr.raw_score));
    const bySp = new Map<string, RoundCell>(
      inRound.map((rr, i) => [
        rr.season_player_id,
        {
          raw: rr.raw_score,
          rankPoints: aggregation === 'rank-then-sum' ? points[i] : null,
        },
      ]),
    );
    return { round, bySp };
  });

  const totalBySp = new Map(
    spIds.map((sp) => [
      sp,
      cellsByRound.reduce((sum, { bySp }) => {
        const cell = bySp.get(sp);
        if (!cell) return sum;
        return sum + (cell.rankPoints ?? cell.raw ?? 0);
      }, 0),
    ]),
  );

  const ordered = [...spIds].sort(
    (a, b) =>
      totalBySp.get(b)! - totalBySp.get(a)! ||
      (placementBySp.get(a) ?? Infinity) - (placementBySp.get(b) ?? Infinity),
  );

  return {
    kind: 'rounds',
    ordinal: stage.ordinal,
    aggregation,
    players: ordered.map((sp) => requireRef(refs, sp)),
    rounds: cellsByRound.map(({ round, bySp }) => ({
      ordinal: round.ordinal,
      label: round.label,
      cells: ordered.map(
        (sp) => bySp.get(sp) ?? { raw: null, rankPoints: null },
      ),
    })),
    totals: ordered.map((sp) => totalBySp.get(sp)!),
  };
}
