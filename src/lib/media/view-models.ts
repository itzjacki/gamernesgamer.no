import type { Database } from '@/lib/supabase/database.types';

export type MediaKind = Database['public']['Enums']['media_kind'];

/** The order kinds are listed in wherever several are shown together. */
export const MEDIA_KIND_ORDER: MediaKind[] = [
  'aftermovie',
  'documentary',
  'welcome',
  'player_intro',
  'game_intro',
  'clip',
  'photo',
  'meme',
  'ad',
];

/** Headline pieces lead /content's default view. */
export const HEADLINE_KINDS: MediaKind[] = ['aftermovie', 'documentary'];

export type MediaSource =
  | { type: 'youtube'; youtubeId: string }
  | { type: 'image'; src: string; width: number; height: number };

export interface MediaItemView {
  id: string;
  kind: MediaKind;
  title: string;
  /** Images only: falls back to the title when no alt was written. */
  alt: string;
  source: MediaSource;
  vertical: boolean;
  season: number | null;
  gameSlug: string | null;
  /** Resolved against the static season data; null without a game. */
  gameTitle: string | null;
  /** Cross-season roster slugs. */
  playerSlugs: string[];
  createdAt: string;
}

/** The anchor every item has on /content. */
export function mediaAnchor(id: string): string {
  return `m-${id}`;
}
