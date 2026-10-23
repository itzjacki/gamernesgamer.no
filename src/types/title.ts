import type { GenreTag } from '@/types/tag';

// A game's identity across seasons (CS:GO and CS2 are one title).
export interface Title {
  name: string;
  genreTags: readonly GenreTag[];
}
