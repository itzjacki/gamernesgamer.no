/**
 * The lifecycle phase of a season, driving the season page's layout + content.
 *
 * - `upcoming` — the hype-building poster. Roster/games/power-ups are shown
 *   per the fine-grained reveal flags below (drip reveal); no results yet.
 * - `live` — the tournament is running; results come in and the page polls.
 *   Everything is revealed; reveal flags are ignored. (Rendering for `live` is
 *   not built yet — Phase 5.)
 * - `finished` — permanent archive. Standings-first; nothing is hidden; the
 *   reveal flags are ignored.
 */
export type SeasonStatus = 'upcoming' | 'live' | 'finished';

export interface SeasonMeta {
  status: SeasonStatus;
  date: string;
  videoEmbedUrl?: string;
  /**
   * Fine-grained reveal flags — only meaningful while `status === 'upcoming'`,
   * so each section can be prepared and unveiled independently. Ignored for
   * `live` and `finished` (everything is shown).
   */
  revealGamerCards: boolean;
  revealGames: boolean;
  revealPowerups: boolean;
}
