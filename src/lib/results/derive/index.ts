import type { SeasonBundle } from '../raw';
import type {
  SeasonView,
  GameView,
  SeasonStandingRow,
  GameSummary,
  GamePlacementRow,
} from '../view-models';
import { ladderByPlacement, gamePoints } from './points';
import { resolvePlayers, requireRef } from './players';

/**
 * PURE. Assembles view-models from a raw SeasonBundle. No IO, no async — this
 * is the function the unit tests exercise against S1 fixtures.
 *
 * First slice: season standings + per-game points matrix. The season placement
 * comes from season_result (authoritative — tiebreakers can override point
 * order); points are derived and display-only.
 */

function seasonSlug(seasonNumber: number): string {
  return String(seasonNumber).padStart(2, '0');
}

/** Per-game placement rows (ordered by placement), computed once and reused. */
function buildGameSummaries(bundle: SeasonBundle): GameSummary[] {
  const refs = resolvePlayers(bundle.roster, bundle.players);
  const ladder = ladderByPlacement(bundle.ladder);

  const resultsByGame = new Map<string, typeof bundle.gameResults>();
  for (const gr of bundle.gameResults) {
    const list = resultsByGame.get(gr.game_id) ?? [];
    list.push(gr);
    resultsByGame.set(gr.game_id, list);
  }

  const usesByGame = new Map<string, typeof bundle.powerUpUses>();
  for (const u of bundle.powerUpUses) {
    const list = usesByGame.get(u.game_id) ?? [];
    list.push(u);
    usesByGame.set(u.game_id, list);
  }

  return [...bundle.games]
    .sort((a, b) => a.ordinal - b.ordinal)
    .map((game) => {
      const grs = resultsByGame.get(game.id) ?? [];
      const points = gamePoints(grs, ladder, usesByGame.get(game.id) ?? []);
      const pointsBySp = new Map(points.map((p) => [p.seasonPlayerId, p]));

      const results: GamePlacementRow[] = grs
        .map((gr) => {
          const p = pointsBySp.get(gr.season_player_id)!;
          return {
            player: requireRef(refs, gr.season_player_id),
            placement: gr.placement,
            ladderPoints: p.ladderPoints,
            powerUpDelta: p.powerUpDelta,
            points: p.points,
            note: gr.note,
          };
        })
        .sort((a, b) => a.placement - b.placement);

      return { slug: game.slug, ordinal: game.ordinal, results };
    });
}

export function assembleSeasonView(bundle: SeasonBundle): SeasonView {
  const refs = resolvePlayers(bundle.roster, bundle.players);
  const games = buildGameSummaries(bundle);

  // Total season points per player = sum of per-game derived points.
  const totalBySp = new Map<string, number>();
  for (const game of games) {
    for (const row of game.results) {
      const prev = totalBySp.get(row.player.seasonPlayerId) ?? 0;
      totalBySp.set(row.player.seasonPlayerId, prev + row.points);
    }
  }

  // Standings ordered by the AUTHORITATIVE season_result.placement, not points.
  const standings: SeasonStandingRow[] = [...bundle.seasonResults]
    .sort((a, b) => a.placement - b.placement)
    .map((sr) => ({
      player: requireRef(refs, sr.season_player_id),
      placement: sr.placement,
      totalPoints: totalBySp.get(sr.season_player_id) ?? 0,
      isChampion: sr.placement === 1,
      note: sr.note,
    }));

  return {
    seasonNumber: bundle.season.number,
    seasonSlug: seasonSlug(bundle.season.number),
    players: [...refs.values()],
    standings,
    games,
  };
}

export function assembleGameView(
  bundle: SeasonBundle,
  gameSlug: string,
): GameView | null {
  const game = bundle.games.find((g) => g.slug === gameSlug);
  if (!game) return null;

  const summary = buildGameSummaries(bundle).find((g) => g.slug === gameSlug);
  if (!summary) return null;

  return {
    seasonNumber: bundle.season.number,
    seasonSlug: seasonSlug(bundle.season.number),
    slug: game.slug,
    ordinal: game.ordinal,
    results: summary.results,
  };
}
