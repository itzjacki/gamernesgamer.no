import type { TitleId } from '@/data/titles';
import type { FormatTag, GenreTag } from '@/types/tag';

/**
 * What a rounds stage's raw scores are, since the DB can't tell:
 * - `value`: a measured number (gold, song score, kills);
 * - `placement`: the round's finish entered as 4..1 (4 = best);
 * - `points`: points combined from several things (OSRS, Wreckfest).
 */
export type RoundScoreKind = 'value' | 'placement' | 'points';

export interface Game {
  title: string;
  slug: string;
  titleId: TitleId;
  // May be empty: a game played in its genre's standard way (Trackmania) has
  // no format worth aggregating on.
  formatTags: FormatTag[];
  // Only when this instance isn't the title's usual genre (CS2 as a parkour
  // map). Replaces the title's genreTags for this instance.
  genreTags?: GenreTag[];
  thumbnailPath: string;
  chosenBy: string;
  duration: string;
  shortDescription: string;
  longDescription?: string;
  // Only for games with a rounds stage. Unset: a multi-round table shows plain
  // numbers and a one-round table is hidden.
  roundScore?: RoundScoreKind;
}
