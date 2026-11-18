import type { MatchGameRow, MatchRow, SeasonBundle } from '../raw';
import type { GameMatch, MatchGameScore, PlayerRef } from '../view-models';
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

export interface MatchOutcome {
  bestOf: 1 | 3 | 5;
  winsA: number;
  winsB: number;
  winner: 'a' | 'b';
  /** One row per game played, by game number; empty for a series-score row. */
  games: MatchGameScore[];
}

/**
 * The outcome of one match from its game rows, or null while undecided (not
 * finished, not played). The one place a match outcome is decided.
 */
export function decideMatch(
  match: MatchRow,
  rows: MatchGameRow[],
): MatchOutcome | null {
  const bestOf = BEST_OF[match.series_len];
  const needed = Math.ceil(bestOf / 2);
  const [only] = rows;

  const isSeriesRow =
    needed > 1 &&
    rows.length === 1 &&
    Math.max(only.score_a, only.score_b) === needed &&
    Math.min(only.score_a, only.score_b) < needed;

  const games: MatchGameScore[] = isSeriesRow
    ? []
    : [...rows]
        .sort((x, y) => x.game_number - y.game_number)
        .flatMap((row) => {
          const level = row.score_a === row.score_b;
          const winner = level
            ? row.tiebreak_winner
            : row.score_a > row.score_b
              ? 'a'
              : 'b';
          if (!winner) return [];
          return [
            {
              gameNumber: row.game_number,
              scoreA: row.score_a,
              scoreB: row.score_b,
              winner,
              byTiebreak: level,
            },
          ];
        });

  const wins = isSeriesRow
    ? { a: only.score_a, b: only.score_b }
    : {
        a: games.filter((g) => g.winner === 'a').length,
        b: games.filter((g) => g.winner === 'b').length,
      };

  if (Math.max(wins.a, wins.b) < needed || wins.a === wins.b) return null;

  return {
    bestOf,
    winsA: wins.a,
    winsB: wins.b,
    winner: wins.a > wins.b ? 'a' : 'b',
    games,
  };
}

export function groupRowsByMatch(
  matchGames: MatchGameRow[],
): Map<string, MatchGameRow[]> {
  const rowsByMatch = new Map<string, MatchGameRow[]>();
  for (const row of matchGames) {
    const rows = rowsByMatch.get(row.match_id);
    if (rows) rows.push(row);
    else rowsByMatch.set(row.match_id, [row]);
  }
  return rowsByMatch;
}

export function matchesByGame(
  bundle: SeasonBundle,
  refs: Map<string, PlayerRef>,
): Map<string, GameMatch[]> {
  const stageById = new Map(bundle.stages.map((s) => [s.id, s]));
  const rowsByMatch = groupRowsByMatch(bundle.matchGames);

  // Stage order, then leg: the order two meetings of one pair were played in.
  const ordered = [...bundle.matches].sort(
    (x, y) =>
      (stageById.get(x.stage_id)?.ordinal ?? 0) -
        (stageById.get(y.stage_id)?.ordinal ?? 0) || x.leg - y.leg,
  );

  const byGame = new Map<string, GameMatch[]>();
  for (const match of ordered) {
    const gameId = stageById.get(match.stage_id)?.game_id;
    const rows = rowsByMatch.get(match.id) ?? [];
    const outcome = decideMatch(match, rows);
    if (!gameId || !outcome) continue;

    const [only] = rows;
    const score =
      outcome.bestOf === 1 && rows.length === 1 && only.score_a !== only.score_b
        ? { a: only.score_a, b: only.score_b }
        : null;

    const list = byGame.get(gameId) ?? [];
    list.push({
      playerA: requireRef(refs, match.player_a),
      playerB: requireRef(refs, match.player_b),
      bestOf: outcome.bestOf,
      winsA: outcome.winsA,
      winsB: outcome.winsB,
      score,
      slotId: match.slot_id,
    });
    byGame.set(gameId, list);
  }
  return byGame;
}
