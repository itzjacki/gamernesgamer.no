import Link from 'next/link';
import { getMediaOfTheDay } from '@/lib/media/queries';
import { MediaArea } from './MediaTile';
import SectionLabel from './SectionLabel';
import { MUTED_THUMB_TONE } from './portrait-tone';

/**
 * One media item per Norwegian calendar day, over every item, the same for
 * everyone. Mirrors RecordOfTheDay's anatomy so the two halves of the row
 * match: the item's title sits on the image beside the play key, so the
 * footer row is free for the link to /content. The frame isn't 16:9, so its
 * height never follows the item: landscape video fills it, vertical items
 * and images are pillarboxed.
 */

export default async function ContentOfTheDay() {
  const item = await getMediaOfTheDay();

  return (
    <section
      aria-labelledby='dagens-content'
      className='flex flex-col gap-6 sm:row-span-2 sm:grid sm:grid-rows-subgrid'
    >
      <SectionLabel as='h2'>
        <span id='dagens-content'>Dagens content</span>
      </SectionLabel>

      <div className='border-border bg-bg grid grid-rows-[1fr_auto] border sm:min-h-80'>
        {item ? (
          <>
            <div
              className={`bg-surface relative min-h-60 overflow-hidden sm:min-h-0 ${MUTED_THUMB_TONE}`}
            >
              <MediaArea
                item={item}
                sizes='(min-width: 640px) 400px, 100vw'
                titled
                fit={
                  item.source.type === 'youtube' && !item.vertical
                    ? 'cover'
                    : 'contain'
                }
              />
            </div>

            <Link
              href='/content'
              className='group border-border focus-visible:outline-accent flex h-12 items-center border-t px-5 font-mono text-xs tracking-wide uppercase focus-visible:outline-2 focus-visible:-outline-offset-2 sm:tracking-widest'
            >
              <span className='text-text group-hover:text-text-accent underline underline-offset-4 transition-colors duration-150'>
                Se alt av content
              </span>
            </Link>
          </>
        ) : (
          <>
            <div className='bg-surface flex min-h-60 items-center justify-center sm:min-h-0'>
              <span className='text-text-muted font-mono text-xs tracking-wide uppercase sm:tracking-widest'>
                Dette kommer snart
              </span>
            </div>

            <p className='border-border flex h-12 items-center gap-3 border-t px-5'>
              <span className='text-text-muted shrink-0 font-mono text-xs tracking-wide uppercase sm:tracking-widest'>
                S00
              </span>
              <span className='text-text truncate text-sm'>Kommer snart</span>
            </p>
          </>
        )}
      </div>
    </section>
  );
}
