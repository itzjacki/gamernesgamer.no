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
      </div>
    </section>
  );
}
