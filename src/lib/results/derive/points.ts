import type {
  SeasonLadderRow,
  GameResultRow,
  PowerUpRow,
  PowerUpUseRow,
} from '../raw';
import type { PowerUpUseEntry } from '../view-models';

/**
 * PURE. No IO, no Supabase, no async. Season-points derivation.
 *
 * Points for a (game, player) = season_ladder[placement]
 *   + SUM(power_up_use.points_delta WHERE affected_season_player_id = player).
 * The ladder is season-wide. Points are season-local by construction — this
 * module never sums across seasons (cross-season normalization is a separate,
 * deferred concern).
 */

/** Map placement → ladder points for one season. */
export function ladderByPlacement(
  ladder: SeasonLadderRow[],
): Map<number, number> {
  const map = new Map<number, number>();
  for (const row of ladder) {
    map.set(row.placement, row.points);
  }
  return map;
}

/** Map power_up.id → its slug + is_curse, for resolving uses to entries. */
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
 * Per-affected-player list of power-up use ENTRIES, for a single game. Each DB
 * use row becomes one entry (incl. zero-delta uses). Entries are sorted
 * deterministically — slug asc, then pointsDelta asc, then original order — so
 * React keys and snapshot tests are stable. The net delta is derived from this
 * same list by the caller, so list and net can never drift.
 *
 * Throws if a use references a power_up id with no anchor row (a dangling FK
 * would silently drop archive detail — fail loud, matching gamePoints).
 */
export function powerUpUsesByPlayer(
  powerUpUsesForGame: PowerUpUseRow[],
  powerUps: Map<string, { slug: string; isCurse: boolean }>,
): Map<string, PowerUpUseEntry[]> {
  // Keep each entry's original DB order alongside it for a stable final sort.
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
 * Compute each player's points for one game from its game_result rows + the
 * ladder + that game's power-up uses (resolved against the season's power_up
 * anchors). Throws if a placement has no ladder row (a silent null here would
 * corrupt totals — fail loud instead).
 *
 * The net `powerUpDelta` is the SUM of the player's resolved use entries — the
 * single source of the summation, so the per-use list and the net cannot drift.
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
