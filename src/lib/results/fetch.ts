import 'server-only';

import { createReadClient } from '../supabase/read';
import { seasonData } from '@/data/sesong';
import type { SeasonBundle } from './raw';

/**
 * IO boundary. The ONLY async code in the results module besides queries.ts.
 * Imports no derivation — fetch produces raw rows, nothing more.
 *
 * One pass per season: resolve the season by number, then fetch its child rows
 * in parallel. The dataset is tiny, so a whole-season bundle in one Promise.all
 * is simpler and cheaper than targeted per-view queries.
 *
 * `confirmed = true` is filtered HERE on game_result and season_result — the
 * eventual public-read gate. (RLS currently blocks anon reads entirely; this
 * filter means the switch to publishable-key public reads needs no query
 * change.) Unconfirmed results never reach the derivation layer.
 *
 * Returns null when the season does not exist, so callers can map it to a 404.
 * Throws on any actual query error, so callers can surface an error boundary.
 */
export async function fetchSeasonBundle(
  seasonNumber: number,
): Promise<SeasonBundle | null> {
  const supabase = createReadClient();

  const { data: season, error: seasonErr } = await supabase
    .from('season')
    .select('*')
    .eq('number', seasonNumber)
    .maybeSingle();

  if (seasonErr) throw seasonErr;
  if (!season) return null;

  const seasonId = season.id;

  const [
    roster,
    ladder,
    games,
    gameResults,
    powerUps,
    powerUpUses,
    seasonResults,
  ] = await Promise.all([
    supabase.from('season_player').select('*').eq('season_id', seasonId),
    supabase.from('season_ladder').select('*').eq('season_id', seasonId),
    supabase.from('game').select('*').eq('season_id', seasonId),
    // game_result has no season_id; filter by confirmed and join via game below.
    supabase
      .from('game_result')
      .select('*, game!inner(season_id)')
      .eq('game.season_id', seasonId)
      .eq('confirmed', true),
    supabase.from('power_up').select('*').eq('season_id', seasonId),
    supabase
      .from('power_up_use')
      .select('*, game!inner(season_id)')
      .eq('game.season_id', seasonId),
    supabase
      .from('season_result')
      .select('*')
      .eq('season_id', seasonId)
      .eq('confirmed', true),
  ]);

  for (const res of [
    roster,
    ladder,
    games,
    gameResults,
    powerUps,
    powerUpUses,
    seasonResults,
  ]) {
    if (res.error) throw res.error;
  }

  // Resolve the roster's player identities in one follow-up query.
  const playerIds = (roster.data ?? []).map((r) => r.player_id);
  const { data: players, error: playersErr } = await supabase
    .from('player')
    .select('*')
    .in('id', playerIds);
  if (playersErr) throw playersErr;

  // Strip the inner-join helper object so rows match the flat raw aliases.
  const stripJoin = <T extends { game?: unknown }>(rows: T[]) =>
    rows.map(({ game: _game, ...rest }) => rest);

  return {
    season,
    roster: roster.data ?? [],
    players: players ?? [],
    ladder: ladder.data ?? [],
    games: games.data ?? [],
    gameResults: stripJoin(
      gameResults.data ?? [],
    ) as SeasonBundle['gameResults'],
    powerUps: powerUps.data ?? [],
    powerUpUses: stripJoin(
      powerUpUses.data ?? [],
    ) as SeasonBundle['powerUpUses'],
    seasonResults: seasonResults.data ?? [],
  };
}

/**
 * Fan-out: every season's bundle, fetched in parallel. The cross-season read
 * boundary for the player career page (and later /records). Deliberately a thin
 * loop over fetchSeasonBundle rather than a bespoke cross-season query — the
 * dataset is a handful of seasons, pages are prerendered, and this reuses the
 * single confirmed-filtered IO path (no second place to keep the public-read
 * gate correct).
 *
 * Season numbers come from the static season catalog (seasonData keys), the one
 * source of truth for "how many seasons exist". A null bundle (season present
 * in static data but not yet in the DB) is dropped, so the result holds only
 * seasons with real rows.
 */
export async function fetchAllSeasonBundles(): Promise<SeasonBundle[]> {
  const seasonNumbers = Object.keys(seasonData).map(Number);
  const bundles = await Promise.all(seasonNumbers.map(fetchSeasonBundle));
  return bundles.filter((b): b is SeasonBundle => b !== null);
}
