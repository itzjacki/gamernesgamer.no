'use client';

import { useEffect, useRef, useState } from 'react';
import {
  YOUTUBE_PLACEHOLDER_WIDTH,
  youtubeEmbedUrl,
  youtubeThumbnailUrl,
} from '@/lib/media/youtube';

interface Props {
  youtubeId: string;
  title: string;
  /** Replaces YouTube's thumbnail (a game intro uses the game's own image). */
  poster?: string;
  /** `contain` for vertical videos, so they are pillarboxed, never cropped. */
  fit: 'cover' | 'contain';
  /** Shown beside the play key (Dagens content, which has no title row). */
  label?: React.ReactNode;
}

/**
 * A thumbnail that becomes the YouTube player on click, so a page of videos
 * loads no iframes until one is played. Fills its parent, which sets the
 * aspect ratio. autoplay=1 makes the click play; iOS may still want a second
 * tap.
 */
export default function MediaPlayer({
  youtubeId,
  title,
  poster,
  fit,
  label,
}: Props) {
  const [playing, setPlaying] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);

  const fallback = poster ? null : youtubeThumbnailUrl(youtubeId, 'hq');

  // A missing maxres loads fine as a tiny placeholder, so check the size,
  // not just for errors. Set on the element: React never touches `src` again
  // since the prop doesn't change.
  const swapIfPlaceholder = (img: HTMLImageElement) => {
    if (fallback && img.naturalWidth <= YOUTUBE_PLACEHOLDER_WIDTH) {
      img.src = fallback;
    }
  };

  // An image that loaded before hydration fired its load event unheard.
  useEffect(() => {
    const img = imgRef.current;
    if (img?.complete) swapIfPlaceholder(img);
    // Once, on mount.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // The button unmounts on click; without this, focus drops to <body>.
  useEffect(() => {
    if (playing) iframeRef.current?.focus();
  }, [playing]);

  if (playing) {
    return (
      <iframe
        ref={iframeRef}
        className='absolute inset-0 size-full'
        src={youtubeEmbedUrl(youtubeId)}
        title={title}
        allow='accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share; fullscreen'
        allowFullScreen
        referrerPolicy='strict-origin-when-cross-origin'
      />
    );
  }

  return (
    <button
      type='button'
      onClick={() => setPlaying(true)}
      aria-label={`Spill av: ${title}`}
      className='group focus-visible:outline-accent absolute inset-0 size-full cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2'
    >
      <img
        ref={imgRef}
        src={poster ?? youtubeThumbnailUrl(youtubeId, 'maxres')}
        onLoad={(e) => swapIfPlaceholder(e.currentTarget)}
        onError={(e) => {
          if (fallback && e.currentTarget.src !== fallback) {
            e.currentTarget.src = fallback;
          }
        }}
        alt=''
        loading='lazy'
        decoding='async'
        className={`size-full ${fit === 'cover' ? 'object-cover' : 'object-contain'}`}
      />
      <span
        aria-hidden='true'
        className='border-border bg-bg absolute bottom-0 left-0 flex max-w-full border-t border-r'
      >
        <span className='text-text group-hover:text-text-accent group-focus-visible:text-text-accent grid size-10 shrink-0 place-items-center transition-colors duration-150 motion-reduce:transition-none'>
          <svg viewBox='0 0 10 10' className='size-2.5 fill-current'>
            <path d='M1 0 L10 5 L1 10 Z' />
          </svg>
        </span>
        {label && (
          <span className='border-border flex h-10 min-w-0 items-center gap-3 border-l px-4'>
            {label}
          </span>
        )}
      </span>
    </button>
  );
}
