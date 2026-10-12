import type { GenreTag } from '@/types/tag';

// The stable identity of a game across seasons (CS:GO and CS2 are one title).
// A season's `Game` is an instance of a title and points here via `titleId`.
export interface Title {
  name: string;
  genreTags: readonly GenreTag[];
}
