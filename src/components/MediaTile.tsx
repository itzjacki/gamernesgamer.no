import { MEDIA_LABELS } from '@/lib/media/labels';
import { mediaAnchor, type MediaItemView } from '@/lib/media/view-models';
import MediaImageViewer from './MediaImageViewer';
import MediaPlayer from './MediaPlayer';

interface Props {
  item: MediaItemView;
  /** Replaces the YouTube thumbnail (a game intro uses the game's own image). */
  poster?: string;
  /** Rendered width for next/image; the default fits a two-column grid. */
  sizes?: string;
  /** Carries the /content anchor; only one tile per item may. */
  anchor?: boolean;
  /** Replaces the footer's title (the career row captions by season). */
  caption?: string;
}

export function seasonCode(season: number | null): string {
  return season === null ? MEDIA_LABELS.noSeasonCode : `S${season}`;
}

/** The footer row shared by tiles, the viewer and Dagens content. */
export function MediaCaption({
  item,
  text,
}: {
  item: MediaItemView;
  text?: string;
}) {
  return (
    <>
      <span className='text-text-muted shrink-0 font-mono text-xs tracking-wide uppercase sm:tracking-widest'>
        {seasonCode(item.season)}
      </span>
      <span className='text-text truncate text-sm'>{text ?? item.title}</span>
    </>
  );
}

/**
 * The media area: a click-to-play video or an image that opens the viewer.
 * Fills its parent, which sets the size and aspect ratio.
 */
export function MediaArea({
  item,
  poster,
  sizes,
  fit,
  titled = false,
}: {
  item: MediaItemView;
  poster?: string;
  sizes: string;
  fit?: 'cover' | 'contain';
  /** The season code and title on the image, for a frame without a title row. */
  titled?: boolean;
}) {
  const { source } = item;
  const label = titled ? <MediaCaption item={item} /> : undefined;

  if (source.type === 'youtube') {
    return (
      <MediaPlayer
        youtubeId={source.youtubeId}
        title={item.title}
        poster={poster}
        fit={fit ?? 'cover'}
        label={label}
      />
    );
  }

  return (
    <MediaImageViewer
      src={source.src}
      width={source.width}
      height={source.height}
      alt={item.alt}
      caption={<MediaCaption item={item} />}
      // Memes are never cropped; photos may be.
      fit={fit ?? (item.kind === 'photo' ? 'cover' : 'contain')}
      sizes={sizes}
      label={label}
    />
  );
}

export default function MediaTile({
  item,
  poster,
  sizes = '(min-width: 640px) 400px, 100vw',
  anchor = false,
  caption,
}: Props) {
  return (
    <div
      id={anchor ? mediaAnchor(item.id) : undefined}
      className='border-border bg-bg hover:border-accent focus-within:border-accent flex scroll-mt-8 flex-col border transition-colors duration-150'
    >
      <div
        className={`bg-surface relative overflow-hidden ${item.vertical ? 'aspect-[9/16]' : 'aspect-video'}`}
      >
        <MediaArea item={item} poster={poster} sizes={sizes} />
      </div>
      <p className='border-border flex h-12 items-center gap-3 border-t px-5'>
        <MediaCaption item={item} text={caption} />
      </p>
    </div>
  );
}
