import type { SeasonBundle } from '../raw';
import type { GameMatch, PlayerRef } from '../view-models';
import { requireRef } from './players';

/**
 * PURE. Every DECIDED head-to-head match in a season, grouped by game id.
 *
 * A match's outcome is never stored — it is read from its `match_game` rows,
 * which come in two encodings:
 *
 * - One row per game played (S4 2XKO: 1–0, 0–1, 1–0). A row goes to the higher
 *   score, or to `tiebreak_winner` when the scores are level (the schema
 *   guarantees one is set), and the match to whoever won more rows.
 * - ONE row holding the series score itself (S2 League of Legends "2–1", S3
 *   War Thunder "3–0"). A series can't be settled in a single game, so a lone
 *   row in a bo3/bo5 whose higher score is exactly the wins needed is read as
 *   the series score, not as one game.
 *
 * A match is decided once a side has the wins the series needs (1, 2 or 3);
 * anything short of that (not finished, not played) is left out.
 */

const BEST_OF = { bo1: 1, bo3: 3, bo5: 5 } as const;

export function matchesByGame(
  bundle: SeasonBundle,
  refs: Map<string, PlayerRef>,
): Map<string, GameMatch[]> {
  const stageById = new Map(bundle.stages.map((s) => [s.id, s]));

  const rowsByMatch = new Map<string, typeof bundle.matchGames>();
  for (const row of bundle.matchGames) {
    rowsByMatch.set(row.match_id, [
      ...(rowsByMatch.get(row.match_id) ?? []),
      row,
    ]);
  }

  /** Games won by each side, from either encoding (see above). */
  const seriesWins = (matchId: string, needed: number) => {
    const rows = rowsByMatch.get(matchId) ?? [];
    const [only] = rows;
    if (
      needed > 1 &&
      rows.length === 1 &&
      Math.max(only.score_a, only.score_b) === needed &&
      Math.min(only.score_a, only.score_b) < needed
    ) {
      return { a: only.score_a, b: only.score_b };
    }

    const wins = { a: 0, b: 0 };
    for (const row of rows) {
      const winner =
        row.score_a === row.score_b
          ? row.tiebreak_winner
          : row.score_a > row.score_b
            ? 'a'
            : 'b';
      if (winner === 'a') wins.a += 1;
      if (winner === 'b') wins.b += 1;
    }
    return wins;
  };

  // Stage order, then leg: the order two meetings of one pair were played in.
  const ordered = [...bundle.matches].sort(
    (x, y) =>
      (stageById.get(x.stage_id)?.ordinal ?? 0) -
        (stageById.get(y.stage_id)?.ordinal ?? 0) || x.leg - y.leg,
  );

  const byGame = new Map<string, GameMatch[]>();
  for (const match of ordered) {
    const gameId = stageById.get(match.stage_id)?.game_id;
    const bestOf = BEST_OF[match.series_len];
    const needed = Math.ceil(bestOf / 2);
    const wins = seriesWins(match.id, needed);
    if (!gameId || Math.max(wins.a, wins.b) < needed || wins.a === wins.b) {
      continue;
    }

    const list = byGame.get(gameId) ?? [];
    list.push({
      playerA: requireRef(refs, match.player_a),
      playerB: requireRef(refs, match.player_b),
      bestOf,
      winsA: wins.a,
      winsB: wins.b,
      slotId: match.slot_id,
    });
    byGame.set(gameId, list);
  }
  return byGame;
}
