import Link from 'next/link';
import { getRecordsView } from '@/lib/results/queries';
import { recordPlateGroups } from '@/lib/record-plates';
import { todayInNorway } from '@/lib/site-state';
import RecordPlate from './RecordPlate';
import SectionLabel from './SectionLabel';

/**
 * The front page's record of the day: one plate from the /records wall, the
 * same for everyone on a given Norwegian calendar day. The days step through
 * the plates in wall order and wrap, so every record gets its day; a record
 * nobody holds yet is left out of the rotation. The day itself is not shown.
 *
 * Opens with its label over the frame, like a /records section. On the front
 * page it shares a row with ContentOfTheDay from `sm` up, each taking half
 * the width, so the plate stands at its /records wall width. Inside the
 * frame: the plate, then the door to the plate on /records as one full-width
 * 48px cell, level with the caption cell beside it.
 *
 * From `sm` up the frame is at least eight grid cells tall; the plate
 * stretches to fill it (its figure and runners-up sit at its foot), and the
 * parent grid equalises it with the content of the day's frame.
 *
 * Picked on the server per request, so there is nothing to hydrate.
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
