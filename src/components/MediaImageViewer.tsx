'use client';

import { useRef } from 'react';
import Image from 'next/image';

interface Props {
  src: string;
  width: number;
  height: number;
  alt: string;
  /** Shown under the image in the viewer. */
  caption: React.ReactNode;
  /** `contain` for memes and tall images: never cropped in the tile. */
  fit: 'cover' | 'contain';
  /** The tile's rendered width, for next/image's srcset. */
  sizes: string;
  /** A title bar on the image, bottom left (Dagens content). */
  label?: React.ReactNode;
}

/**
 * The site's one image viewer: a native modal <dialog>. Escape, the close
 * button and a click on the backdrop close it; the browser returns focus to
 * the tile. Deliberately bare: no zoom, no paging, no animation.
 */
export default function MediaImageViewer({
  src,
  width,
  height,
  alt,
  caption,
  fit,
  sizes,
  label,
}: Props) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  return (
    <>
      <button
        type='button'
        onClick={() => dialogRef.current?.showModal()}
        aria-haspopup='dialog'
        className='focus-visible:outline-accent absolute inset-0 size-full cursor-zoom-in focus-visible:outline-2 focus-visible:outline-offset-2'
      >
        <Image
          src={src}
          alt={alt}
          fill
          sizes={sizes}
          className={fit === 'cover' ? 'object-cover' : 'object-contain'}
        />
        {label && (
          <span
            aria-hidden='true'
            className='border-border bg-bg absolute bottom-0 left-0 flex h-10 max-w-full min-w-0 items-center gap-3 border-t border-r px-4'
          >
            {label}
          </span>
        )}
      </button>

      <dialog
        ref={dialogRef}
        // A click on the ::backdrop lands on the dialog itself.
        onClick={(e) => {
          if (e.target === e.currentTarget) e.currentTarget.close();
        }}
        className='border-border bg-bg text-text backdrop:bg-bg m-auto max-h-svh max-w-[min(100vw,1200px)] overflow-hidden border p-0'
      >
        <div className='flex flex-col'>
          <Image
            src={src}
            alt={alt}
            width={width}
            height={height}
            sizes='(min-width: 1200px) 1200px, 100vw'
            className='h-auto max-h-[calc(100svh-3rem)] w-auto max-w-full object-contain'
          />
          <div className='border-border flex h-12 items-center gap-3 border-t pl-5'>
            <div className='flex min-w-0 flex-1 items-center gap-3'>
              {caption}
            </div>
            <form method='dialog'>
              <button
                type='submit'
                aria-label='Lukk'
                className='border-border text-text-muted hover:text-text-accent focus-visible:outline-accent grid size-12 place-items-center border-l transition-colors duration-150 focus-visible:outline-2 focus-visible:-outline-offset-2'
              >
                <svg
                  viewBox='0 0 10 10'
                  aria-hidden='true'
                  className='size-2.5 stroke-current'
                >
                  <path d='M1 1 L9 9 M9 1 L1 9' strokeWidth='1.5' />
                </svg>
              </button>
            </form>
          </div>
        </div>
      </dialog>
    </>
  );
}
