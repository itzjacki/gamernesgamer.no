import type { MatchRow, RoundsBundle, SeasonBundle, StageRow } from '../raw';
import type {
  BracketKind,
  BracketStageView,
  GameDetail,
  PlayerRef,
  RoundRobinRow,
  RoundRobinStageView,
  StageMatch,
  StageView,
} from '../view-models';
import { BRACKET_TEMPLATES, type SlotId } from '../bracket-templates';
import { assembleSeasonView } from './index';
import { decideMatch, groupRowsByMatch } from './matches';
import { resolvePlayers, requireRef } from './players';
import { roundsStage } from './rounds';

/*
 * PURE. One game's stages for the game page, in pipeline order. Stages carry
 * no `confirmed` flag, so they follow the game's confirmed results: none
 * until it has some.
 */

/** The rounds stages of the games that have confirmed results. */
export function confirmedRoundsStageIds(bundle: SeasonBundle): string[] {
  const confirmed = new Set(bundle.gameResults.map((gr) => gr.game_id));
  return bundle.stages
    .filter((s) => s.kind === 'rounds' && confirmed.has(s.game_id))
    .map((s) => s.id);
}

export function assembleGameDetail(
  bundle: SeasonBundle,
  rounds: RoundsBundle,
  gameSlug: string,
): GameDetail {
  const game = bundle.games.find((g) => g.slug === gameSlug);
  if (!game) return { summary: null, stages: [] };

  const summary =
    assembleSeasonView(bundle).games.find((g) => g.slug === gameSlug) ?? null;
  if (!summary || summary.results.length === 0) {
    return { summary, stages: [] };
  }

  const refs = resolvePlayers(bundle.roster, bundle.players);
  const placementBySp = new Map(
    summary.results.map((r) => [r.player.seasonPlayerId, r.placement]),
  );
  const rowsByMatch = groupRowsByMatch(bundle.matchGames);

  const toStageMatch = (match: MatchRow): StageMatch | null => {
    const rows = rowsByMatch.get(match.id) ?? [];
    const outcome = decideMatch(match, rows);
    if (!outcome) return null;
    const [only] = outcome.games;
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
        outcome.bestOf === 1 && only
          ? { a: only.scoreA, b: only.scoreB, byTiebreak: only.byTiebreak }
          : null,
      games: outcome.bestOf > 1 && realScores ? outcome.games : null,
    };
  };

  const stageMatches = (stage: StageRow) =>
    bundle.matches.filter((m) => m.stage_id === stage.id);

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
        return roundRobinStage(
          stage,
          stageMatches(stage),
          toStageMatch,
          placementBySp,
        );
      }
      return bracketStage(stage, stage.kind, stageMatches(stage), toStageMatch);
    });

  return { summary, stages };
}

function roundRobinStage(
  stage: StageRow,
  matchRows: MatchRow[],
  toStageMatch: (m: MatchRow) => StageMatch | null,
  placementBySp: Map<string, number>,
): RoundRobinStageView {
  const pairName = (m: StageMatch) =>
    [m.playerA.name, m.playerB.name].sort().join(' ');
  const matches = matchRows
    .map(toStageMatch)
    .filter((m): m is StageMatch => m !== null)
    .sort(
      (x, y) => x.leg - y.leg || pairName(x).localeCompare(pairName(y), 'nb'),
    );

  const record = new Map<string, { player: PlayerRef; w: number; l: number }>();
  const entry = (p: PlayerRef) => {
    const existing = record.get(p.seasonPlayerId);
    if (existing) return existing;
    const fresh = { player: p, w: 0, l: 0 };
    record.set(p.seasonPlayerId, fresh);
    return fresh;
  };
  for (const m of matches) {
    const a = entry(m.playerA);
    const b = entry(m.playerB);
    if (m.winner === 'a') {
      a.w += 1;
      b.l += 1;
    } else {
      b.w += 1;
      a.l += 1;
    }
  }

  const sorted = [...record.values()].sort(
    (x, y) =>
      y.w - x.w ||
      x.l - y.l ||
      (placementBySp.get(x.player.seasonPlayerId) ?? Infinity) -
        (placementBySp.get(y.player.seasonPlayerId) ?? Infinity),
  );
  const standings: RoundRobinRow[] = sorted.map((r) => ({
    player: r.player,
    wins: r.w,
    losses: r.l,
    rank: sorted.findIndex((o) => o.w === r.w && o.l === r.l) + 1,
  }));

  return { kind: 'round-robin', ordinal: stage.ordinal, standings, matches };
}

/** Throws on a slot the kind's template doesn't have: a data bug. */
function bracketStage(
  stage: StageRow,
  kind: BracketKind,
  matchRows: MatchRow[],
  toStageMatch: (m: MatchRow) => StageMatch | null,
): BracketStageView {
  const template = BRACKET_TEMPLATES[kind];
  const known = new Set<string>(template.slots.map((s) => s.id));

  const bySlot = new Map<SlotId, StageMatch | null>();
  for (const row of matchRows) {
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
    bySlot.set(row.slot_id as SlotId, toStageMatch(row));
  }

  return {
    kind,
    ordinal: stage.ordinal,
    slots: template.slots.map((slot) => ({
      slotId: slot.id,
      match: bySlot.get(slot.id) ?? null,
    })),
  };
}
