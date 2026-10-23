/** Drives the season page's layout. Reveal flags apply only to `upcoming`. */
export type SeasonStatus = 'upcoming' | 'live' | 'finished';

/** The day in Norway, no time or zone. String comparison orders correctly. */
export type IsoDate = `${number}-${number}-${number}`;

export interface SeasonMeta {
  /**
   * Set by hand, never derived from the dates: a season is `finished` once its
   * results are in, which the calendar can't know.
   */
  status: SeasonStatus;
  start: IsoDate;
  /** Same as `start` for a one-day season. */
  end: IsoDate;
  videoEmbedUrl?: string;
  /** Only read while `upcoming`; `live` and `finished` show everything. */
  revealGamerCards: boolean;
  revealGames: boolean;
  revealPowerups: boolean;
}
