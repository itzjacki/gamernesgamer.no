const ID_PATTERN = /^[A-Za-z0-9_-]{11}$/;

const YOUTUBE_HOSTS = new Set([
  'youtube.com',
  'www.youtube.com',
  'm.youtube.com',
  'music.youtube.com',
  'youtube-nocookie.com',
  'www.youtube-nocookie.com',
]);

/** Path prefixes whose next segment is the video id. */
const ID_PATH_PREFIXES = ['shorts', 'embed', 'live', 'v'];

export interface ParsedYoutube {
  id: string;
  /** The link was a /shorts/ URL: prefills the item's `vertical`. */
  isShort: boolean;
}

/**
 * The 11-character video id from any YouTube link form or a bare id; null
 * when it isn't one. Tracking and playlist parameters (`si`, `list`, `t`) are
 * dropped with the rest of the URL. Runs in /admin on the client for instant
 * feedback and again in the save action.
 */
export function parseYoutubeId(input: string): ParsedYoutube | null {
  const value = input.trim();
  if (ID_PATTERN.test(value)) return { id: value, isShort: false };

  let url: URL;
  try {
    url = new URL(/^https?:\/\//i.test(value) ? value : `https://${value}`);
  } catch {
    return null;
  }

  const host = url.hostname.toLowerCase();
  const segments = url.pathname.split('/').filter(Boolean);
  let id: string | null = null;
  let isShort = false;

  if (host === 'youtu.be' || host === 'www.youtu.be') {
    id = segments[0] ?? null;
  } else if (YOUTUBE_HOSTS.has(host)) {
    if (segments[0] === 'watch') {
      id = url.searchParams.get('v');
    } else if (ID_PATH_PREFIXES.includes(segments[0] ?? '')) {
      id = segments[1] ?? null;
      isShort = segments[0] === 'shorts';
    }
  }

  return id && ID_PATTERN.test(id) ? { id, isShort } : null;
}

/**
 * `maxres` is 1280×720 but missing for some videos, and then YouTube answers
 * with a 120×90 placeholder image rather than an error. `hq` always exists
 * (480×360, 4:3 with letterbox bars), so it is the fallback.
 */
export function youtubeThumbnailUrl(id: string, size: 'maxres' | 'hq'): string {
  return `https://i.ytimg.com/vi/${id}/${size === 'maxres' ? 'maxresdefault' : 'hqdefault'}.jpg`;
}

/** The width of YouTube's stand-in for a missing thumbnail size. */
export const YOUTUBE_PLACEHOLDER_WIDTH = 120;

export function youtubeEmbedUrl(id: string): string {
  return `https://www.youtube-nocookie.com/embed/${id}?autoplay=1&playsinline=1&rel=0`;
}

export function youtubeWatchUrl(id: string): string {
  return `https://www.youtube.com/watch?v=${id}`;
}
