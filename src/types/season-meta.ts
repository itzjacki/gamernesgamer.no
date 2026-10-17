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

/**
 * A calendar date as `YYYY-MM-DD` (the day in Norway — no time, no zone).
 * ISO order, so plain string comparison orders dates correctly.
 */
export type IsoDate = `${number}-${number}-${number}`;

export interface SeasonMeta {
  /**
   * Set by hand, never derived from the dates: a season is `finished` once its
   * results are in, which the calendar can't know.
   */
  status: SeasonStatus;
  /** The tournament's first day. */
  start: IsoDate;
  /** Its last day; the same as `start` for a one-day season. */
  end: IsoDate;
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
