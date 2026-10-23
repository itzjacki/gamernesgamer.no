import SectionLabel from './SectionLabel';

/**
 * The front page's content of the day: one piece of tournament content (a
 * photo, a clip, a moment) that will rotate daily like the record of the day
 * beside it. Not built yet — this is its frame, with placeholders for the
 * media and its caption.
 *
 * The same anatomy as RecordOfTheDay so the two halves of the row match: the
 * label over the frame, then inside it the media area stretching to the
 * frame's height and a 48px caption cell along the foot, level with the
 * record's door cell. From `sm` up the frame is at least eight grid cells
 * tall, and the parent grid equalises it with the record's frame.
 */

export default function ContentOfTheDay() {
  return (
    <section
      aria-labelledby='dagens-innhold'
      className='flex flex-col gap-6 sm:row-span-2 sm:grid sm:grid-rows-subgrid'
    >
      <SectionLabel as='h2'>
        <span id='dagens-innhold'>Dagens content</span>
      </SectionLabel>

      <div className='border-border bg-bg grid grid-rows-[1fr_auto] border sm:min-h-80'>
        {/* The media: a photo or a clip. A recessed surface until it exists. */}
        <div className='bg-surface flex min-h-60 items-center justify-center sm:min-h-0'>
          <span className='text-text-muted font-mono text-xs tracking-widest uppercase'>
            {/* TODO(copy): stands in for the picture or clip. */}
            [Bilde / klipp]
          </span>
        </div>

        <p className='border-border flex h-12 items-center gap-3 border-t px-5'>
          {/* TODO(copy): the caption and where the content is from. */}
          <span className='text-text-muted shrink-0 font-mono text-xs tracking-widest uppercase'>
            [S03]
          </span>
          <span className='text-text truncate text-sm'>[Bildetekst]</span>
        </p>
      </div>
    </section>
  );
}
