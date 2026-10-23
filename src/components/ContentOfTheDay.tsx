import SectionLabel from './SectionLabel';

/**
 * Not built yet: the frame, with placeholders. Mirrors RecordOfTheDay's
 * anatomy so the two halves of the row match.
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
