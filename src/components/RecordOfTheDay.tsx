import Link from 'next/link';
import { getRecordsView } from '@/lib/results/queries';
import { recordPlateGroups } from '@/lib/record-plates';
import { todayInNorway } from '@/lib/site-state';
import RecordPlate from './RecordPlate';
import SectionLabel from './SectionLabel';

/**
 * One /records plate per Norwegian calendar day, the same for everyone. The
 * days step through the held records in wall order and wrap.
 */

export default async function RecordOfTheDay() {
  const records = await getRecordsView();
  const plates = recordPlateGroups(records)
    .flatMap((group) => group.plates)
    .filter((plate) => plate.entries.some((entry) => entry.rank === 1));
  if (plates.length === 0) return null;

  // A calendar date parses to UTC midnight, so this is a whole day count.
  const dayNumber = Date.parse(todayInNorway()) / 86_400_000;
  const plate = plates[dayNumber % plates.length];

  return (
    <section
      aria-labelledby='dagens-rekord'
      className='flex flex-col gap-6 sm:row-span-2 sm:grid sm:grid-rows-subgrid'
    >
      <SectionLabel as='h2'>
        <span id='dagens-rekord'>Dagens rekord</span>
      </SectionLabel>

      <div className='border-border bg-bg grid grid-rows-[1fr_auto] border sm:min-h-80'>
        {/* A grid, so the plate stretches to the frame's full height. */}
        <ul className='grid'>
          <RecordPlate {...plate} footerRow={false} />
        </ul>

        <Link
          href={`/records#${plate.id}`}
          className='group border-border focus-visible:outline-accent flex h-12 items-center border-t px-5 font-mono text-xs tracking-widest uppercase focus-visible:outline-2 focus-visible:-outline-offset-2'
        >
          <span className='text-text group-hover:text-accent underline underline-offset-4 transition-colors duration-150'>
            Gå til rekord
          </span>
        </Link>
      </div>
    </section>
  );
}
