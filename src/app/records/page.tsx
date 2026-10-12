import type { Metadata } from 'next';
import { getRecordsView } from '@/lib/results/queries';
import type { RecordEntry } from '@/lib/results/view-models';
import Heading from '@/components/Heading';
import SectionLabel from '@/components/SectionLabel';
import CareerBoard from '@/components/CareerBoard';
import RecordPlate from '@/components/RecordPlate';
import TagCrowns from '@/components/TagCrowns';

/*
 * TODO(copy): every label on this page is best-effort placeholder Norwegian —
 * the title, the section eyebrows, each record's name, unit line and
 * disclosure label. Needs Jakob's pass.
 */

export const metadata: Metadata = {
  title: 'Rekorder',
};

/** "S1–S4" for a run of seasons, or just "S3" when it is one. */
function seasonSpan(numbers: number[]) {
  const first = Math.min(...numbers);
  const last = Math.max(...numbers);
  return first === last ? `S${first}` : `S${first}–S${last}`;
}

const wall =
  'border-border bg-border grid grid-cols-1 gap-px border sm:grid-cols-2';
const count = (entry: RecordEntry) => String(entry.value);

export default async function RecordsPage() {
  const records = await getRecordsView();

  const allSeasons = `GG · ${seasonSpan(records.seasons.map((s) => s.seasonNumber))}`;
  /** The scope stamp for a record that is about particular games. */
  const gameScope = (entries: RecordEntry[]) => {
    const holder = entries.find((e) => e.rank === 1);
    return holder && holder.games.length > 0
      ? `GG · ${seasonSpan(holder.games.map((g) => g.seasonNumber))}`
      : allSeasons;
  };

  return (
    <>
      <section className='flex flex-col gap-4 pt-8'>
        <Heading as='h1' aboveLine='GG - Alle sesonger'>
          Rekorder
        </Heading>
      </section>

      {records.board.length > 0 && (
        <section id='sammenlagt' className='flex flex-col gap-6'>
          <SectionLabel>Sammenlagt</SectionLabel>
          <CareerBoard rows={records.board} seasons={records.seasons} />
        </section>
      )}

      <section id='rekorder' className='flex flex-col gap-10'>
        <div className='flex flex-col gap-6'>
          <SectionLabel>Seire</SectionLabel>
          <ul className={wall}>
            <RecordPlate
              id='flest-seire'
              label='Flest spillseire'
              scope={allSeasons}
              entries={records.mostGameWins}
              figure={count}
              unit={() => 'spill vunnet'}
              detailLabel='Vis spillene'
            />
            <RecordPlate
              id='spillspesialist'
              label='Spillspesialist'
              scope={allSeasons}
              entries={records.titleSpecialist}
              figure={count}
              unit={(e) => `av ${e.outOf} · ${e.title?.name}`}
              detailLabel='Vis spillene'
            />
            <RecordPlate
              id='hjemmebane'
              label='Hjemmebane'
              scope={allSeasons}
              entries={records.homeTurf}
              figure={count}
              unit={(e) => `seire i ${e.outOf} egne spillvalg`}
              detailLabel='Vis spillene'
            />
            <RecordPlate
              id='bortebane'
              label='Bortebane'
              scope={allSeasons}
              entries={records.awayWins}
              figure={count}
              unit={(e) => `seire i ${e.outOf} av andres spillvalg`}
              detailLabel='Vis spillene'
            />
          </ul>
        </div>

        <div className='flex flex-col gap-6'>
          <SectionLabel>Rekker og sesonger</SectionLabel>
          <ul className={wall}>
            <RecordPlate
              id='seiersrekke'
              label='Lengste seiersrekke'
              scope={gameScope(records.longestWinStreak)}
              entries={records.longestWinStreak}
              figure={count}
              unit={() => 'seire på rad'}
              detailLabel='Vis spillene'
            />
            <RecordPlate
              id='topp-to-rekke'
              label='Lengste topp to-rekke'
              scope={gameScope(records.longestTopTwoStreak)}
              entries={records.longestTopTwoStreak}
              figure={count}
              unit={() => 'spill på rad som nummer én eller to'}
              detailLabel='Vis spillene'
            />
            <RecordPlate
              id='beste-sesong'
              label='Beste sesong'
              scope={gameScope(records.bestSeason)}
              entries={records.bestSeason}
              figure={(e) => e.value.toFixed(2)}
              unit={(e) => `snittplassering · ${e.outOf} spill`}
              detailLabel='Vis spillene'
            />
            <RecordPlate
              id='poenglikhet'
              label='Vunnet på poenglikhet'
              scope={allSeasons}
              entries={records.tiebreaks}
              figure={(e) => `${e.value}–${(e.outOf ?? 0) - e.value}`}
              unit={() => 'sesonger avgjort på plassering'}
              detailLabel='Vis sesongene'
              detail={(holder) => (
                <ul className='flex flex-col'>
                  {holder.tiebreaks?.map((t) => (
                    <li
                      key={`${t.season.seasonSlug}-${t.opponent.slug}`}
                      className='border-border grid grid-cols-[auto_1fr] items-baseline gap-4 border-t py-2 text-sm first:border-t-0'
                    >
                      <span className='text-text-muted font-mono tabular-nums'>
                        <span className='sr-only'>sesong </span>
                        <span aria-hidden='true'>S</span>
                        {t.season.seasonNumber}
                      </span>
                      <span>
                        {t.won ? 'foran' : 'bak'} {t.opponent.name}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            />
          </ul>
        </div>
      </section>

      <section id='kategorier' className='flex flex-col gap-6'>
        <SectionLabel>Best per kategori</SectionLabel>
        <TagCrowns crowns={records.tagCrowns} />
      </section>
    </>
  );
}
