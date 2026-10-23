import { getArchiveTotals } from '@/lib/results/queries';
import SectionLabel from './SectionLabel';

/** Body-size counts: the countdown is the page's only big numerals. */

export default async function ArchiveTotals() {
  const totals = await getArchiveTotals();

  const cells = [
    { label: 'Sesonger', value: totals.seasons },
    { label: 'Spill', value: totals.games },
    { label: 'Matcher spilt', value: totals.matches },
    { label: 'Power-ups brukt', value: totals.powerUpsFired },
  ];

  return (
    <section aria-labelledby='i-tall' className='flex flex-col gap-6'>
      <SectionLabel as='h2'>
        <span id='i-tall'>Gjennom tidene</span>
      </SectionLabel>

      {/* The frame's border closes the outer edges; each cell draws only the
          hairlines between cells. */}
      <dl className='border-border bg-bg grid grid-cols-2 border sm:h-10 sm:grid-cols-4'>
        {cells.map(({ label, value }, i) => (
          <div
            key={label}
            className={`border-border flex h-12 min-w-0 items-center justify-between gap-3 px-5 sm:h-auto sm:border-b-0 ${i % 2 === 0 ? 'border-r' : ''} ${i < 2 ? 'border-b' : ''} ${i === 1 ? 'sm:border-r' : ''}`}
          >
            <dt className='text-text-muted truncate font-mono text-xs tracking-wide uppercase sm:tracking-widest'>
              {label}
            </dt>
            <dd className='text-text font-mono text-sm tabular-nums'>
              {value}
            </dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
