import { getArchiveTotals } from '@/lib/results/queries';
import SectionLabel from './SectionLabel';
import Readout from './Readout';

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
          <Readout
            key={label}
            term
            layout='inline'
            size='s'
            label={label}
            value={value}
            className={`border-border h-10 min-w-0 px-5 sm:h-auto sm:border-b-0 ${i % 2 === 0 ? 'border-r' : ''} ${i < 2 ? 'border-b' : ''} ${i === 1 ? 'sm:border-r' : ''}`}
          />
        ))}
      </dl>
    </section>
  );
}
