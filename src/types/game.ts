import type { TitleId } from '@/data/titles';
import type { FormatTag, GenreTag } from '@/types/tag';

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
  videoEmbedUrl?: string;
}
