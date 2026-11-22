'use server';

import { createAuthClient } from '@/lib/supabase/server';
import { revalidateSite } from '@/lib/revalidate';
import { parseYoutubeId } from '@/lib/media/youtube';
import { youtubeStatus, type YoutubeStatus } from '@/lib/media/oembed';
import { imageManifest } from '@/lib/media/image-manifest';
import { MEDIA_KIND_ORDER, type MediaKind } from '@/lib/media/view-models';
import { seasonData, type Season } from '@/data/sesong';
import { allPlayers } from '@/lib/players/roster';

/*
 * Server actions are public POST endpoints: the (protected) layout's gate
 * doesn't cover them. Every action here checks is_admin() itself before doing
 * anything. Saves are also RLS-gated; the YouTube lookup has no RLS behind it,
 * so the check is what keeps it from being an open proxy.
 */

export interface MediaActionResult {
  error: string | null;
}

export interface MediaInput {
  id: string | null;
  kind: MediaKind;
  source: 'youtube' | 'image';
  youtube: string;
  imageFile: string;
  vertical: boolean;
  title: string;
  alt: string;
  season: number | null;
  gameSlug: string | null;
  playerSlugs: string[];
}

async function adminClient() {
  const supabase = await createAuthClient();
  const { data: isAdmin } = await supabase.rpc('is_admin');
  return isAdmin ? supabase : null;
}

function validate(input: MediaInput): string | null {
  if (!MEDIA_KIND_ORDER.includes(input.kind)) return 'Ukjent type.';

  if (input.source === 'youtube') {
    if (!parseYoutubeId(input.youtube)) return 'Ugyldig YouTube-lenke.';
  } else if (!imageManifest[input.imageFile]) {
    return 'Bildet finnes ikke i public/images/media/.';
  }

  if (!input.title.trim()) return 'Tittel mangler.';
  if (
    (input.kind === 'photo' || input.kind === 'meme') &&
    (input.source !== 'image' || !input.alt.trim())
  ) {
    return 'Bilder og memes trenger et bilde og en alt-tekst.';
  }

  if (input.season !== null) {
    const slug = String(input.season).padStart(2, '0');
    if (!(slug in seasonData)) return 'Ukjent sesong.';
    const games = seasonData[slug as Season].games;
    if (input.gameSlug && !games.some((g) => g.slug === input.gameSlug)) {
      return 'Spillet finnes ikke i den sesongen.';
    }
  } else if (input.gameSlug) {
    return 'Et spill krever en sesong.';
  }

  const needsSeason: MediaKind[] = [
    'player_intro',
    'welcome',
    'aftermovie',
    'game_intro',
  ];
  if (needsSeason.includes(input.kind) && input.season === null) {
    return 'Denne typen må knyttes til en sesong.';
  }
  if (input.kind === 'game_intro' && !input.gameSlug) {
    return 'En spillintro må knyttes til et spill.';
  }
  if (input.kind === 'player_intro' && input.playerSlugs.length !== 1) {
    return 'En spillerintro knyttes til nøyaktig én spiller.';
  }

  const known = new Set(allPlayers().map((p) => p.slug));
  if (input.playerSlugs.some((slug) => !known.has(slug))) {
    return 'Ukjent spiller.';
  }

  return null;
}

export async function saveMedia(input: MediaInput): Promise<MediaActionResult> {
  const supabase = await adminClient();
  if (!supabase) return { error: 'Ikke tilgang.' };

  const invalid = validate(input);
  if (invalid) return { error: invalid };

  const isImage = input.source === 'image';
  const { error } = await supabase.rpc('media_save', {
    p_id: input.id ?? undefined,
    p_kind: input.kind,
    p_youtube_id: isImage ? undefined : parseYoutubeId(input.youtube)!.id,
    p_image_file: isImage ? input.imageFile : undefined,
    p_vertical: input.vertical,
    p_title: input.title.trim(),
    p_alt: input.alt.trim() || undefined,
    p_season_number: input.season ?? undefined,
    p_game_slug: input.gameSlug ?? undefined,
    p_player_slugs: input.playerSlugs,
  });

  if (error) {
    if (error.code === '23505') {
      return {
        error: 'Denne videoen eller dette bildet er allerede lagt inn.',
      };
    }
    return { error: 'Kunne ikke lagre. Prøv igjen.' };
  }

  revalidateSite();
  return { error: null };
}

export async function deleteMedia(id: string): Promise<MediaActionResult> {
  const supabase = await adminClient();
  if (!supabase) return { error: 'Ikke tilgang.' };

  const { error } = await supabase.from('media_item').delete().eq('id', id);
  if (error) return { error: 'Kunne ikke slette. Prøv igjen.' };

  revalidateSite();
  return { error: null };
}

export interface YoutubeLookup {
  status: YoutubeStatus;
  id: string | null;
  isShort: boolean;
  title: string | null;
}

/**
 * oEmbed for the title and whether the video can be embedded. The URL is
 * built only from a parsed id, never from what the client sent.
 */
export async function lookupYoutube(input: string): Promise<YoutubeLookup> {
  const parsed = parseYoutubeId(input);
  if (!parsed)
    return { status: 'invalid', id: null, isShort: false, title: null };

  if (!(await adminClient())) {
    return { status: 'unreachable', ...parsed, title: null };
  }

  const status = await youtubeStatus(parsed.id);
  return { ...parsed, ...status };
}
