import 'server-only';

export type YoutubeStatus =
  | 'ok'
  | 'embed_disabled'
  | 'not_found'
  | 'invalid'
  | 'unreachable';

/**
 * YouTube oEmbed: the title, and whether the video still exists and can be
 * embedded (the click-to-load player fails otherwise). Callers pass a parsed
 * id only, never a client-supplied URL. Not a server action on purpose: it
 * would be a public, unauthenticated proxy to YouTube.
 */
export async function youtubeStatus(
  id: string,
): Promise<{ status: YoutubeStatus; title: string | null }> {
  const watch = encodeURIComponent(`https://www.youtube.com/watch?v=${id}`);
  try {
    const res = await fetch(
      `https://www.youtube.com/oembed?url=${watch}&format=json`,
    );
    if (res.ok) {
      const body = (await res.json()) as { title?: unknown };
      return {
        status: 'ok',
        title: typeof body.title === 'string' ? body.title : null,
      };
    }
    if (res.status === 401 || res.status === 403) {
      return { status: 'embed_disabled', title: null };
    }
    if (res.status === 400 || res.status === 404) {
      return { status: 'not_found', title: null };
    }
    return { status: 'unreachable', title: null };
  } catch {
    return { status: 'unreachable', title: null };
  }
}
