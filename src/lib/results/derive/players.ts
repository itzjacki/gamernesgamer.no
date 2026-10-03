import type { SeasonPlayerRow, PlayerRow } from '../raw';
import type { PlayerRef } from '../view-models';

/**
 * PURE. Builds the season_player.id → PlayerRef resolver once, so nothing
 * downstream (or in components) ever touches the season_player indirection.
 *
 * Joining is player → season_player: roster rows carry player_id, which maps to
 * a player row for name/slug. All result tables key off season_player.id, so
 * this Map is the single resolution point.
 */
export function resolvePlayers(
  roster: SeasonPlayerRow[],
  players: PlayerRow[],
): Map<string, PlayerRef> {
  const playerById = new Map<string, PlayerRow>();
  for (const p of players) {
    playerById.set(p.id, p);
  }

  const refBySeasonPlayerId = new Map<string, PlayerRef>();
  for (const sp of roster) {
    const player = playerById.get(sp.player_id);
    if (!player) {
      throw new Error(
        `Roster row ${sp.id} references player ${sp.player_id} not present in the fetched player rows.`,
      );
    }
    refBySeasonPlayerId.set(sp.id, {
      seasonPlayerId: sp.id,
      slug: player.slug,
      name: player.name,
    });
  }
  return refBySeasonPlayerId;
}

/** Resolve one season_player.id or throw (used where absence is a real bug). */
export function requireRef(
  refs: Map<string, PlayerRef>,
  seasonPlayerId: string,
): PlayerRef {
  const ref = refs.get(seasonPlayerId);
  if (!ref) {
    throw new Error(
      `season_player.id ${seasonPlayerId} is not in this season's roster.`,
    );
  }
  return ref;
}
