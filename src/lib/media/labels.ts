import type { MediaKind } from './view-models';

export const KIND_HEADINGS: Record<MediaKind, string> = {
  aftermovie: 'Aftermovie',
  documentary: 'Dokumentar',
  welcome: 'Velkomstvideo',
  player_intro: 'Spillerintro',
  game_intro: 'Spillintro',
  clip: 'Klipp',
  photo: 'Bilde',
  meme: 'Meme',
  ad: 'Reklame',
};

export const MEDIA_LABELS = {
  /** The media section's heading on season, game, career and /vs pages. */
  section: 'Content',
  /** /content's page title. */
  pageTitle: 'Content',
  /** /content: the band for headline pieces. */
  headline: 'Fremhevet',
  /** /content: the band for items tied to no season. */
  unseasoned: 'Sesonguavhengig',
  /** The footer code for an item tied to no season. */
  noSeasonCode: 'GG',
  filterKind: 'Kategori',
  filterSeason: 'Sesong',
  filterPlayer: 'Spiller',
  filterAll: 'Alle',
  noMatches: 'Ingen treff',
  /** Dagens content with no items at all. */
  empty: 'Kommer snart',
};
