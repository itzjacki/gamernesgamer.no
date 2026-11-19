import type { MatchRow, RoundsBundle, SeasonBundle, StageRow } from '../raw';
import type {
  BracketKind,
  BracketStageView,
  GameDetail,
  RoundRobinRow,
  RoundRobinStageView,
  SlotId,
  StageMatch,
  StageView,
} from '../view-models';
import { BRACKET_TEMPLATES } from '../bracket-templates';
import { buildGameSummaries } from './index';
import { decideMatch, groupRowsByMatch } from './matches';
import { resolvePlayers, requireRef } from './players';
import { roundsStage } from './rounds';

/*
 * PURE. One game's stages for the game page, in pipeline order. Stages carry
 * no `confirmed` flag, so they follow the game's confirmed results: none
 * until it has some.
 */

/** The game's rounds stages to fetch; none until it has confirmed results. */
export function gameRoundsStageIds(
  bundle: SeasonBundle,
  gameSlug: string,
): string[] {
  const game = bundle.games.find((g) => g.slug === gameSlug);
  if (!game || !bundle.gameResults.some((gr) => gr.game_id === game.id)) {
    return [];
  }
  return bundle.stages
    .filter((s) => s.game_id === game.id && s.kind === 'rounds')
    .map((s) => s.id);
}

export function assembleGameDetail(
  bundle: SeasonBundle,
  rounds: RoundsBundle,
  gameSlug: string,
): GameDetail {
  const game = bundle.games.find((g) => g.slug === gameSlug);
  const results =
    buildGameSummaries(bundle).find((g) => g.slug === gameSlug)?.results ?? [];
  if (!game || results.length === 0) return { results: [], stages: [] };

  const refs = resolvePlayers(bundle.roster, bundle.players);
  const placementBySp = new Map(
    results.map((r) => [r.player.seasonPlayerId, r.placement]),
  );
  const rowsByMatch = groupRowsByMatch(bundle.matchGames);

  const toStageMatch = (match: MatchRow): StageMatch | null => {
    const outcome = decideMatch(match, rowsByMatch.get(match.id) ?? []);
    if (!outcome) return null;
    const first = outcome.games[0];
    // Win-loss series store each game as 1–0, which says nothing the series
    // score doesn't; only real per-game scores (song scores) are kept.
    const realScores = outcome.games.some(
      (g) => Math.max(g.scoreA, g.scoreB) > 1,
    );
    return {
      playerA: requireRef(refs, match.player_a),
      playerB: requireRef(refs, match.player_b),
      leg: match.leg,
      bestOf: outcome.bestOf,
      winsA: outcome.winsA,
      winsB: outcome.winsB,
      winner: outcome.winner,
      score:
        outcome.bestOf === 1 && first
          ? { a: first.scoreA, b: first.scoreB, byTiebreak: first.byTiebreak }
          : null,
      games: outcome.bestOf > 1 && realScores ? outcome.games : null,
    };
  };

  const stageMatches = (stage: StageRow) =>
    bundle.matches
      .filter((m) => m.stage_id === stage.id)
      .map((m) => ({ row: m, match: toStageMatch(m) }));

  const stages: StageView[] = bundle.stages
    .filter((s) => s.game_id === game.id)
    .sort((a, b) => a.ordinal - b.ordinal)
    .map((stage) => {
      if (stage.kind === 'rounds') {
        return roundsStage(
          stage,
          rounds.rounds,
          rounds.roundResults,
          refs,
          placementBySp,
        );
      }
      if (stage.kind === 'round-robin') {
        return roundRobinStage(stage, stageMatches(stage), placementBySp);
      }
      return bracketStage(stage, stage.kind, stageMatches(stage));
    });

  return { results, stages };
}

type StageMatchRow = { row: MatchRow; match: StageMatch | null };

function roundRobinStage(
  stage: StageRow,
  stageMatches: StageMatchRow[],
  placementBySp: Map<string, number>,
): RoundRobinStageView {
  const pairName = (m: StageMatch) =>
    [m.playerA.name, m.playerB.name].sort().join(' ');
  const matches = stageMatches
    .flatMap(({ match }) => (match ? [match] : []))
    .sort(
      (x, y) => x.leg - y.leg || pairName(x).localeCompare(pairName(y), 'nb'),
    );

  const record = new Map<string, RoundRobinRow>();
  for (const m of matches) {
    for (const [player, won] of [
      [m.playerA, m.winner === 'a'],
      [m.playerB, m.winner === 'b'],
    ] as const) {
      const row = record.get(player.seasonPlayerId) ?? {
        player,
        wins: 0,
        losses: 0,
        rank: 0,
      };
      if (won) row.wins += 1;
      else row.losses += 1;
      record.set(player.seasonPlayerId, row);
    }
  }

  const placement = (r: RoundRobinRow) =>
    placementBySp.get(r.player.seasonPlayerId) ?? Infinity;
  const standings = [...record.values()].sort(
    (x, y) =>
      y.wins - x.wins || x.losses - y.losses || placement(x) - placement(y),
  );
  for (const row of standings) {
    row.rank =
      standings.findIndex(
        (o) => o.wins === row.wins && o.losses === row.losses,
      ) + 1;
  }

  return { kind: 'round-robin', ordinal: stage.ordinal, standings, matches };
}

/** Throws on a slot the kind's template doesn't have: a data bug. */
function bracketStage(
  stage: StageRow,
  kind: BracketKind,
  stageMatches: StageMatchRow[],
): BracketStageView {
  const template = BRACKET_TEMPLATES[kind];
  const known = new Set<string>(template.map((s) => s.id));

  const bySlot = new Map<SlotId, StageMatch | null>();
  for (const { row, match } of stageMatches) {
    if (!row.slot_id || !known.has(row.slot_id)) {
      throw new Error(
        `Match ${row.id} in a ${kind} stage has slot "${row.slot_id}", which is not in that kind's bracket template.`,
      );
    }
    if (bySlot.has(row.slot_id as SlotId)) {
      throw new Error(
        `Two matches in stage ${stage.id} share slot "${row.slot_id}".`,
      );
    }
    bySlot.set(row.slot_id as SlotId, match);
  }

  const decider: SlotId =
    kind === 'single-elim' || kind === 'final-bronze'
      ? 'F'
      : bySlot.get('GF2')
        ? 'GF2'
        : 'GF';

  return {
    kind,
    ordinal: stage.ordinal,
    slots: template.map((slot) => ({
      slotId: slot.id,
      match: bySlot.get(slot.id) ?? null,
    })),
    decider,
  };
}
