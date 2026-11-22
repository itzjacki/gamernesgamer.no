import type { MediaKind } from '@/lib/media/view-models';
import type { YoutubeStatus } from '@/lib/media/oembed';

export const KIND_LABELS: Record<MediaKind, string> = {
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

export const STATUS_LABELS: Record<YoutubeStatus, string> = {
  ok: 'OK',
  embed_disabled: 'Innbygging er slått av på YouTube',
  not_found: 'Finnes ikke lenger (privat eller slettet)',
  invalid: 'Ugyldig lenke',
  unreachable: 'Fikk ikke svar fra YouTube',
};
