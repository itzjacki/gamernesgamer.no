import type { Metadata } from 'next';
import { getRecordsView } from '@/lib/results/queries';
import { recordPlateGroups } from '@/lib/record-plates';
import Heading from '@/components/Heading';
import SectionLabel from '@/components/SectionLabel';
import CareerBoard from '@/components/CareerBoard';
import RecordPlate from '@/components/RecordPlate';
import TagCrowns from '@/components/TagCrowns';

export const metadata: Metadata = {
  title: 'Rekorder',
};

const wall =
  'border-border bg-border grid grid-cols-1 gap-px border sm:grid-cols-2';

export default async function RecordsPage() {
  const records = await getRecordsView();

  return (
    <>
      <section className='flex flex-col gap-4 pt-8'>
        <Heading as='h1' aboveLine='GG - Alle sesonger'>
          Rekorder
        </Heading>
      </section>

      {records.board.length > 0 && (
        <section id='sammenlagt' className='flex flex-col gap-6'>
          <SectionLabel>Sammenlagtscore</SectionLabel>
          <CareerBoard rows={records.board} seasons={records.seasons} />
        </section>
      )}

      <section id='rekorder' className='flex flex-col gap-10'>
        {recordPlateGroups(records).map((group) => (
          <div key={group.label} className='flex flex-col gap-6'>
            <SectionLabel>{group.label}</SectionLabel>
            <ul className={wall}>
              {group.plates.map((plate) => (
                <RecordPlate key={plate.id} {...plate} />
              ))}
            </ul>
          </div>
        ))}
      </section>

      <section id='kategorier' className='flex flex-col gap-6'>
        <SectionLabel>Best per spillkategori</SectionLabel>
        <TagCrowns
          crowns={records.tagCrowns}
          crownsWithoutOwnPicks={records.tagCrownsWithoutOwnPicks}
        />
      </section>
    </>
  );
}
