import type {
  SeasonLadderRow,
  GameResultRow,
  PowerUpRow,
  PowerUpUseRow,
} from '../raw';
import type { PowerUpUseEntry } from '../view-models';

/*
 * PURE. Points for a (game, player) = season_ladder[placement]
 *   + SUM(power_up_use.points_delta WHERE affected_season_player_id = player).
 * Points are season-local; this module never sums across seasons.
 */

export function ladderByPlacement(
  ladder: SeasonLadderRow[],
): Map<number, number> {
  const map = new Map<number, number>();
  for (const row of ladder) {
    map.set(row.placement, row.points);
  }
  return map;
}

export function powerUpById(
  powerUps: PowerUpRow[],
): Map<string, { slug: string; isCurse: boolean }> {
  const map = new Map<string, { slug: string; isCurse: boolean }>();
  for (const pu of powerUps) {
    map.set(pu.id, { slug: pu.slug, isCurse: pu.is_curse });
  }
  return map;
}

/**
 * One entry per DB use row, incl. zero-delta uses, sorted deterministically so
 * React keys and snapshots are stable. Throws on a dangling power_up id rather
 * than silently dropping archive detail.
 */
function powerUpUsesByPlayer(
  powerUpUsesForGame: PowerUpUseRow[],
  powerUps: Map<string, { slug: string; isCurse: boolean }>,
): Map<string, PowerUpUseEntry[]> {
  const indexed = new Map<string, { entry: PowerUpUseEntry; i: number }[]>();

  powerUpUsesForGame.forEach((use, i) => {
    const anchor = powerUps.get(use.power_up_id);
    if (!anchor) {
      throw new Error(
        `No power_up row for power_up_id ${use.power_up_id}; cannot resolve a power-up use.`,
      );
    }
    const list = indexed.get(use.affected_season_player_id) ?? [];
    list.push({
      entry: {
        slug: anchor.slug,
        isCurse: anchor.isCurse,
        pointsDelta: use.points_delta,
      },
      i,
    });
    indexed.set(use.affected_season_player_id, list);
  });

  // Deterministic order: slug asc, then pointsDelta asc, then original DB order.
  const map = new Map<string, PowerUpUseEntry[]>();
  for (const [player, list] of indexed) {
    const sorted = list
      .sort(
        (a, b) =>
          a.entry.slug.localeCompare(b.entry.slug) ||
          a.entry.pointsDelta - b.entry.pointsDelta ||
          a.i - b.i,
      )
      .map((x) => x.entry);
    map.set(player, sorted);
  }

  return map;
}

export interface GamePoints {
  seasonPlayerId: string;
  placement: number;
  ladderPoints: number;
  powerUpDelta: number;
  powerUpUses: PowerUpUseEntry[];
  points: number;
}

/**
 * Throws if a placement has no ladder row — a silent null would corrupt
 * totals. `powerUpDelta` is summed from the use entries, so the per-use list
 * and the net cannot drift.
 */
export function gamePoints(
  gameResults: GameResultRow[],
  ladder: Map<number, number>,
  powerUpUsesForGame: PowerUpUseRow[],
  powerUps: Map<string, { slug: string; isCurse: boolean }>,
): GamePoints[] {
  const usesByPlayer = powerUpUsesByPlayer(powerUpUsesForGame, powerUps);

  return gameResults.map((gr) => {
    const ladderPoints = ladder.get(gr.placement);
    if (ladderPoints === undefined) {
      throw new Error(
        `No season_ladder row for placement ${gr.placement}; cannot derive points.`,
      );
    }
    const powerUpUses = usesByPlayer.get(gr.season_player_id) ?? [];
    const powerUpDelta = powerUpUses.reduce((sum, u) => sum + u.pointsDelta, 0);
    return {
      seasonPlayerId: gr.season_player_id,
      placement: gr.placement,
      ladderPoints,
      powerUpDelta,
      powerUpUses,
      points: ladderPoints + powerUpDelta,
    };
  });
}
